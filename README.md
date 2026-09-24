# Life OS

To-do list e diário pessoal na mesma interface. App local, um usuário só, sem login e sem nuvem.

## Rodando

Requisitos e como resolver o erro de política de execução no Windows: ver [REQUIREMENTS.md](REQUIREMENTS.md).

```bash
npm install
cp .env.example .env   # no Windows: copy .env.example .env
npm run setup           # cria o banco SQLite e semeia as 6 categorias padrão
npm run dev             # http://localhost:3000
```

O banco é um arquivo `prisma/dev.db` local, ignorado pelo git.

### Atalho no Windows

`scripts/iniciar-life-os.bat` sobe o servidor e abre o app no Chrome sozinho — detecta se já está rodando (não duplica), instala dependências e configura o banco na primeira vez. Ele tem caminhos fixos para esta máquina; para usar em outra, ajuste `PROJECT_DIR` e `CHROME` no topo do arquivo.

O launcher usa `npm run app`, que roda em **modo produção** e só recompila quando algum fonte muda (compara uma impressão digital de `app/`, `components/`, `hooks/`, `lib/`, `prisma/` e dos arquivos de config com a do último build). Use `npm run dev` só para desenvolver: em dev o Next compila cada tela na primeira visita, e navegar levava de 0,8 a 1,9 s por clique contra ~50 ms em produção.

Como `.bat` não aceita ícone próprio, o launcher da Área de Trabalho é um atalho (`.lnk`) apontando pra esse arquivo, com o ícone em `logo/logo.ico`.

### Scripts

| Comando | O que faz |
|---|---|
| `npm run app` | **uso normal**: produção, recompilando só se o código mudou |
| `npm run dev` | servidor de desenvolvimento (recompila a cada tela; mais lento) |
| `npm run build` / `npm start` | build e execução em produção |
| `npm run setup` | `db:push` + `db:seed` numa tacada |
| `npm run db:studio` | Prisma Studio para inspecionar os dados |
| `npm run backup` | exporta os dados para o arquivo único no Google Drive |
| `npm run backup:force` | mesmo, ignorando a checagem de "nada mudou" |
| `npm run restore` | reconstrói o banco a partir do backup (só em banco vazio) |
| `npm run restore -- --force` | apaga o que existe e restaura por cima |
| `npm run db:backfill` | repreenche as colunas de busca normalizada |
| `npx tsx scripts/seed-demo.ts` | popula ~4 meses de dados fictícios (para ver as telas cheias) |
| `npx tsx scripts/seed-demo.ts --limpar` | apaga tarefas e diário, mantém as categorias |
| `npx tsx scripts/parse-check.ts` | mostra como o quick-add interpreta uma lista de frases |

## Telas

- **Hoje** (`/`) — progresso do dia, quick-add, foco do dia, tarefas de hoje (com as atrasadas) e o check-in de humor.
- **Tarefas** (`/tasks`) — views Hoje / Próximos 7 dias / Todas / Foco / Concluídas, filtro por categoria, busca e reordenação manual.
- **Diário** (`/journal`) — calendário do mês colorido por humor, busca e timeline das entradas.
- **Entrada do dia** (`/journal/[data]`) — humor, o que aconteceu, destaque positivo, o que melhorar, diário livre, prompts e as tarefas concluídas naquele dia.
- **Semana** (`/review`) — revisão de segunda a domingo, montada sozinha: taxa de conclusão, comparação com a semana anterior, humor dia a dia, o que mais escapou e os seus próprios trechos de diário.
- **Estatísticas** (`/stats`) — sequências, taxa de conclusão, conclusões por dia (com as não feitas), curva de humor, heatmap e recorte por categoria.

As categorias são editáveis: "Gerenciar" na barra de filtros de Tarefas, ou o ícone ao lado de CATEGORIAS na sidebar. Dá para criar, renomear, trocar a cor e excluir — excluir uma categoria deixa as tarefas dela sem rótulo, não as apaga.

## Quick-add

O campo único aceita linguagem natural em português e mostra o que entendeu antes de você salvar:

| Você escreve | Vira |
|---|---|
| `#trade`, `#saude` | categoria (casa por prefixo, sem acento) |
| `hoje`, `amanhã`, `depois de amanhã` | data |
| `sexta`, `na terça`, `próxima semana`, `fim de semana` | data |
| `dia 20`, `15/03`, `03/11/2026` | data |
| `!alta` / `!1`, `!media` / `!2`, `!baixa` / `!3` | prioridade |
| `todo dia`, `dias úteis`, `toda segunda` | recorrência |
| `@foco` | entra no foco do dia |

Exemplo: `revisar trades de hoje #trade !alta` cria "revisar trades" para hoje, prioridade alta, categoria Trade — a preposição solta é removida junto com a data.

## Atalhos

| Tecla | Ação |
|---|---|
| `⌘K` / `Ctrl+K` | busca rápida (tarefas, dias do diário, ações) |
| `N` | foca o quick-add |
| `Shift+N` | abre o formulário completo de tarefa |
| `⌘Enter` | salva o formulário de tarefa |
| `?` | lista todos os atalhos |
| `Esc` | fecha modal / limpa o quick-add |

A mesma lista está dentro do app: tecle `?`, clique no teclado no rodapé da sidebar ou procure "atalhos" no `⌘K`.

## Backup

O diário só existe no `prisma/dev.db`: sem servidor, sem réplica, sem sincronização. O backup é **um arquivo só** — `G:\Meu Drive\Life OS Backups\life-os-backup.json` — sobrescrito a cada gravação. A pasta é do Google Drive para Desktop, que sincroniza sozinha e já guarda o histórico de versões do arquivo, então manter cópias datadas aqui só duplicaria isso. Mude o destino com `BACKUP_DIR` no `.env`.

O JSON carrega tudo (categorias, tarefas com subtarefas e "não fiz", diário) **com os ids**, para que as relações sobrevivam à volta:

```bash
npm run restore              # num banco vazio — o caso de instalar de novo
npm run restore -- --force   # apaga o que existe e restaura por cima
```

Restaurar num banco que já tem dados é recusado sem `--force`: é destrutivo e silencioso demais para acontecer por engano.

Roda sozinho dois minutos depois de qualquer alteração (a janela junta a rajada de saves do diário num backup só) e pula quando o `.db` não mudou desde a última exportação. A escrita é atômica — grava num `.tmp` e só então substitui, para que um desligamento no meio não deixe o backup pela metade. `BACKUP_AUTO=off` desliga o automático sem tirar o `npm run backup`.

## Decisões que valem saber

**Não concluir é um dado, não um silêncio.** "Não fiz hoje" (ícone de calendário na linha) ou "Fechar o dia" registram uma linha em `TaskMiss` e empurram a tarefa para amanhã. A taxa de conclusão é `concluídas ÷ (concluídas + não feitas)`, e só conta dias em que havia algo previsto — um domingo vazio não é 0% de aproveitamento, é um dia sem promessa. Tarefas sem data nunca entram na conta.

**Busca ignora acento e caixa.** O `LIKE` do SQLite (que é no que o `contains` do Prisma vira) só ignora maiúsculas em ASCII: "PREGÃO" não acharia "pregão". Task e JournalEntry guardam uma coluna `searchText` normalizada, preenchida na escrita, e a busca acontece nela.

**A revisão semanal não resume prosa.** Ela calcula o que dá para calcular e cita na íntegra o que você escreveu nos campos de destaque e "poderia ser melhor". Resumir o texto em palavras novas exigiria um modelo de linguagem; inventar uma síntese sua seria pior que não ter nenhuma. A ideia está no radar — as decisões que faltam estão em [CLAUDE.md](CLAUDE.md), seção 9.1.

**Datas têm granularidade de dia.** Vencimentos e entradas de diário são gravados sempre na meia-noite UTC do dia escolhido e convertidos para chave local (`YYYY-MM-DD`) na borda — ver `lib/dates.ts`. Sem isso o fuso desloca a data um dia ao serializar.

**SQLite não tem enum.** `Priority` e `Mood` são `String` no schema e a validação estrita fica nos schemas Zod de `lib/validations/`, que são os mesmos usados pelos formulários.

**Tarefa recorrente concluída gera a próxima ocorrência** como uma nova linha, preservando a que foi feita no histórico (`app/api/tasks/[id]/route.ts`). Nada é sobrescrito.

**O diário salva sozinho** (debounce de 900 ms) e só marca como salvo se nada foi digitado enquanto a requisição corria. É o texto do fim do dia — perder por esquecer de salvar seria o pior defeito possível aqui.

**Cor nunca é a única informação.** A paleta de categorias e humores do design system é pastel de propósito, o que a deixa abaixo de AA quando vira texto. Onde a cor precisa ser lida como texto, `readableTint()` (`lib/utils.ts`) mistura a cor com a tinta primária do tema; nos gráficos, toda categoria e todo humor aparecem também escritos.

## Estrutura

```
app/(app)/        páginas
app/api/          rotas de API (falam direto com o Prisma)
components/ui     primitivos (Button, Modal, Badge, Field…)
components/tasks  TaskItem, TaskList, TaskForm, QuickAdd, filtros
components/journal MoodPicker, MoodIcon, calendário, editor
components/stats  gráficos em SVG, sem biblioteca
components/layout sidebar, bottom nav, shell
hooks/            um hook React Query por recurso
lib/              datas, validações, parser do quick-add, tipos
```

Toda chamada de API do client passa por um hook React Query — nenhum `fetch` solto em componente de UI.
