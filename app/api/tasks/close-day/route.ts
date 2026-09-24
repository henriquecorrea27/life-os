import { prisma } from '@/lib/db';
import { ok } from '@/lib/api-helpers';
import { scheduleBackup } from '@/lib/backup';
import { dateKeyToStored, shiftKey, todayKey } from '@/lib/dates';

/**
 * "Fechar o dia": tudo que estava previsto para hoje (ou antes) e continua aberto
 * é registrado como não feito e empurrado para amanhã, de uma vez.
 *
 * Tarefas sem data ficam de fora de propósito: nunca foram prometidas para um dia
 * específico, então não deveriam pesar na taxa de conclusão de nenhum.
 */
export async function POST() {
  const today = todayKey();
  const stored = dateKeyToStored(today);
  const tomorrow = dateKeyToStored(shiftKey(today, 1));

  const pending = await prisma.task.findMany({
    where: { completed: false, dueDate: { not: null, lte: stored } },
    select: { id: true },
  });

  if (pending.length === 0) {
    return ok({ missed: 0, completedToday: await completedToday() });
  }

  await prisma.$transaction([
    ...pending.map((task) =>
      prisma.taskMiss.upsert({
        where: { taskId_date: { taskId: task.id, date: stored } },
        update: {},
        create: { taskId: task.id, date: stored },
      }),
    ),
    prisma.task.updateMany({
      where: { id: { in: pending.map((task) => task.id) } },
      data: { dueDate: tomorrow, isFocus: false },
    }),
  ]);

  scheduleBackup();
  return ok({ missed: pending.length, completedToday: await completedToday() });
}

async function completedToday(): Promise<number> {
  // completedAt é um instante real, não meia-noite UTC — comparamos com o dia local.
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  const next = new Date(day);
  next.setDate(next.getDate() + 1);

  return prisma.task.count({
    where: { completed: true, completedAt: { gte: day, lt: next } },
  });
}
