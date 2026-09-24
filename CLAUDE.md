# CLAUDE.md — Life OS (To-Do + Diário Pessoal)

Este arquivo orienta o Claude Code durante todo o desenvolvimento deste projeto. Leia-o por completo antes de gerar qualquer código e siga as decisões aqui como padrão — só desvie se o usuário pedir explicitamente algo diferente numa conversa.

## 1. Visão geral

App pessoal (uso individual, um único usuário: Henrique) que junta duas coisas na mesma interface:

1. **To-do list completa** — gerenciamento de tarefas do dia a dia (trabalho, trades, estudos, saúde, leitura, pessoal), com categorias, prioridades, datas, recorrência e uma boa visão de progresso.
2. **Diário/Check-in diário** — um espaço para registrar como o dia foi: humor, o que aconteceu, e observações livres. Pensado para o bloco fixo de fim de dia (revisão de trades + diário) que o Henrique já mantém na rotina.

Não é um SaaS multiusuário. Não precisa de autenticação complexa, planos de assinatura, nem features de colaboração. O foco é 100% experiência pessoal: rápido de abrir, rápido de usar, bonito de olhar todo dia.

**Categorias de tarefa sugeridas como padrão** (o usuário pode editar/adicionar depois): Trabalho, Trade, Estudos, Saúde, Leitura, Pessoal. Isso reflete a rotina real de quem vai usar o app — não deixe hardcoded de forma rígida, mas use como seed inicial.

## 2. Stack técnica (decidida)

- **Framework**: Next.js (App Router) + React + TypeScript
- **Estilização**: Tailwind CSS
- **Banco de dados**: SQLite local (via **Prisma** como ORM — usar `provider = "sqlite"`, arquivo `.db` local no projeto, nunca comitar o arquivo de dados real)
- **Gerenciamento de estado no client**: React Query (TanStack Query) para cache/sync com as API routes; Zustand só se necessário para estado de UI global (ex.: tema, modal aberto)
- **Animações**: Framer Motion (sutil — ver seção de design)
- **Ícones**: Lucide Icons (consistente com o estilo minimalista)
- **Validação**: Zod (schemas compartilhados entre API e forms)
- **Formulários**: React Hook Form + Zod resolver

Não adicione autenticação (NextAuth, Clerk etc.) a menos que o usuário peça — é um app local, single-user.

Não use um backend separado. As API routes do próprio Next.js (`app/api/...`) conversam direto com o Prisma/SQLite. Mantém tudo em um único projeto, simples de rodar com `npm run dev`.

## 3. Estrutura de pastas

```
/app
  /(app)
    /page.tsx                → Home: visão do dia (tarefas de hoje + humor de hoje)
    /tasks/page.tsx          → Lista completa de tarefas (todas as views/filtros)
    /journal/page.tsx        → Diário: timeline de entradas por data
    /journal/[date]/page.tsx → Entrada de um dia específico
    /stats/page.tsx          → Estatísticas simples (streaks, produtividade, humor ao longo do tempo)
  /api
    /tasks/route.ts
    /tasks/[id]/route.ts
    /categories/route.ts
    /journal/route.ts
    /journal/[date]/route.ts
/components
  /ui                        → primitivos (Button, Input, Checkbox, Modal, Badge, etc.)
  /tasks                     → TaskItem, TaskList, TaskForm, TaskFilters, QuickAdd
  /journal                   → MoodPicker, JournalEntryCard, JournalEditor
  /layout                    → Sidebar, TopBar, PageShell
/lib
  /db.ts                     → cliente Prisma singleton
  /validations               → schemas Zod
  /utils.ts
/prisma
  /schema.prisma
  /migrations
```

Mantenha os componentes pequenos e focados (um componente, uma responsabilidade). Prefira composição a props gigantes.

## 4. Modelo de dados

```prisma
model Task {
  id          String    @id @default(cuid())
  title       String
  notes       String?
  completed   Boolean   @default(false)
  completedAt DateTime?
  priority    Priority  @default(NONE)
  dueDate     DateTime?
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])
  recurrence  String?   // regra simples: "daily" | "weekly:mon,wed,fri" | null
  order       Int       @default(0) // para drag-and-drop manual
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum Priority {
  NONE
  LOW
  MEDIUM
  HIGH
}

model Category {
  id        String   @id @default(cuid())
  name      String
  color     String   // hex, ver paleta de categorias na seção de design
  icon      String?  // nome do ícone lucide
  tasks     Task[]
}

model TaskMiss {
  id     String   @id @default(cuid())
  taskId String
  task   Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  date   DateTime // dia em que a tarefa estava prevista e não foi feita

  @@unique([taskId, date])
}

model JournalEntry {
  id          String   @id @default(cuid())
  date        DateTime @unique // um registro por dia (granularidade de dia, sem hora)
  mood        Mood
  summary     String?  // "o que aconteceu" — texto livre, pode ser curto
  gratitude   String?  // opcional: algo bom do dia
  freeText    String?  // campo aberto maior, tipo diário mesmo
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Mood {
  VERY_BAD
  BAD
  NEUTRAL
  GOOD
  VERY_GOOD
}
```

Ajuste livremente durante a implementação, mas mantenha a separação: tarefas são efêmeras/acionáveis, diário é um registro histórico imutável por data (edição permitida, mas é sempre "a entrada do dia X").

## 5. Funcionalidades — To-Do

### Essenciais (MVP)
- Criar tarefa rápida (quick-add com input único: título + parse simples de data/categoria via texto, tipo "revisar trades amanhã #trade")
- Editar tarefa (título, notas, prioridade, data, categoria)
- Marcar como concluída com animação de check satisfatória (referência: Todoist)
- Excluir tarefa (com confirmação leve, não bloqueante — toast com "desfazer")
- Filtros/Views: Hoje, Próximos 7 dias, Todas, Por categoria, Concluídas
- Ordenação manual (drag-and-drop) dentro de uma lista
- Prioridade visual (cor/indicador discreto, não poluir a UI)
- Contador de progresso do dia (ex.: "5/8 concluídas" com barra ou anel de progresso minimalista)

### Avançadas (fase 2)
- Tarefas recorrentes (diária, dias específicos da semana)
- Subtarefas / checklist dentro de uma tarefa
- Busca rápida (Cmd+K estilo command palette)
- Atalhos de teclado (criar tarefa, marcar concluída, navegar entre views)
- Categorias customizáveis (criar/editar/cor)
- Modo "foco do dia": lista curada manualmente do que importa hoje, separado do backlog geral
- Marcar "não fiz hoje" (por tarefa ou "fechar o dia"): registra a falha e empurra para amanhã, alimentando a taxa de conclusão

## 6. Funcionalidades — Diário / Check-in diário

### Essenciais (MVP)
- Uma entrada por dia, acessível a partir da Home ("Como foi seu dia?")
- Seletor de humor: 5 níveis, com emoji ou ícone customizado (não usar emoji genérico do sistema — desenhar um pequeno set consistente com o design, ver seção 7)
- Campo "o que aconteceu" (texto livre, resumo do dia)
- Campo opcional de gratidão/destaque positivo
- Timeline/histórico: lista de entradas passadas por data, navegável por mês (visão tipo calendário)
- Edição de entradas passadas

### Avançadas (fase 2)
- Gráfico simples de humor ao longo do tempo (linha ou heatmap tipo GitHub contributions, mas com cores de humor)
- Prompts opcionais para ajudar a escrever ("O que te deixou orgulhoso hoje?", "O que poderia ter sido melhor?")
- Vincular tarefas concluídas do dia automaticamente ao resumo da entrada (ex.: mostrar na entrada do diário quais tarefas foram feitas naquele dia, como contexto)
- Busca por texto dentro do diário
- Revisão semanal automática (`/review`): resumo de segunda a domingo montado a partir das tarefas e do diário, sem nada para preencher

Não inclua fotos/anexos multimídia no MVP — mantém o escopo simples e rápido de construir.

## 7. Design system

Minimalista, moderno, "calmo" — não é uma ferramenta de produtividade agressiva/corporativa. Referências principais: **Things 3** (clareza, cards leves, cores suaves por categoria, muito espaço em branco) e **Notion** (tipografia limpa, hierarquia por peso e tamanho em vez de bordas/linhas). Evite o visual "denso" de ferramentas tipo Jira/Asana.

### Princípios
- Espaço em branco generoso. Nunca lotar a tela.
- Hierarquia por tipografia e espaçamento, não por bordas/sombras pesadas.
- Cor com propósito: cor de categoria e cor de humor carregam significado; o resto da UI é neutro (grayscale).
- Uma ação primária óbvia por tela (ex.: botão "+" flutuante ou fixo para adicionar tarefa).
- Micro-interações sutis (Framer Motion): fade/slide leve ao completar tarefa, transição suave entre views. Nada de animação chamativa.
- Dark mode e light mode desde o início, não como afterthought.

### Cores (light mode como base)
```
--background:        #FAFAFA
--surface:            #FFFFFF
--surface-secondary:  #F4F4F5
--border:             #E4E4E7
--text-primary:       #18181B
--text-secondary:     #71717A
--text-tertiary:      #A1A1AA
--accent:             #6366F1   /* indigo suave — cor de ação primária */
--accent-hover:       #4F46E5
```

Dark mode (inverter com cuidado, não é só "trocar preto e branco"):
```
--background:        #0F0F11
--surface:            #18181B
--surface-secondary:  #212124
--border:             #2A2A2E
--text-primary:       #F4F4F5
--text-secondary:     #A1A1AA
--text-tertiary:      #71717A
--accent:             #818CF8
```

### Cores de categoria (seed inicial, tons pastéis/dessaturados — estilo Things 3)
```
Trabalho:  #60A5FA (azul)
Trade:     #34D399 (verde)
Estudos:   #FBBF24 (âmbar)
Saúde:     #F472B6 (rosa)
Leitura:   #A78BFA (roxo)
Pessoal:   #94A3B8 (cinza-azulado)
```

### Cores de humor (escala visual clara, não usar vermelho/verde de "erro/sucesso" — é humor, não status)
```
Muito ruim:  #94A3B8 → tom mais frio/apagado
Ruim:        #A5B4CB
Neutro:      #C4B5FD
Bom:         #93C5FD
Muito bom:   #FCD34D → tom mais quente/vivo
```
(Livre para ajustar a curva de cor, mas mantenha uma progressão visual coerente de "apagado/frio" para "vivo/quente".)

### Tipografia
- Fonte: **Inter** (via `next/font`, self-hosted — não CDN externo) para todo o app. Se quiser diferenciar títulos, usar a mesma família com peso maior, não misturar fontes.
- Escala: 
  - Título de página: 28px / semibold
  - Título de seção/card: 16-18px / medium
  - Corpo: 14-15px / regular
  - Texto secundário/meta (datas, contadores): 12-13px / regular, cor `text-secondary`

### Componentes-chave
- **Checkbox de tarefa**: círculo, não quadrado (mais orgânico, referência Things). Preenche com a cor da categoria ao marcar, com uma animação curta de "pop".
- **Cards de tarefa**: sem borda pesada, só um `surface` levemente diferente do `background` e radius generoso (12-16px). Sombra quase imperceptível, só o suficiente pra dar profundidade em light mode.
- **Botão de adicionar**: flutuante ou fixo no rodapé, ícone "+", cor de accent.
- **Seletor de humor**: 5 ícones grandes em linha, o selecionado cresce levemente e ganha cor; os demais ficam em grayscale.
- **Navegação**: sidebar minimalista à esquerda (desktop) com ícones + labels curtos (Hoje, Tarefas, Diário, Estatísticas) — colapsável. Em mobile/tela estreita, vira bottom nav.
- **Border radius global**: generoso (12-20px) — nada de cantos retos, isso é parte importante do tom "moderno e suave".

### Responsividade
Mobile-first mesmo sendo um app pessoal: o Henrique provavelmente vai querer abrir no celular durante o dia (marcar tarefa, checar humor) e usar a tela cheia só no fim do dia para o diário. Sidebar vira bottom nav abaixo de `md`.

## 8. Convenções de código

- TypeScript estrito (`strict: true` no tsconfig). Sem `any` — se precisar, documente o porquê.
- Componentes em PascalCase, arquivos de componente `ComponentName.tsx`.
- Hooks customizados em `/hooks`, prefixo `use`.
- Toda chamada de API do client passa por um hook React Query (`useTasks`, `useCreateTask`, `useJournalEntry` etc.) — nunca `fetch` direto dentro de componente de UI.
- Texto pesquisável vive numa coluna `searchText` normalizada (`buildSearchText` em `lib/utils.ts`), preenchida em toda escrita. O `LIKE` do SQLite não ignora acento, então buscar na coluna crua perde "PREGÃO" vs "pregão".
- Toda rota que escreve no banco chama `scheduleBackup()` — o backup é o que protege a única cópia do diário.
- Commits pequenos e descritivos, em português, no formato `feat: adiciona quick-add de tarefas`, `fix: corrige timezone da entrada de diário`.
- Sem comentários óbvios no código; comente só decisões não triviais.
- Acessibilidade básica: labels em inputs, `aria-label` em botões só com ícone, contraste mínimo AA nas cores acima (já validadas para isso).

## 9. Roadmap sugerido de implementação

1. **Setup**: Next.js + TypeScript + Tailwind + Prisma/SQLite, schema inicial, seed de categorias padrão.
2. **Design system base**: tokens de cor (CSS variables + Tailwind config), fonte, componentes de UI primitivos (Button, Input, Checkbox, Card, Badge), toggle de dark mode.
3. **To-do MVP**: CRUD de tarefas, view "Hoje", quick-add, marcar concluída, categorias.
4. **Diário MVP**: seletor de humor, campo de texto, salvar entrada do dia, timeline simples.
5. **Home unificada**: tela do dia juntando tarefas de hoje + card de humor/diário.
6. **Views avançadas de tarefas**: próximos 7 dias, todas, filtros por categoria, drag-and-drop.
7. **Estatísticas**: streak de tarefas concluídas, gráfico/heatmap de humor.
8. **Polimento**: animações Framer Motion, empty states bem desenhados, atalhos de teclado, command palette.

Construa nessa ordem. Não pule para "polimento" antes do MVP funcional das duas partes (tarefas + diário) estarem de pé — é melhor ter as duas partes simples funcionando do que uma parte muito bonita e a outra ausente.

## 9.1 No radar (ideia aceita, ainda não implementada)

**Resumo em prosa da semana.** Hoje `/review` calcula tudo que é calculável e cita
na íntegra o que o Henrique escreveu nos campos de destaque e "poderia ser melhor".
O que falta é uma síntese em palavras novas — "sua semana foi puxada no trabalho e
você adiou estudo três vezes seguidas". Isso exige um modelo de linguagem lendo o
texto do diário, o que traz três decisões ainda não tomadas:

1. **Onde o modelo roda.** Uma API externa significa mandar o diário para fora, o que
   contraria o espírito de app local desta seção 10. Um modelo local (Ollama) mantém
   tudo na máquina em troca de setup e RAM.
2. **Quando roda.** Sob demanda (botão "resumir a semana") custa menos e deixa claro
   que a síntese é gerada; automático no domingo é mais fluido e mais caro.
3. **Como o texto é marcado.** O resumo precisa ser visivelmente distinto do que o
   Henrique escreveu — um resumo gerado que se passa por anotação dele próprio
   corromperia o registro histórico, que é o valor central do diário.

Enquanto isso não for decidido, a regra vale: **não inventar síntese do texto dele**.
Citar literal é melhor que parafrasear errado.

## 10. Fora de escopo (não implementar a menos que pedido)

- Autenticação/login/múltiplos usuários
- Sincronização em nuvem / backend externo (o backup grava numa pasta local sincronizada pelo Google Drive para Desktop — é um caminho de arquivo, não uma integração de API)
- Notificações push
- Integrações externas (calendário do Google, Slack, etc.)
- Anexos de arquivo/foto no diário
- App mobile nativo (é uma web app responsiva)

---

Ao iniciar o desenvolvimento, comece pelo passo 1 do roadmap e vá confirmando com o usuário antes de avançar entre fases grandes (ex.: antes de sair do MVP de tarefas para o MVP de diário), mas dentro de uma fase pode seguir de forma autônoma implementando os itens listados.
