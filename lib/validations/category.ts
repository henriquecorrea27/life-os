import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Dê um nome à categoria').max(40),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um hex como #60A5FA'),
  icon: z.string().trim().max(40).nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  order: z.number().int().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
