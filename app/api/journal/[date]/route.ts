import { endOfDay, startOfDay } from 'date-fns';
import { prisma } from '@/lib/db';
import { fail, ok, readBody } from '@/lib/api-helpers';
import { dateKeyToLocal, dateKeyToStored, isValidDateKey } from '@/lib/dates';
import { journalToDTO } from '@/lib/serialize';
import { journalEntrySchema } from '@/lib/validations/journal';

type Params = { params: Promise<{ date: string }> };

async function completedTasksOn(dateKey: string) {
  const day = dateKeyToLocal(dateKey);
  const tasks = await prisma.task.findMany({
    where: {
      completed: true,
      completedAt: { gte: startOfDay(day), lte: endOfDay(day) },
    },
    include: { category: true },
    orderBy: { completedAt: 'asc' },
  });

  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    categoryColor: task.category?.color ?? null,
    categoryName: task.category?.name ?? null,
  }));
}

export async function GET(_request: Request, { params }: Params) {
  const { date } = await params;
  if (!isValidDateKey(date)) return fail('Data inválida', 400);

  const entry = await prisma.journalEntry.findUnique({
    where: { date: dateKeyToStored(date) },
  });

  return ok({
    date,
    entry: entry ? journalToDTO(entry) : null,
    completedTasks: await completedTasksOn(date),
  });
}

export async function PUT(request: Request, { params }: Params) {
  const { date } = await params;
  if (!isValidDateKey(date)) return fail('Data inválida', 400);

  const { data, error } = await readBody(request, journalEntrySchema.omit({ date: true }));
  if (error) return error;

  const stored = dateKeyToStored(date);
  const payload = {
    mood: data.mood,
    summary: data.summary ?? null,
    gratitude: data.gratitude ?? null,
    improve: data.improve ?? null,
    freeText: data.freeText ?? null,
  };

  const entry = await prisma.journalEntry.upsert({
    where: { date: stored },
    update: payload,
    create: { date: stored, ...payload },
  });

  return ok(journalToDTO(entry));
}

export async function DELETE(_request: Request, { params }: Params) {
  const { date } = await params;
  if (!isValidDateKey(date)) return fail('Data inválida', 400);

  const stored = dateKeyToStored(date);
  const entry = await prisma.journalEntry.findUnique({ where: { date: stored } });
  if (!entry) return fail('Entrada não encontrada', 404);

  await prisma.journalEntry.delete({ where: { date: stored } });
  return ok({ date });
}
