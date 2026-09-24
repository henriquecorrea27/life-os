import { WEEKDAYS } from './constants';
import { dateKeyToLocal, shiftKey, type DateKey } from './dates';

export type Recurrence =
  | { kind: 'daily' }
  | { kind: 'weekly'; days: number[] };

const DAY_KEYS = WEEKDAYS.map((d) => d.key);

export function parseRecurrence(value: string | null | undefined): Recurrence | null {
  if (!value) return null;
  if (value === 'daily') return { kind: 'daily' };
  if (value.startsWith('weekly:')) {
    const days = value
      .slice('weekly:'.length)
      .split(',')
      .map((token) => DAY_KEYS.indexOf(token.trim() as (typeof DAY_KEYS)[number]))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b);
    return days.length ? { kind: 'weekly', days } : null;
  }
  return null;
}

export function serializeRecurrence(recurrence: Recurrence | null): string | null {
  if (!recurrence) return null;
  if (recurrence.kind === 'daily') return 'daily';
  if (!recurrence.days.length) return null;
  return `weekly:${[...recurrence.days].sort((a, b) => a - b).map((i) => DAY_KEYS[i]).join(',')}`;
}

export function describeRecurrence(value: string | null | undefined): string | null {
  const recurrence = parseRecurrence(value);
  if (!recurrence) return null;
  if (recurrence.kind === 'daily') return 'Todo dia';
  if (recurrence.days.length === 7) return 'Todo dia';
  const weekdaySet = [1, 2, 3, 4, 5].every((d) => recurrence.days.includes(d));
  if (weekdaySet && recurrence.days.length === 5) return 'Dias úteis';
  return recurrence.days
    .map((index) => WEEKDAYS[index].full.slice(0, 3))
    .join(', ');
}

/**
 * Próxima data de vencimento depois de concluir uma ocorrência.
 *
 * `afterKey` é o piso: a próxima ocorrência nunca cai antes dele. Sem isso, uma
 * tarefa "todo dia" vencida há duas semanas geraria a próxima também no passado,
 * e seria preciso concluí-la catorze vezes para a série voltar ao presente.
 */
export function nextOccurrence(
  value: string | null | undefined,
  fromKey: DateKey,
  afterKey: DateKey = fromKey,
): DateKey | null {
  const recurrence = parseRecurrence(value);
  if (!recurrence) return null;

  // Anda a partir da ocorrência concluída, mas pula tudo que já passou.
  const base = fromKey > afterKey ? fromKey : afterKey;

  if (recurrence.kind === 'daily') return shiftKey(base, 1);

  const current = dateKeyToLocal(base).getDay();
  for (let step = 1; step <= 7; step += 1) {
    const candidate = (current + step) % 7;
    if (recurrence.days.includes(candidate)) return shiftKey(base, step);
  }
  return null;
}
