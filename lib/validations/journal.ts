import { z } from 'zod';
import { MOODS } from '@/lib/constants';

export const journalEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  mood: z.enum(MOODS),
  summary: z.string().trim().max(5000).nullable().optional(),
  gratitude: z.string().trim().max(2000).nullable().optional(),
  improve: z.string().trim().max(2000).nullable().optional(),
  freeText: z.string().trim().max(20000).nullable().optional(),
});

export const updateJournalEntrySchema = journalEntrySchema.omit({ date: true }).partial().extend({
  mood: z.enum(MOODS).optional(),
});

export type JournalEntryInput = z.infer<typeof journalEntrySchema>;
