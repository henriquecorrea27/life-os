import { z } from 'zod';
import { PRIORITIES } from '@/lib/constants';

const dateKey = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD');

const recurrence = z
  .string()
  .regex(/^(daily|weekly:(sun|mon|tue|wed|thu|fri|sat)(,(sun|mon|tue|wed|thu|fri|sat))*)$/, 'Recorrência inválida');

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Dê um título para a tarefa').max(200),
  notes: z.string().trim().max(5000).optional().nullable(),
  priority: z.enum(PRIORITIES).default('NONE'),
  dueDate: dateKey.nullable().optional(),
  categoryId: z.string().cuid().nullable().optional(),
  recurrence: recurrence.nullable().optional(),
  isFocus: z.boolean().optional(),
  subtasks: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  completed: z.boolean().optional(),
  priority: z.enum(PRIORITIES).optional(),
  dueDate: dateKey.nullable().optional(),
  categoryId: z.string().cuid().nullable().optional(),
  recurrence: recurrence.nullable().optional(),
  isFocus: z.boolean().optional(),
  order: z.number().int().optional(),
  subtasks: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().trim().min(1).max(200),
        completed: z.boolean().default(false),
      }),
    )
    .max(50)
    .optional(),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().cuid()).min(1),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
