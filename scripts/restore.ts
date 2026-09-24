import { readFile } from 'node:fs/promises';
import { prisma } from '../lib/db';
import { BACKUP_FORMAT, backupPath, type BackupFile } from '../lib/backup';
import { dateKeyToStored } from '../lib/dates';
import { buildSearchText } from '../lib/utils';

/**
 * Reconstrói o banco a partir do backup do Drive.
 *
 * Por padrão só roda num banco vazio — restaurar por cima de dados existentes é
 * uma operação destrutiva e silenciosa, exatamente o tipo de coisa que não pode
 * acontecer por engano. `--force` apaga tudo antes de restaurar, e aí é escolha
 * consciente de quem digitou.
 *
 *   npm run restore              -> banco vazio
 *   npm run restore -- --force   -> apaga o que existe e restaura por cima
 *   npm run restore -- --arquivo "D:\\outro\\life-os-backup.json"
 */
const args = process.argv.slice(2);
const force = args.includes('--force');
const fileFlag = args.indexOf('--arquivo');
const file = fileFlag >= 0 ? args[fileFlag + 1] : backupPath();

async function main() {
  const raw = await readFile(file, 'utf8').catch(() => {
    throw new Error(`Backup não encontrado em ${file}`);
  });

  const data = JSON.parse(raw) as BackupFile;
  if (data.format !== BACKUP_FORMAT) {
    throw new Error(
      `Backup no formato ${data.format}, mas este app lê o formato ${BACKUP_FORMAT}.`,
    );
  }

  const existing =
    (await prisma.task.count()) +
    (await prisma.journalEntry.count()) +
    (await prisma.category.count());

  if (existing > 0 && !force) {
    console.error(
      `O banco já tem ${existing} registro(s). Rode com --force para apagar tudo e restaurar por cima.`,
    );
    process.exitCode = 1;
    return;
  }

  if (force && existing > 0) {
    // Ordem importa: subtarefas e falhas caem por cascata, mas categoria só sai
    // depois das tarefas que apontam para ela.
    await prisma.taskMiss.deleteMany();
    await prisma.subtask.deleteMany();
    await prisma.task.deleteMany();
    await prisma.journalEntry.deleteMany();
    await prisma.category.deleteMany();
    console.log(`Apagados ${existing} registro(s) anteriores.`);
  }

  await prisma.category.createMany({ data: data.categories });

  for (const task of data.tasks) {
    await prisma.task.create({
      data: {
        id: task.id,
        title: task.title,
        notes: task.notes,
        completed: task.completed,
        completedAt: task.completedAt ? new Date(task.completedAt) : null,
        priority: task.priority,
        dueDate: task.dueDate ? dateKeyToStored(task.dueDate) : null,
        categoryId: task.categoryId,
        recurrence: task.recurrence,
        isFocus: task.isFocus,
        order: task.order,
        createdAt: new Date(task.createdAt),
        // Recalculado em vez de guardado no backup: é índice derivado, e assim
        // uma mudança futura na normalização chega junto com a restauração.
        searchText: buildSearchText(task.title, task.notes),
        subtasks: task.subtasks.length ? { create: task.subtasks } : undefined,
        misses: task.misses.length
          ? { create: task.misses.map((date) => ({ date: dateKeyToStored(date) })) }
          : undefined,
      },
    });
  }

  for (const entry of data.journal) {
    await prisma.journalEntry.create({
      data: {
        id: entry.id,
        date: dateKeyToStored(entry.date),
        mood: entry.mood,
        summary: entry.summary,
        gratitude: entry.gratitude,
        improve: entry.improve,
        freeText: entry.freeText,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt),
        searchText: buildSearchText(entry.summary, entry.gratitude, entry.improve, entry.freeText),
      },
    });
  }

  console.log(`Restaurado de ${file} (exportado em ${data.exportedAt}):`);
  console.log(`  ${data.counts.categories} categorias`);
  console.log(`  ${data.counts.tasks} tarefas (${data.counts.subtasks} subtarefas)`);
  console.log(`  ${data.counts.journal} entradas de diário`);
  console.log(`  ${data.counts.misses} registros de "não fiz"`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
