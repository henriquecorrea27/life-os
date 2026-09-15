import { endOfDay, startOfDay } from 'date-fns';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { fail, ok, readBody, TASK_INCLUDE } from '@/lib/api-helpers';
import { dateKeyToStored, shiftKey, todayKey } from '@/lib/dates';
import { taskToDTO } from '@/lib/serialize';
import { createTaskSchema } from '@/lib/validations/task';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') ?? 'all';
  const categoryId = searchParams.get('categoryId');
  const query = searchParams.get('q')?.trim();

  const today = todayKey();
  const todayStored = dateKeyToStored(today);
  const now = new Date();

  const filters: Prisma.TaskWhereInput[] = [];

  if (categoryId) filters.push({ categoryId });
  if (query) {
    filters.push({
      OR: [{ title: { contains: query } }, { notes: { contains: query } }],
    });
  }

  switch (view) {
    case 'today':
      // O dia inclui o que venceu antes e ainda está aberto, mais o que já foi
      // concluído hoje — é isso que alimenta o contador "5/8 concluídas".
      filters.push({
        OR: [
          { completed: false, dueDate: { lte: todayStored } },
          { completed: false, isFocus: true },
          { completed: true, completedAt: { gte: startOfDay(now), lte: endOfDay(now) } },
        ],
      });
      break;
    case 'upcoming':
      filters.push({
        completed: false,
        dueDate: {
          gte: dateKeyToStored(shiftKey(today, 1)),
          lte: dateKeyToStored(shiftKey(today, 7)),
        },
      });
      break;
    case 'focus':
      filters.push({ completed: false, isFocus: true });
      break;
    case 'completed':
      filters.push({ completed: true });
      break;
    case 'inbox':
      filters.push({ completed: false, dueDate: null });
      break;
    case 'all':
    default:
      if (searchParams.get('includeCompleted') !== 'true') {
        filters.push({ completed: false });
      }
      break;
  }

  const where: Prisma.TaskWhereInput = filters.length ? { AND: filters } : {};

  const tasks = await prisma.task.findMany({
    where,
    include: TASK_INCLUDE,
    orderBy:
      view === 'completed'
        ? [{ completedAt: 'desc' }]
        : [{ order: 'asc' }, { createdAt: 'asc' }],
    take: view === 'completed' ? 300 : undefined,
  });

  return ok(tasks.map(taskToDTO));
}

export async function POST(request: Request) {
  const { data, error } = await readBody(request, createTaskSchema);
  if (error) return error;

  if (data.categoryId) {
    const exists = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!exists) return fail('Categoria não encontrada', 404);
  }

  const last = await prisma.task.aggregate({ _max: { order: true } });
  const nextOrder = (last._max.order ?? 0) + 1;

  const task = await prisma.task.create({
    data: {
      title: data.title,
      notes: data.notes ?? null,
      priority: data.priority,
      dueDate: data.dueDate ? dateKeyToStored(data.dueDate) : null,
      categoryId: data.categoryId ?? null,
      recurrence: data.recurrence ?? null,
      isFocus: data.isFocus ?? false,
      order: nextOrder,
      subtasks: data.subtasks?.length
        ? {
            create: data.subtasks.map((title, index) => ({ title, order: index })),
          }
        : undefined,
    },
    include: TASK_INCLUDE,
  });

  return ok(taskToDTO(task), 201);
}
