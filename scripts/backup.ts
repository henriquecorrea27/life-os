import { runBackup } from '../lib/backup';

const force = process.argv.includes('--force');

runBackup({ force })
  .then((result) => {
    if (result.skipped) {
      console.log(`Backup nao gravado: ${result.reason}`);
      console.log(`Arquivo: ${result.file}`);
      return;
    }

    const counts = result.counts;
    console.log(`Backup gravado em ${result.file}`);
    if (counts) {
      console.log(
        `  ${counts.categories} categorias - ${counts.tasks} tarefas - ` +
          `${counts.journal} entradas - ${counts.misses} "nao fiz"`,
      );
    }
  })
  .catch((error) => {
    console.error('Falha ao gerar o backup:', error);
    process.exitCode = 1;
  });
