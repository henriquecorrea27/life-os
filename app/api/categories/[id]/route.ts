import { prisma } from '@/lib/db';
import { fail, ok, readBody } from '@/lib/api-helpers';
import { categoryToDTO } from '@/lib/serialize';
import { updateCategorySchema } from '@/lib/validations/category';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const { data, error } = await readBody(request, updateCategorySchema);
  if (error) return error;

  const current = await prisma.category.findUnique({ where: { id } });
  if (!current) return fail('Categoria não encontrada', 404);

  if (data.name && data.name !== current.name) {
    const clash = await prisma.category.findUnique({ where: { name: data.name } });
    if (clash) return fail('Já existe uma categoria com esse nome', 409);
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
      ...(data.icon !== undefined ? { icon: data.icon } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
    },
  });

  return ok(categoryToDTO(category));
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const current = await prisma.category.findUnique({ where: { id } });
  if (!current) return fail('Categoria não encontrada', 404);

  // Tarefas sobrevivem à categoria: o schema faz SetNull, elas só ficam sem rótulo.
  await prisma.category.delete({ where: { id } });
  return ok({ id });
}
