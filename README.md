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

Como `.bat` não aceita ícone próprio, o launcher da Área de Trabalho é um atalho (`.lnk`) apontando pra esse arquivo, com o ícone em `logo/logo.ico`.

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `npm start` | build e execução em produção |
| `npm run setup` | `db:push` + `db:seed` numa tacada |
| `npm run db:studio` | Prisma Studio para inspecionar os dados |
| `npx tsx scripts/seed-demo.ts` | popula ~4 meses de dados fictícios (para ver as telas cheias) |
| `npx tsx scripts/seed-demo.ts --limpar` | apaga tarefas e diário, mantém as categorias |
| `npx tsx scripts/parse-check.ts` | mostra como o quick-add interpreta uma lista de frases |

## Telas

- **Hoje** (`/`) — progresso do dia, quick-add, foco do dia, tarefas de hoje (com as atrasadas) e o check-in de humor.
- **Tarefas** (`/tasks`) — views Hoje / Próximos 7 dias / Todas / Foco / Concluídas, filtro por categoria, busca e reordenação manual.
- **Diário** (`/journal`) — calendário do mês colorido por humor, busca e timeline das entradas.
- **Entrada do dia** (`/journal/[data]`) — humor, o que aconteceu, destaque positivo, o que melhorar, diário livre, prompts e as tarefas concluídas naquele dia.
- **Estatísticas** (`/stats`) — sequências, conclusões por dia, curva de humor, heatmap de 26 semanas e recorte por categoria.

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
| `Esc` | fecha modal / limpa o quick-add |

## Decisões que valem saber

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
