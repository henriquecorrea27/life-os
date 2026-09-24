import { addDays, startOfWeek } from 'date-fns';
import { prisma } from '@/lib/db';
import { fail, ok } from '@/lib/api-helpers';
import { MOOD_META, type Mood } from '@/lib/constants';
import {
  dateKeyFromStored,
  dateKeyToLocal,
  dateKeyToStored,
  isValidDateKey,
  toDateKey,
  todayKey,
} from '@/lib/dates';
import type { ReviewResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Resumo da semana montado a partir do que já está registrado — nenhuma pergunta
 * a responder. A semana vai de segunda a domingo de propósito: assim o domingo é
 * o último dia, e revisar no domingo à noite fecha a semana em vez de abrir uma.
 *
 * O que ele NÃO faz: resumir em prosa o que você escreveu no diário. Isso exigiria
 * um modelo de linguagem. Em vez de inventar, o resumo cita os trechos na íntegra
 * (destaques e "poderia ser melhor"), que é o que você mesmo escreveu.
 */
function weekBounds(anchor: string) {
  const start = startOfWeek(dateKeyToLocal(anchor), { weekStartsOn: 1 });
  return { start: toDateKey(start), end: toDateKey(addDays(start, 6)) };
}

/** Intervalo de instantes reais que cobre os dias locais de `from` a `to`. */
function localRange(from: string, to: string) {
  const start = dateKeyToLocal(from);
  start.setHours(0, 0, 0, 0);
  const end = dateKeyToLocal(to);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function weekTotals(from: string, to: string) {
  const range = localRange(from, to);

  const [completed, missed] = await Promise.all([
    prisma.task.count({
      where: { completed: true, completedAt: { gte: range.start, lte: range.end } },
    }),
    prisma.taskMiss.count({
      where: { date: { gte: dateKeyToStored(from), lte: dateKeyToStored(to) } },
    }),
  ]);

  const planned = completed + missed;
  return { completed, missed, rate: planned > 0 ? completed / planned : null };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const anchor = searchParams.get('week') ?? todayKey();
  if (!isValidDateKey(anchor)) return fail('Semana inválida', 400);

  const { start, end } = weekBounds(anchor);
  const previous = weekBounds(toDateKey(addDays(dateKeyToLocal(start), -7)));
  const range = localRange(start, end);

  const [completedTasks, misses, entries, totals, previousTotals] = await Promise.all([
    prisma.task.findMany({
      where: { completed: true, completedAt: { gte: range.start, lte: range.end } },
      include: { category: true },
      orderBy: { completedAt: 'asc' },
    }),
    prisma.taskMiss.findMany({
      where: { date: { gte: dateKeyToStored(start), lte: dateKeyToStored(end) } },
      include: { task: { include: { category: true } } },
    }),
    prisma.journalEntry.findMany({
      where: { date: { gte: dateKeyToStored(start), lte: dateKeyToStored(end) } },
      orderBy: { date: 'asc' },
    }),
    weekTotals(start, end),
    weekTotals(previous.start, previous.end),
  ]);

  // Por categoria: o que foi feito e o que falhou lado a lado.
  const categories = new Map<
    string,
    { id: string; name: string; color: string; completed: number; missed: number }
  >();

  function bucket(id: string | null, name: string | null, color: string | null) {
    const key = id ?? '__none__';
    if (!categories.has(key)) {
      categories.set(key, {
        id: key,
        name: name ?? 'Sem categoria',
        color: color ?? '#A1A1AA',
        completed: 0,
        missed: 0,
      });
    }
    return categories.get(key) as NonNullable<ReturnType<typeof categories.get>>;
  }

  for (const task of completedTasks) {
    bucket(task.categoryId, task.category?.name ?? null, task.category?.color ?? null).completed += 1;
  }
  for (const miss of misses) {
    bucket(
      miss.task.categoryId,
      miss.task.category?.name ?? null,
      miss.task.category?.color ?? null,
    ).missed += 1;
  }

  // Tarefas que mais escaparam na semana — o material da revisão.
  const stalled = new Map<string, { id: string; title: string; color: string | null; times: number }>();
  for (const miss of misses) {
    const existing = stalled.get(miss.taskId);
    if (existing) existing.times += 1;
    else
      stalled.set(miss.taskId, {
        id: miss.taskId,
        title: miss.task.title,
        color: miss.task.category?.color ?? null,
        times: 1,
      });
  }

  const moods = entries.map((entry) => ({
    date: dateKeyFromStored(entry.date),
    mood: entry.mood as Mood,
    score: MOOD_META[entry.mood as Mood]?.score ?? 3,
  }));

  const best = [...moods].sort((a, b) => b.score - a.score)[0] ?? null;
  const worst = [...moods].sort((a, b) => a.score - b.score)[0] ?? null;

  const payload: ReviewResponse = {
    week: { start, end },
    totals,
    previousTotals,
    byCategory: [...categories.values()].sort(
      (a, b) => b.completed + b.missed - (a.completed + a.missed),
    ),
    stalled: [...stalled.values()].sort((a, b) => b.times - a.times).slice(0, 6),
    completedTasks: completedTasks.map((task) => ({
      id: task.id,
      title: task.title,
      date: task.completedAt ? toDateKey(task.completedAt) : start,
      categoryName: task.category?.name ?? null,
      categoryColor: task.category?.color ?? null,
    })),
    mood: {
      entries: moods,
      average: moods.length ? moods.reduce((sum, m) => sum + m.score, 0) / moods.length : null,
      best: best ? { date: best.date, mood: best.mood } : null,
      worst: worst && moods.length > 1 ? { date: worst.date, mood: worst.mood } : null,
      daysLogged: moods.length,
    },
    highlights: entries
      .filter((entry) => entry.gratitude?.trim())
      .map((entry) => ({ date: dateKeyFromStored(entry.date), text: entry.gratitude as string })),
    improvements: entries
      .filter((entry) => entry.improve?.trim())
      .map((entry) => ({ date: dateKeyFromStored(entry.date), text: entry.improve as string })),
  };

  return ok(payload);
}
