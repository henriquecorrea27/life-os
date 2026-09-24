import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Datas de vencimento e entradas de diário têm granularidade de DIA.
 * Convenção do projeto: persistimos sempre a meia-noite UTC do dia escolhido
 * ("2026-09-14T00:00:00.000Z") e convertemos para chave local na borda.
 * Isso evita que o fuso deslize a data um dia para trás/frente ao serializar.
 */

export type DateKey = string; // "YYYY-MM-DD"

export function toDateKey(value: Date | string): DateKey {
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return toDateKey(parseISO(value));
  }
  return format(value, 'yyyy-MM-dd');
}

/** Chave de dia a partir de um Date que veio do banco (meia-noite UTC). */
export function dateKeyFromStored(value: Date | string): DateKey {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

/** Converte "YYYY-MM-DD" no Date canônico (meia-noite UTC) para persistir. */
export function dateKeyToStored(key: DateKey): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

/** Converte "YYYY-MM-DD" num Date local, seguro para formatação na UI. */
export function dateKeyToLocal(key: DateKey): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function todayKey(): DateKey {
  return format(new Date(), 'yyyy-MM-dd');
}

export function shiftKey(key: DateKey, days: number): DateKey {
  return toDateKey(addDays(dateKeyToLocal(key), days));
}

export function isValidDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(dateKeyToLocal(value));
}

export function formatLong(key: DateKey): string {
  return format(dateKeyToLocal(key), "EEEE, d 'de' MMMM", { locale: ptBR });
}

export function formatShort(key: DateKey): string {
  return format(dateKeyToLocal(key), "d 'de' MMM", { locale: ptBR });
}

export function formatMonthTitle(date: Date): string {
  return format(date, "MMMM 'de' yyyy", { locale: ptBR });
}

/**
 * Rótulo humano e relativo para uma data de vencimento.
 * O passado é SEMPRE relativo (até 90 dias): misturar "5 dias atrás" com
 * "16 de set" na mesma lista de atrasadas esconde qual está mais vencida.
 */
export function formatDueLabel(key: DateKey): string {
  const diff = differenceInCalendarDays(dateKeyToLocal(key), startOfDay(new Date()));
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  if (diff > 1 && diff < 7) {
    return format(dateKeyToLocal(key), 'EEEE', { locale: ptBR });
  }
  if (diff < 0) {
    const late = Math.abs(diff);
    if (late <= 90) return `${late} dias atrás`;
    return `atrasada desde ${formatShort(key)}`;
  }
  return formatShort(key);
}

export function dueState(key: DateKey | null | undefined): 'overdue' | 'today' | 'future' | 'none' {
  if (!key) return 'none';
  const diff = differenceInCalendarDays(dateKeyToLocal(key), startOfDay(new Date()));
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  return 'future';
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Boa madrugada';
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
