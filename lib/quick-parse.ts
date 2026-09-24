import { addDays, nextDay, type Day } from 'date-fns';
import type { Priority } from './constants';
import { toDateKey, todayKey, type DateKey } from './dates';
import type { CategoryDTO } from './types';
import { stripDiacritics } from './utils';

export interface ParsedQuickAdd {
  title: string;
  dueDate: DateKey | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  priority: Priority;
  recurrence: string | null;
  isFocus: boolean;
}

// Sem trim: o `cut` abaixo recorta o texto original pelos indices do normalizado.
export const normalize = stripDiacritics;

const WEEKDAY_WORDS: { pattern: RegExp; day: Day }[] = [
  { pattern: /\b(domingo|dom)\b/, day: 0 },
  { pattern: /\b(segunda-feira|segunda|seg)\b/, day: 1 },
  { pattern: /\b(terca-feira|terca|ter)\b/, day: 2 },
  { pattern: /\b(quarta-feira|quarta|qua)\b/, day: 3 },
  { pattern: /\b(quinta-feira|quinta|qui)\b/, day: 4 },
  { pattern: /\b(sexta-feira|sexta|sex)\b/, day: 5 },
  { pattern: /\b(sabado|sab)\b/, day: 6 },
];

// Os padrões mais específicos vêm primeiro: "todos os dias úteis" precisa vencer
// "todos os dias", senão sobra a palavra "úteis" solta no título.
const RECURRENCE_WORDS: { pattern: RegExp; value: string }[] = [
  {
    pattern: /\b(todos os dias uteis|todo dia util|dias uteis|durante a semana)\b/,
    value: 'weekly:mon,tue,wed,thu,fri',
  },
  { pattern: /\b(todo dia|todos os dias|diariamente|diario)\b/, value: 'daily' },
  { pattern: /\b(toda segunda|todas as segundas)\b/, value: 'weekly:mon' },
  { pattern: /\b(toda terca|todas as tercas)\b/, value: 'weekly:tue' },
  { pattern: /\b(toda quarta|todas as quartas)\b/, value: 'weekly:wed' },
  { pattern: /\b(toda quinta|todas as quintas)\b/, value: 'weekly:thu' },
  { pattern: /\b(toda sexta|todas as sextas)\b/, value: 'weekly:fri' },
  { pattern: /\b(todo sabado|todos os sabados)\b/, value: 'weekly:sat' },
  { pattern: /\b(todo domingo|todos os domingos)\b/, value: 'weekly:sun' },
];

const PRIORITY_WORDS: { pattern: RegExp; value: Priority }[] = [
  { pattern: /(^|\s)!{1}(1|alta|urgente|p1)\b/, value: 'HIGH' },
  { pattern: /(^|\s)!{1}(2|media|medio|p2)\b/, value: 'MEDIUM' },
  { pattern: /(^|\s)!{1}(3|baixa|p3)\b/, value: 'LOW' },
];

/**
 * O texto é consumido em duas trilhas: `normalized` (sem acento, minúsculo) guia
 * o casamento dos padrões, e os índices encontrados recortam o texto ORIGINAL,
 * preservando acentuação e caixa do título que sobra.
 */
function cut(original: string, normalized: string, pattern: RegExp) {
  const match = normalized.match(pattern);
  if (!match || match.index === undefined) return null;
  const start = match.index + (match[1] === ' ' ? 1 : 0);
  const end = match.index + match[0].length;
  return {
    matched: match,
    original: original.slice(0, start) + original.slice(end),
    normalized: normalized.slice(0, start) + normalized.slice(end),
  };
}

function resolveRelativeDate(normalized: string): { key: DateKey; pattern: RegExp } | null {
  const today = new Date();

  const simple: { pattern: RegExp; resolve: () => Date }[] = [
    { pattern: /\b(depois de amanha)\b/, resolve: () => addDays(today, 2) },
    { pattern: /\b(amanha)\b/, resolve: () => addDays(today, 1) },
    { pattern: /\b(hoje)\b/, resolve: () => today },
    { pattern: /\b(ontem)\b/, resolve: () => addDays(today, -1) },
    { pattern: /\b(proxima semana|semana que vem)\b/, resolve: () => addDays(today, 7) },
    { pattern: /\b(fim de semana|final de semana)\b/, resolve: () => nextDay(today, 6) },
  ];

  for (const entry of simple) {
    if (entry.pattern.test(normalized)) {
      return { key: toDateKey(entry.resolve()), pattern: entry.pattern };
    }
  }

  for (const entry of WEEKDAY_WORDS) {
    const bare = entry.pattern.source.slice(2, -2);
    const withPrefix = new RegExp(String.raw`\b(?:na |no |proxima |proximo )?` + bare + String.raw`\b`);
    if (withPrefix.test(normalized)) {
      return { key: toDateKey(nextDay(today, entry.day)), pattern: withPrefix };
    }
  }

  // "15/03", "15/03/2026" ou "dia 15"
  const numeric = normalized.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]) - 1;
    const rawYear = numeric[3] ? Number(numeric[3]) : today.getFullYear();
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;
    const date = new Date(year, month, day);
    if (date.getDate() === day && date.getMonth() === month) {
      return { key: toDateKey(date), pattern: new RegExp(escapeRegExp(numeric[0])) };
    }
  }

  const dayOnly = normalized.match(/\bdia (\d{1,2})\b/);
  if (dayOnly) {
    const day = Number(dayOnly[1]);
    if (day >= 1 && day <= 31) {
      const candidate = new Date(today.getFullYear(), today.getMonth(), day);
      const date = candidate < new Date(today.toDateString())
        ? new Date(today.getFullYear(), today.getMonth() + 1, day)
        : candidate;
      return { key: toDateKey(date), pattern: new RegExp(escapeRegExp(dayOnly[0])) };
    }
  }

  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseQuickAdd(input: string, categories: CategoryDTO[]): ParsedQuickAdd {
  let original = input;
  let normalized = normalize(input);

  const result: ParsedQuickAdd = {
    title: input.trim(),
    dueDate: null,
    categoryId: null,
    categoryName: null,
    categoryColor: null,
    priority: 'NONE',
    recurrence: null,
    isFocus: false,
  };

  // #categoria
  const categoryMatch = normalized.match(/(^|\s)#([\p{L}\d_-]+)/u);
  if (categoryMatch) {
    const token = categoryMatch[2];
    const found = categories.find((category) => {
      const name = normalize(category.name);
      return name === token || name.startsWith(token);
    });
    if (found) {
      result.categoryId = found.id;
      result.categoryName = found.name;
      result.categoryColor = found.color;
      const removal = cut(original, normalized, /(^|\s)#[\p{L}\d_-]+/u);
      if (removal) {
        original = removal.original;
        normalized = removal.normalized;
      }
    }
  }

  // @foco
  const focusRemoval = cut(original, normalized, /(^|\s)@foco\b/);
  if (focusRemoval) {
    result.isFocus = true;
    original = focusRemoval.original;
    normalized = focusRemoval.normalized;
  }

  for (const entry of PRIORITY_WORDS) {
    const removal = cut(original, normalized, entry.pattern);
    if (removal) {
      result.priority = entry.value;
      original = removal.original;
      normalized = removal.normalized;
      break;
    }
  }

  for (const entry of RECURRENCE_WORDS) {
    const removal = cut(original, normalized, entry.pattern);
    if (removal) {
      result.recurrence = entry.value;
      original = removal.original;
      normalized = removal.normalized;
      if (!result.dueDate) result.dueDate = todayKey();
      break;
    }
  }

  if (!result.recurrence) {
    const relative = resolveRelativeDate(normalized);
    if (relative) {
      const removal = cut(original, normalized, relative.pattern);
      if (removal) {
        result.dueDate = relative.key;
        original = removal.original;
        normalized = removal.normalized;
      }
    }
  }

  result.title = tidyTitle(original);
  return result;
}

/**
 * Tirar a data do meio da frase costuma deixar uma preposição pendurada
 * ("revisar trades de hoje" → "revisar trades de"). Aqui ela cai junto.
 */
const DANGLING = /\s+(de|da|do|em|no|na|para|pra|até|ate|a|ao|à)$/i;

function tidyTitle(value: string): string {
  let title = value.replace(/\s{2,}/g, ' ').trim();
  while (DANGLING.test(title)) {
    title = title.replace(DANGLING, '').trim();
  }
  return title;
}
