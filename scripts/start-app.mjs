import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Sobe o app em modo produção, recompilando só quando o código mudou.
 *
 * O launcher rodava `npm run dev`, e é daí que vinha a lentidão ao clicar: em
 * desenvolvimento o Next compila cada rota na primeira visita. Medido nesta
 * máquina, navegar entre telas levava de 0,8 a 1,9 s em dev contra ~50 ms em
 * produção — trinta vezes mais.
 *
 * Compilar a cada abertura também não serve (são dezenas de segundos parado),
 * então guardamos uma impressão digital dos fontes junto do build: se nada mudou
 * desde a última vez, pula direto para o servidor.
 */

const ROOT = path.resolve(import.meta.dirname, '..');
const STAMP = path.join(ROOT, '.next', '.lifeos-source-stamp');

// O que, mudando, exige recompilar. `prisma` entra porque o schema gera client.
const WATCHED_DIRS = ['app', 'components', 'hooks', 'lib', 'prisma'];
const WATCHED_FILES = [
  'package.json',
  'next.config.mjs',
  'tailwind.config.ts',
  'postcss.config.mjs',
  'tsconfig.json',
];
const IGNORED = new Set(['migrations', 'node_modules', '.next']);

async function walk(dir, out) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, out);
    } else if (/\.(ts|tsx|mjs|js|css|prisma|json)$/.test(entry.name)) {
      const info = await stat(full);
      out.push(`${path.relative(ROOT, full)}:${info.size}:${Math.floor(info.mtimeMs)}`);
    }
  }
  return out;
}

async function fingerprint() {
  const parts = [];
  for (const dir of WATCHED_DIRS) await walk(path.join(ROOT, dir), parts);
  for (const file of WATCHED_FILES) {
    try {
      const info = await stat(path.join(ROOT, file));
      parts.push(`${file}:${info.size}:${Math.floor(info.mtimeMs)}`);
    } catch {
      // arquivo opcional ausente — só não entra na conta
    }
  }
  return createHash('sha1').update(parts.sort().join('\n')).digest('hex');
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: 'inherit', shell: true });
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} saiu com código ${code}`)),
    );
    child.on('error', reject);
  });
}

async function hasUsableBuild() {
  try {
    await stat(path.join(ROOT, '.next', 'BUILD_ID'));
    return true;
  } catch {
    return false;
  }
}

const current = await fingerprint();
const previous = await readFile(STAMP, 'utf8').catch(() => null);

if (previous?.trim() !== current) {
  console.log(
    previous ? 'Código mudou desde a última vez — recompilando…' : 'Primeira compilação…',
  );
  try {
    await run('npm', ['run', 'build']);
    await writeFile(STAMP, current, 'utf8');
  } catch (error) {
    // No Windows o `prisma generate` falha com EPERM se outra instância do app
    // ainda estiver segurando a DLL do engine. Um build que falha não pode
    // impedir o app de abrir: se já existe build anterior, sobe com ele e avisa.
    if (!(await hasUsableBuild())) {
      console.error('\nNão consegui compilar e não há build anterior para usar.');
      console.error(error.message);
      process.exit(1);
    }
    console.warn('\nA compilação falhou — subindo com o build anterior.');
    console.warn(`Motivo: ${error.message}`);
    console.warn('Se o Life OS já estiver aberto em outra janela, feche-a e tente de novo.\n');
  }
} else {
  console.log('Nada mudou no código — usando o build existente.');
}

console.log('Subindo o Life OS…');
await run('npx', ['next', 'start', '-p', process.env.PORT ?? '3000']);
