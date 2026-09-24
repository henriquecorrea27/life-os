export const PRIORITIES = ['NONE', 'LOW', 'MEDIUM', 'HIGH'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_META: Record<
  Priority,
  { label: string; short: string; color: string; weight: number }
> = {
  HIGH: { label: 'Alta', short: 'P1', color: '#F87171', weight: 3 },
  MEDIUM: { label: 'Média', short: 'P2', color: '#FBBF24', weight: 2 },
  LOW: { label: 'Baixa', short: 'P3', color: '#60A5FA', weight: 1 },
  NONE: { label: 'Sem prioridade', short: '—', color: 'transparent', weight: 0 },
};

export const MOODS = ['VERY_BAD', 'BAD', 'NEUTRAL', 'GOOD', 'VERY_GOOD'] as const;
export type Mood = (typeof MOODS)[number];

// `short` existe porque "Muito ruim"/"Muito bom" quebram em duas linhas num
// seletor de cinco colunas em tela de celular, desalinhando os ícones.
export const MOOD_META: Record<
  Mood,
  { label: string; short: string; color: string; score: number }
> = {
  VERY_BAD: { label: 'Muito ruim', short: 'Péssimo', color: '#94A3B8', score: 1 },
  BAD: { label: 'Ruim', short: 'Ruim', color: '#A5B4CB', score: 2 },
  NEUTRAL: { label: 'Neutro', short: 'Neutro', color: '#C4B5FD', score: 3 },
  GOOD: { label: 'Bom', short: 'Bom', color: '#93C5FD', score: 4 },
  VERY_GOOD: { label: 'Muito bom', short: 'Ótimo', color: '#FCD34D', score: 5 },
};

export const CATEGORY_PALETTE = [
  '#60A5FA',
  '#34D399',
  '#FBBF24',
  '#F472B6',
  '#A78BFA',
  '#94A3B8',
  '#FB923C',
  '#2DD4BF',
  '#F87171',
  '#818CF8',
];

export const WEEKDAYS = [
  { key: 'sun', label: 'D', full: 'Domingo', index: 0 },
  { key: 'mon', label: 'S', full: 'Segunda', index: 1 },
  { key: 'tue', label: 'T', full: 'Terça', index: 2 },
  { key: 'wed', label: 'Q', full: 'Quarta', index: 3 },
  { key: 'thu', label: 'Q', full: 'Quinta', index: 4 },
  { key: 'fri', label: 'S', full: 'Sexta', index: 5 },
  { key: 'sat', label: 'S', full: 'Sábado', index: 6 },
] as const;

export const JOURNAL_PROMPTS = [
  'O que te deixou orgulhoso hoje?',
  'O que poderia ter sido melhor?',
  'Qual foi a decisão mais difícil do dia?',
  'O que você aprendeu com os trades de hoje?',
  'Que pequena coisa passou despercebida e merecia atenção?',
  'Como estava sua energia ao longo do dia?',
  'Se o dia se repetisse, o que você mudaria?',
];
