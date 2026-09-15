/**
 * Popula o banco com alguns meses de dados fictícios para ver as telas cheias
 * (estatísticas, heatmap, timeline do diário). Nunca roda sozinho.
 *
 *   npx tsx scripts/seed-demo.ts          → cria os dados de exemplo
 *   npx tsx scripts/seed-demo.ts --limpar → apaga TUDO menos as categorias
 */
import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

const MOODS = ['VERY_BAD', 'BAD', 'NEUTRAL', 'GOOD', 'VERY_GOOD'] as const;

const TITLES: Record<string, string[]> = {
  Trabalho: ['Responder e-mails', 'Revisar PR do time', 'Planejar a semana', 'Reunião de alinhamento'],
  Trade: ['Revisar trades do dia', 'Atualizar planilha de risco', 'Estudar setup semanal'],
  Estudos: ['30 min de price action', 'Terminar módulo do curso', 'Refazer exercícios'],
  Saúde: ['Academia', 'Caminhada de 20 min', 'Beber 2L de água'],
  Leitura: ['Ler 20 páginas', 'Fichar capítulo'],
  Pessoal: ['Organizar a mesa', 'Ligar para a família', 'Pagar contas'],
};

const SUMMARIES = [
  'Dia produtivo, consegui fechar o que estava travado desde ontem.',
  'Mercado de lado, poucos setups. Segurei a mão e não forcei entrada.',
  'Cansado, mas mantive a rotina. O treino ajudou a virar a chave.',
  'Dia corrido demais, mal parei para almoçar. Preciso proteger a agenda.',
  'Boa conversa com o time, saí com clareza do que priorizar.',
  'Consegui estudar com foco de verdade pela primeira vez na semana.',
];

function pick<T>(list: readonly T[], seed: number): T {
  return list[Math.abs(Math.floor(Math.sin(seed) * 10_000)) % list.length];
}

function dayStartUTC(date: Date): Date {
  return new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

async function limpar() {
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.journalEntry.deleteMany();
  console.log('✓ tarefas e entradas de diário apagadas (categorias mantidas)');
}

async function popular() {
  const categories = await prisma.category.findMany();
  if (categories.length === 0) {
    console.error('Rode antes: npm run db:seed');
    process.exit(1);
  }

  let tasks = 0;
  let entries = 0;

  for (let daysAgo = 120; daysAgo >= 0; daysAgo -= 1) {
    const day = subDays(new Date(), daysAgo);
    const weekday = day.getDay();
    const seed = daysAgo + 1;

    // Alguns dias sem nada, para o heatmap e a sequência não ficarem uniformes.
    const skip = Math.abs(Math.sin(seed * 3.7)) < 0.18;
    if (skip) continue;

    const count = weekday === 0 || weekday === 6 ? 1 : 2 + (seed % 3);

    for (let i = 0; i < count; i += 1) {
      const category = pick(categories, seed * 7 + i);
      const title = pick(TITLES[category.name] ?? ['Tarefa'], seed * 13 + i);
      const completed = daysAgo > 0 ? Math.abs(Math.sin(seed * 2.1 + i)) > 0.25 : i % 2 === 0;
      const completedAt = new Date(day);
      completedAt.setHours(9 + ((seed + i) % 10), (seed * 7 + i * 13) % 60, 0, 0);

      await prisma.task.create({
        data: {
          title,
          categoryId: category.id,
          priority: pick(['NONE', 'NONE', 'LOW', 'MEDIUM', 'HIGH'], seed + i),
          dueDate: dayStartUTC(day),
          completed,
          completedAt: completed ? completedAt : null,
          order: tasks,
        },
      });
      tasks += 1;
    }

    // O diário é preenchido com menos frequência que as tarefas, como na vida real.
    if (Math.abs(Math.cos(seed * 1.9)) > 0.35) {
      const moodIndex = Math.min(
        4,
        Math.max(0, Math.round(2 + Math.sin(seed / 9) * 1.8)),
      );
      await prisma.journalEntry.upsert({
        where: { date: dayStartUTC(day) },
        update: {},
        create: {
          date: dayStartUTC(day),
          mood: MOODS[moodIndex],
          summary: pick(SUMMARIES, seed),
          gratitude: seed % 3 === 0 ? 'Treino feito mesmo sem vontade.' : null,
          improve: seed % 4 === 0 ? 'Dormir mais cedo, o dia rende bem mais.' : null,
        },
      });
      entries += 1;
    }
  }

  console.log(`✓ ${tasks} tarefas e ${entries} entradas de diário criadas`);
}

async function main() {
  if (process.argv.includes('--limpar')) {
    await limpar();
    return;
  }
  await popular();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
