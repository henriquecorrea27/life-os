import { prisma } from '@/lib/db';
import { fail, ok, readBody } from '@/lib/api-helpers';
import { categoryToDTO } from '@/lib/serialize';
import { createCategorySchema } from '@/lib/validations/category';

export const dynamic = 'force-dynamic';

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { tasks: true } } },
  });

  const openCounts = await prisma.task.groupBy({
    by: ['categoryId'],
    where: { completed: false },
    _count: { _all: true },
  });

  return ok(
    categories.map((category) => ({
      ...categoryToDTO(category),
      taskCount: category._count.tasks,
      openCount:
        openCounts.find((row) => row.categoryId === category.id)?._count._all ?? 0,
    })),
  );
}

export async function POST(request: Request) {
  const { data, error } = await readBody(request, createCategorySchema);
  if (error) return error;

  const existing = await prisma.category.findUnique({ where: { name: data.name } });
  if (existing) return fail('Já existe uma categoria com esse nome', 409);

  const last = await prisma.category.aggregate({ _max: { order: true } });
  const category = await prisma.category.create({
    data: {
      name: data.name,
      color: data.color,
      icon: data.icon ?? null,
      order: (last._max.order ?? 0) + 1,
    },
  });

  return ok({ ...categoryToDTO(category), taskCount: 0, openCount: 0 }, 201);
}
