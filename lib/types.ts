import type { Mood, Priority } from './constants';
import type { DateKey } from './dates';

export interface CategoryDTO {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  order: number;
  taskCount?: number;
  openCount?: number;
}

export interface SubtaskDTO {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface TaskDTO {
  id: string;
  title: string;
  notes: string | null;
  completed: boolean;
  completedAt: string | null;
  priority: Priority;
  dueDate: DateKey | null;
  categoryId: string | null;
  category: CategoryDTO | null;
  recurrence: string | null;
  isFocus: boolean;
  order: number;
  subtasks: SubtaskDTO[];
  createdAt: string;
}

export interface JournalEntryDTO {
  id: string;
  date: DateKey;
  mood: Mood;
  summary: string | null;
  gratitude: string | null;
  improve: string | null;
  freeText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DayContextTask {
  id: string;
  title: string;
  categoryColor: string | null;
  categoryName: string | null;
}

export interface StatsResponse {
  totals: {
    open: number;
    completed: number;
    completedToday: number;
    completedThisWeek: number;
    overdue: number;
    missed: number;
  };
  taskStreak: { current: number; best: number };
  journalStreak: { current: number; best: number };
  completionByDay: { date: DateKey; completed: number; missed: number }[];
  /** Média de (concluídas ÷ previstas) nos dias em que algo foi previsto. */
  completionRate: { last7: number | null; last30: number | null; daysCounted: number };
  moodByDay: { date: DateKey; mood: Mood; score: number }[];
  moodDistribution: { mood: Mood; count: number }[];
  byCategory: { id: string; name: string; color: string; completed: number; open: number }[];
  journalCount: number;
}

export type TaskView = 'today' | 'upcoming' | 'all' | 'completed' | 'focus';

export interface ReviewResponse {
  week: { start: DateKey; end: DateKey };
  totals: { completed: number; missed: number; rate: number | null };
  previousTotals: { completed: number; missed: number; rate: number | null };
  byCategory: { id: string; name: string; color: string; completed: number; missed: number }[];
  stalled: { id: string; title: string; color: string | null; times: number }[];
  completedTasks: {
    id: string;
    title: string;
    date: DateKey;
    categoryName: string | null;
    categoryColor: string | null;
  }[];
  mood: {
    entries: { date: DateKey; mood: Mood; score: number }[];
    average: number | null;
    best: { date: DateKey; mood: Mood } | null;
    worst: { date: DateKey; mood: Mood } | null;
    daysLogged: number;
  };
  highlights: { date: DateKey; text: string }[];
  improvements: { date: DateKey; text: string }[];
}
