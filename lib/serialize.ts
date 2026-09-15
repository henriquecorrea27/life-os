import type { Mood, Priority } from './constants';
import { dateKeyFromStored } from './dates';
import type { CategoryDTO, JournalEntryDTO, TaskDTO } from './types';

type CategoryRow = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  order: number;
};

type SubtaskRow = { id: string; title: string; completed: boolean; order: number };

type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  completed: boolean;
  completedAt: Date | null;
  priority: string;
  dueDate: Date | null;
  categoryId: string | null;
  category?: CategoryRow | null;
  recurrence: string | null;
  isFocus: boolean;
  order: number;
  subtasks?: SubtaskRow[];
  createdAt: Date;
};

type JournalRow = {
  id: string;
  date: Date;
  mood: string;
  summary: string | null;
  gratitude: string | null;
  improve: string | null;
  freeText: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function categoryToDTO(row: CategoryRow): CategoryDTO {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    order: row.order,
  };
}

export function taskToDTO(row: TaskRow): TaskDTO {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    completed: row.completed,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    priority: row.priority as Priority,
    dueDate: row.dueDate ? dateKeyFromStored(row.dueDate) : null,
    categoryId: row.categoryId,
    category: row.category ? categoryToDTO(row.category) : null,
    recurrence: row.recurrence,
    isFocus: row.isFocus,
    order: row.order,
    subtasks: (row.subtasks ?? []).map((subtask) => ({
      id: subtask.id,
      title: subtask.title,
      completed: subtask.completed,
      order: subtask.order,
    })),
    createdAt: row.createdAt.toISOString(),
  };
}

export function journalToDTO(row: JournalRow): JournalEntryDTO {
  return {
    id: row.id,
    date: dateKeyFromStored(row.date),
    mood: row.mood as Mood,
    summary: row.summary,
    gratitude: row.gratitude,
    improve: row.improve,
    freeText: row.freeText,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
