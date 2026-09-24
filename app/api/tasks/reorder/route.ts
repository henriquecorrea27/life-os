import { prisma } from '@/lib/db';
import { ok, readBody } from '@/lib/api-helpers';
import { reorderSchema } from '@/lib/validations/task';

export async function POST(request: Request) {
  const { data, error } = await readBody(request, reorderSchema);
  if (error) return error;

  // A lista arrastada é quase sempre um recorte (só o "Hoje", só uma categoria).
  // Gravar `order: index` jogaria essas tarefas para o começo da ordenação global
  // e embaralharia as que nem estavam na tela. Em vez disso reaproveitamos os
  // slots que esse recorte já ocupava e só redistribuímos quem senta em cada um.
  const current = await prisma.task.findMany({
    where: { id: { in: data.ids } },
    select: { id: true, order: true },
  });

  const slots = current.map((task) => task.order).sort((a, b) => a - b);
  const known = new Set(current.map((task) => task.id));

  const updates = data.ids
    .filter((id) => known.has(id))
    .map((id, index) => ({ id, order: slots[index] }))
    .filter(({ id, order }) => current.find((task) => task.id === id)?.order !== order);

  if (updates.length) {
    await prisma.$transaction(
      updates.map(({ id, order }) => prisma.task.update({ where: { id }, data: { order } })),
    );
  }

  return ok({ ok: true, updated: updates.length });
}
