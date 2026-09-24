import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { dateKeyFromStored } from './dates';

/**
 * Backup do banco local.
 *
 * O diário só existe no `.db` deste projeto: não há servidor, réplica nem
 * sincronização. O backup é UM arquivo JSON, sempre com o mesmo nome, sobrescrito
 * a cada gravação — o Drive guarda o histórico de versões dele, então manter
 * cópias datadas aqui só duplicaria o que o próprio Drive já faz.
 *
 * O arquivo carrega tudo que é preciso para reconstruir o banco do zero
 * (`npm run restore`), incluindo os ids, para que as relações entre tarefa,
 * subtarefa e categoria sobrevivam à volta.
 *
 * O destino padrão é a pasta do Google Drive para Desktop, que sincroniza
 * sozinha — por isso não há integração com API nem login: para o app é só um
 * caminho de arquivo.
 */

const DEFAULT_DRIVE = 'G:\\Meu Drive\\Life OS Backups';
const FILE_NAME = 'life-os-backup.json';
export const BACKUP_FORMAT = 1;

export interface BackupResult {
  file: string;
  skipped: boolean;
  reason?: string;
  counts?: BackupCounts;
}

export interface BackupCounts {
  categories: number;
  tasks: number;
  subtasks: number;
  journal: number;
  misses: number;
}

export interface BackupFile {
  format: number;
  exportedAt: string;
  /** Hash do .db no momento da exportação — evita reescrever backup idêntico. */
  sourceHash: string;
  counts: BackupCounts;
  categories: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
    order: number;
  }[];
  tasks: {
    id: string;
    title: string;
    notes: string | null;
    completed: boolean;
    completedAt: string | null;
    priority: string;
    dueDate: string | null;
    categoryId: string | null;
    recurrence: string | null;
    isFocus: boolean;
    order: number;
    createdAt: string;
    subtasks: { id: string; title: string; completed: boolean; order: number }[];
    misses: string[];
  }[];
  journal: {
    id: string;
    date: string;
    mood: string;
    summary: string | null;
    gratitude: string | null;
    improve: string | null;
    freeText: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
}

export function backupRoot(): string {
  return process.env.BACKUP_DIR?.trim() || DEFAULT_DRIVE;
}

export function backupPath(): string {
  return path.join(backupRoot(), FILE_NAME);
}

function databasePath(): string {
  const url = process.env.DATABASE_URL ?? 'file:./dev.db';
  const relative = url.replace(/^file:/, '');
  return path.resolve(process.cwd(), 'prisma', relative.replace(/^\.\//, ''));
}

async function fileHash(file: string): Promise<string> {
  return createHash('sha1').update(await readFile(file)).digest('hex');
}

/** Hash gravado no backup anterior, lido do próprio arquivo — nada de marcador à parte. */
async function previousHash(file: string): Promise<string | null> {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8')) as Partial<BackupFile>;
    return parsed.sourceHash ?? null;
  } catch {
    return null;
  }
}

async function readExport(sourceHash: string): Promise<BackupFile> {
  // Import tardio: este módulo também roda em script fora do Next.
  const { prisma } = await import('./db');

  const [categories, tasks, journal] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: 'asc' } }),
    prisma.task.findMany({
      include: { subtasks: { orderBy: { order: 'asc' } }, misses: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.journalEntry.findMany({ orderBy: { date: 'asc' } }),
  ]);

  const subtaskCount = tasks.reduce((sum, task) => sum + task.subtasks.length, 0);
  const missCount = tasks.reduce((sum, task) => sum + task.misses.length, 0);

  return {
    format: BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    sourceHash,
    counts: {
      categories: categories.length,
      tasks: tasks.length,
      subtasks: subtaskCount,
      journal: journal.length,
      misses: missCount,
    },
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
      order: category.order,
    })),
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      notes: task.notes,
      completed: task.completed,
      completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      priority: task.priority,
      dueDate: task.dueDate ? dateKeyFromStored(task.dueDate) : null,
      categoryId: task.categoryId,
      recurrence: task.recurrence,
      isFocus: task.isFocus,
      order: task.order,
      createdAt: task.createdAt.toISOString(),
      subtasks: task.subtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        completed: subtask.completed,
        order: subtask.order,
      })),
      misses: task.misses.map((miss) => dateKeyFromStored(miss.date)),
    })),
    journal: journal.map((entry) => ({
      id: entry.id,
      date: dateKeyFromStored(entry.date),
      mood: entry.mood,
      summary: entry.summary,
      gratitude: entry.gratitude,
      improve: entry.improve,
      freeText: entry.freeText,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    })),
  };
}

export async function runBackup(options: { force?: boolean } = {}): Promise<BackupResult> {
  const file = backupPath();
  const source = databasePath();

  try {
    await access(source, constants.R_OK);
  } catch {
    return { file, skipped: true, reason: `banco não encontrado em ${source}` };
  }

  try {
    await mkdir(path.dirname(file), { recursive: true });
  } catch (error) {
    return { file, skipped: true, reason: `destino indisponível (${(error as Error).message})` };
  }

  const hash = await fileHash(source);
  if (!options.force && hash === (await previousHash(file))) {
    return { file, skipped: true, reason: 'nada mudou desde o último backup' };
  }

  const data = await readExport(hash);

  // Grava num arquivo temporário e só então substitui: se a máquina desligar no
  // meio da escrita, o backup anterior continua íntegro em vez de virar um JSON
  // pela metade.
  const temporary = `${file}.tmp`;
  await writeFile(temporary, JSON.stringify(data, null, 2), 'utf8');
  const { rename } = await import('node:fs/promises');
  await rename(temporary, file);

  return { file, skipped: false, counts: data.counts };
}

/**
 * Backup automático depois de uma escrita.
 *
 * Com atraso porque escrever no diário dispara um save a cada poucos segundos:
 * exportar a cada um seria trabalho jogado fora. A janela junta a rajada num
 * backup só, e o hash em `runBackup` descarta o que não mudou.
 *
 * Não é aguardado por quem chama — uma falha de backup nunca pode derrubar o
 * salvamento de uma tarefa ou de uma entrada de diário.
 */
const DEBOUNCE_MS = 2 * 60 * 1000;

interface BackupTimer {
  timer: ReturnType<typeof setTimeout> | null;
  running: boolean;
}

// Guardado no globalThis: em dev o Next recarrega os módulos e um timer por
// cópia do módulo significaria vários backups concorrentes.
const state: BackupTimer =
  (globalThis as { __lifeOsBackup?: BackupTimer }).__lifeOsBackup ??
  ((globalThis as { __lifeOsBackup?: BackupTimer }).__lifeOsBackup = {
    timer: null,
    running: false,
  });

export function scheduleBackup(): void {
  if (process.env.BACKUP_AUTO === 'off') return;
  if (state.timer) clearTimeout(state.timer);

  state.timer = setTimeout(() => {
    state.timer = null;
    if (state.running) return;
    state.running = true;

    void runBackup()
      .then((result) => {
        if (!result.skipped) console.log(`[backup] ${result.file}`);
      })
      .catch((error) => console.warn('[backup] falhou:', (error as Error).message))
      .finally(() => {
        state.running = false;
      });
  }, DEBOUNCE_MS);

  // Não segura o processo vivo só por causa de um backup pendente.
  state.timer.unref?.();
}
