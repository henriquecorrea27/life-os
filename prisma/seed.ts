import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Trabalho', color: '#60A5FA', icon: 'briefcase', order: 0 },
  { name: 'Trade', color: '#34D399', icon: 'candlestick-chart', order: 1 },
  { name: 'Estudos', color: '#FBBF24', icon: 'graduation-cap', order: 2 },
  { name: 'Saúde', color: '#F472B6', icon: 'heart-pulse', order: 3 },
  { name: 'Leitura', color: '#A78BFA', icon: 'book-open', order: 4 },
  { name: 'Pessoal', color: '#94A3B8', icon: 'user', order: 5 },
];

async function main() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { color: category.color, icon: category.icon, order: category.order },
      create: category,
    });
  }
  console.log(`✓ ${CATEGORIES.length} categorias prontas`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
