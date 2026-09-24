import { prisma } from '@/lib/db';
import { fail, ok, TASK_INCLUDE } from '@/lib/api-helpers';
import { scheduleBackup } from '@/lib/backup';
import { dateKeyToStored, shiftKey, todayKey } from '@/lib/dates';
import { taskToDTO } from '@/lib/serialize';

type Params = { params: Promise<{ id: string }> };

/**
 * "Não fiz hoje": registra a falha do dia e empurra a tarefa para amanhã.
 *
 * O registro é o que alimenta a taxa de conclusão — sem ele, uma tarefa que você
 * simplesmente reagenda todo dia pareceria, na estatística, nunca ter sido
 * prometida. Empurrar a data é o que mantém a lista de hoje honesta.
 */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return fail('Tarefa não encontrada', 404);
  if (task.completed) return fail('Tarefa já está concluída', 409);

  const today = todayKey();
  const stored = dateKeyToStored(today);

  const updated = await prisma.$transaction(async (tx) => {
    // upsert: marcar duas vezes no mesmo dia não vira duas falhas.
    await tx.taskMiss.upsert({
      where: { taskId_date: { taskId: id, date: stored } },
      update: {},
      create: { taskId: id, date: stored },
    });

    return tx.task.update({
      where: { id },
      data: { dueDate: dateKeyToStored(shiftKey(today, 1)), isFocus: false },
      include: TASK_INCLUDE,
    });
  });

  scheduleBackup();
  return ok(taskToDTO(updated));
}

/**
 * Desfaz a falha de hoje e traz a tarefa de volta para hoje.
 * Não restaura a data original de uma tarefa que já estava atrasada: ela volta
 * para o dia em que foi marcada, que é onde o "desfazer" a coloca de volta na vista.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const today = todayKey();
  const stored = dateKeyToStored(today);

  const miss = await prisma.taskMiss.findUnique({
    where: { taskId_date: { taskId: id, date: stored } },
  });
  if (!miss) return fail('Nenhuma falha registrada hoje para essa tarefa', 404);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.taskMiss.delete({ where: { id: miss.id } });
    return tx.task.update({
      where: { id },
      data: { dueDate: stored },
      include: TASK_INCLUDE,
    });
  });

  scheduleBackup();
  return ok(taskToDTO(updated));
}
