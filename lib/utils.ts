import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Converte um hex em rgba — usado para fundos suaves de categoria/humor. */
export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized.split('').map((c) => c + c).join('')
      : normalized;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * As cores de categoria e de humor são pastéis por decisão de design — ótimas como
 * preenchimento, mas abaixo de AA quando viram texto. Esta mistura puxa a cor na
 * direção da tinta primária do tema, o que escurece no claro e clareia no escuro
 * mantendo o matiz reconhecível.
 */
export function readableTint(hex: string, strength = 62): string {
  return `color-mix(in oklab, ${hex} ${strength}%, var(--text-primary))`;
}

/**
 * Minúsculas e sem acento, para comparação de texto.
 *
 * O `LIKE` do SQLite (que é o que o `contains` do Prisma vira) só ignora
 * maiúsculas em ASCII: "TRADES" acha "Trades", mas "PREGÃO" não acha "pregão".
 * Guardamos uma cópia normalizada do texto em `searchText` e buscamos nela.
 *
 * A faixa ̀-ͯ são os diacríticos combinantes que o NFD separa das
 * letras — escrita escapada de propósito, porque escrita literal é invisível
 * num editor e qualquer conversão de encoding a quebraria em silêncio.
 */
export function stripDiacritics(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Versão para busca: além de tirar acento, apara e colapsa espaços.
 *
 * Separada de `stripDiacritics` de propósito — o parser do quick-add casa padrões
 * no texto normalizado e recorta o ORIGINAL pelos índices encontrados, então lá
 * qualquer mudança de comprimento (um trim, um espaço colapsado) desalinharia os
 * dois e comeria letras do título.
 */
export function normalizeSearch(value: string): string {
  return stripDiacritics(value).replace(/\s+/g, ' ').trim();
}

/** Junta campos de texto num único alvo de busca. */
export function buildSearchText(...parts: (string | null | undefined)[]): string {
  return normalizeSearch(parts.filter(Boolean).join(' '));
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function initials(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

let idCounter = 0;
export function nextId(prefix = 'id'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now().toString(36)}`;
}
