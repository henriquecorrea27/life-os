import { startOfDay, subDays } from 'date-fns';
import { prisma } from '@/lib/db';
import { ok } from '@/lib/api-helpers';
import { MOODS, MOOD_META, type Mood } from '@/lib/constants';
import { dateKeyFromStored, dateKeyToStored, shiftKey, toDateKey, todayKey } from '@/lib/dates';
import type { StatsResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

const WINDOW_DAYS = 180;

/** Conta dias consecutivos para trás; tolera "ainda não fiz hoje" começando em ontem. */
function streakFrom(days: Set<string>): { current: number; best: number } {
  const today = todayKey();
  let cursor = days.has(today) ? today : shiftKey(today, -1);
  let current = 0;
  while (days.has(cursor)) {
    current += 1;
    cursor = shiftKey(cursor, -1);
  }

  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of sorted) {
    run = previous && shiftKey(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }

  return { current, best };
}

export async function GET() {
  const now = new Date();
  const windowStart = startOfDay(subDays(now, WINDOW_DAYS));
  const today = todayKey();

  const [openCount, completedCount, overdueCount, completedRecent, allCompletedDates, entries, categories] =
    await Promise.all([
      prisma.task.count({ where: { completed: false } }),
      prisma.task.count({ where: { completed: true } }),
      prisma.task.count({
        where: { completed: false, dueDate: { lt: dateKeyToStored(today) } },
      }),
      prisma.task.findMany({
        where: { completed: true, completedAt: { gte: windowStart } },
        select: { completedAt: true, categoryId: true },
      }),
      prisma.task.findMany({
        where: { completed: true, completedAt: { not: null } },
        select: { completedAt: true },
      }),
      prisma.journalEntry.findMany({
        orderBy: { date: 'asc' },
        select: { date: true, mood: true },
      }),
      prisma.category.findMany({
        orderBy: [{ order: 'asc' }],
        include: {
          _count: { select: { tasks: true } },
          tasks: { select: { completed: true } },
        },
      }),
    ]);

  const completionMap = new Map<string, number>();
  for (const task of completedRecent) {
    if (!task.completedAt) continue;
    const key = toDateKey(task.completedAt);
    completionMap.set(key, (completionMap.get(key) ?? 0) + 1);
  }

  const completionByDay: StatsResponse['completionByDay'] = [];
  for (let i = WINDOW_DAYS; i >= 0; i -= 1) {
    const key = toDateKey(subDays(now, i));
    completionByDay.push({ date: key, completed: completionMap.get(key) ?? 0 });
  }

  const taskDays = new Set(
    allCompletedDates
      .map((task) => (task.completedAt ? toDateKey(task.completedAt) : null))
      .filter((value): value is string => Boolean(value)),
  );
  const journalDays = new Set(entries.map((entry) => dateKeyFromStored(entry.date)));

  const moodByDay = entries.map((entry) => ({
    date: dateKeyFromStored(entry.date),
    mood: entry.mood as Mood,
    score: MOOD_META[entry.mood as Mood]?.score ?? 3,
  }));

  const moodDistribution = MOODS.map((mood) => ({
    mood,
    count: entries.filter((entry) => entry.mood === mood).length,
  }));

  const payload: StatsResponse = {
    totals: {
      open: openCount,
      completed: completedCount,
      completedToday: completionMap.get(today) ?? 0,
      completedThisWeek: completionByDay.slice(-7).reduce((sum, day) => sum + day.completed, 0),
      overdue: overdueCount,
    },
    taskStreak: streakFrom(taskDays),
    journalStreak: streakFrom(journalDays),
    completionByDay,
    moodByDay,
    moodDistribution,
    byCategory: categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      completed: category.tasks.filter((task) => task.completed).length,
      open: category.tasks.filter((task) => !task.completed).length,
    })),
    journalCount: entries.length,
  };

  return ok(payload);
}
