import { prisma } from '@/lib/db';
import { ok, readBody } from '@/lib/api-helpers';
import { reorderSchema } from '@/lib/validations/task';

export async function POST(request: Request) {
  const { data, error } = await readBody(request, reorderSchema);
  if (error) return error;

  await prisma.$transaction(
    data.ids.map((id, index) =>
      prisma.task.update({ where: { id }, data: { order: index } }),
    ),
  );

  return ok({ ok: true });
}
