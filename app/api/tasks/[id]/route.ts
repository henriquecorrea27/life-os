import { prisma } from '@/lib/db';
import { fail, ok, readBody, TASK_INCLUDE } from '@/lib/api-helpers';
import { dateKeyFromStored, dateKeyToStored, todayKey } from '@/lib/dates';
import { nextOccurrence } from '@/lib/recurrence';
import { taskToDTO } from '@/lib/serialize';
import { updateTaskSchema } from '@/lib/validations/task';
import { buildSearchText } from '@/lib/utils';
import { scheduleBackup } from '@/lib/backup';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id }, include: TASK_INCLUDE });
  if (!task) return fail('Tarefa não encontrada', 404);
  return ok(taskToDTO(task));
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const { data, error } = await readBody(request, updateTaskSchema);
  if (error) return error;

  const current = await prisma.task.findUnique({ where: { id }, include: TASK_INCLUDE });
  if (!current) return fail('Tarefa não encontrada', 404);

  const isCompleting = data.completed === true && !current.completed;
  const isReopening = data.completed === false && current.completed;

  const updated = await prisma.$transaction(async (tx) => {
    if (data.subtasks) {
      const keptIds = data.subtasks.map((s) => s.id).filter(Boolean) as string[];
      await tx.subtask.deleteMany({
        where: { taskId: id, id: { notIn: keptIds.length ? keptIds : ['__none__'] } },
      });
      for (const [index, subtask] of data.subtasks.entries()) {
        if (subtask.id) {
          await tx.subtask.update({
            where: { id: subtask.id },
            data: { title: subtask.title, completed: subtask.completed, order: index },
          });
        } else {
          await tx.subtask.create({
            data: { taskId: id, title: subtask.title, completed: subtask.completed, order: index },
          });
        }
      }
    }

    // PATCH é parcial: o alvo de busca precisa do texto JÁ mesclado, senão
    // editar só as notas apagaria o título do índice.
    const nextTitle = data.title ?? current.title;
    const nextNotes = data.notes !== undefined ? data.notes : current.notes;

    const task = await tx.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.title !== undefined || data.notes !== undefined
          ? { searchText: buildSearchText(nextTitle, nextNotes) }
          : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.dueDate !== undefined
          ? { dueDate: data.dueDate ? dateKeyToStored(data.dueDate) : null }
          : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        ...(data.recurrence !== undefined ? { recurrence: data.recurrence } : {}),
        ...(data.isFocus !== undefined ? { isFocus: data.isFocus } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
        ...(isCompleting ? { completed: true, completedAt: new Date(), isFocus: false } : {}),
        ...(isReopening ? { completed: false, completedAt: null } : {}),
      },
      include: TASK_INCLUDE,
    });

    // Tarefa recorrente concluída gera a próxima ocorrência e preserva o histórico
    // da que foi feita — nada é sobrescrito.
    if (isCompleting && current.recurrence) {
      const base = current.dueDate ? dateKeyFromStored(current.dueDate) : todayKey();
      const next = nextOccurrence(current.recurrence, base, todayKey());
      if (next) {
        const last = await tx.task.aggregate({ _max: { order: true } });
        await tx.task.create({
          data: {
            title: current.title,
            notes: current.notes,
            priority: current.priority,
            dueDate: dateKeyToStored(next),
            categoryId: current.categoryId,
            recurrence: current.recurrence,
            searchText: current.searchText,
            order: (last._max.order ?? 0) + 1,
            subtasks: current.subtasks.length
              ? {
                  create: current.subtasks.map((subtask, index) => ({
                    title: subtask.title,
                    order: index,
                  })),
                }
              : undefined,
          },
        });
      }
    }

    return task;
  });

  scheduleBackup();
  return ok(taskToDTO(updated));
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const exists = await prisma.task.findUnique({ where: { id } });
  if (!exists) return fail('Tarefa não encontrada', 404);
  await prisma.task.delete({ where: { id } });
  scheduleBackup();
  return ok({ id });
}
