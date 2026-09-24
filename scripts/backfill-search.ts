import { prisma } from '../lib/db';
import { buildSearchText } from '../lib/utils';

/**
 * Preenche `searchText` nos registros criados antes da coluna existir.
 * Idempotente: rodar de novo só reescreve o que já estava certo.
 */
async function main() {
  const tasks = await prisma.task.findMany({ select: { id: true, title: true, notes: true, searchText: true } });
  let tasksUpdated = 0;
  for (const task of tasks) {
    const next = buildSearchText(task.title, task.notes);
    if (next === task.searchText) continue;
    await prisma.task.update({ where: { id: task.id }, data: { searchText: next } });
    tasksUpdated += 1;
  }

  const entries = await prisma.journalEntry.findMany({
    select: { id: true, summary: true, gratitude: true, improve: true, freeText: true, searchText: true },
  });
  let entriesUpdated = 0;
  for (const entry of entries) {
    const next = buildSearchText(entry.summary, entry.gratitude, entry.improve, entry.freeText);
    if (next === entry.searchText) continue;
    await prisma.journalEntry.update({ where: { id: entry.id }, data: { searchText: next } });
    entriesUpdated += 1;
  }

  console.log(`Tarefas atualizadas: ${tasksUpdated}/${tasks.length}`);
  console.log(`Entradas de diário atualizadas: ${entriesUpdated}/${entries.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
