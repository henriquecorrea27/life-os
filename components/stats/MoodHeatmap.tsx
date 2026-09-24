'use client';

import { differenceInCalendarWeeks, eachDayOfInterval, format, startOfWeek, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { MOODS, MOOD_META, type Mood } from '@/lib/constants';
import { capitalize, dateKeyToLocal, formatShort, toDateKey } from '@/lib/dates';
import { clamp, withAlpha } from '@/lib/utils';
import { ChartTooltip } from './ChartTooltip';

const MIN_WEEKS = 13;
const MAX_WEEKS = 26;

interface Cell {
  date: string;
  mood: Mood | null;
}

/**
 * Heatmap de humor no formato de contribuições do GitHub: uma coluna por semana,
 * sete linhas (dom→sáb). A cor é ordinal (frio/apagado → quente/vivo) e a legenda
 * fica sempre visível, então a leitura nunca depende só do matiz.
 *
 * A janela acompanha o histórico em vez de ser fixa: com poucas semanas de diário
 * um ano inteiro de células cinzas diria mais sobre o app ser novo do que sobre
 * o humor. Cresce de um trimestre até seis meses conforme o registro se acumula.
 */
export function MoodHeatmap({ entries }: { entries: { date: string; mood: Mood }[] }) {
  const [hovered, setHovered] = useState<{ date: string; mood: Mood | null; index: number } | null>(
    null,
  );

  const byDate = useMemo(() => {
    const map = new Map<string, Mood>();
    for (const entry of entries) map.set(entry.date, entry.mood);
    return map;
  }, [entries]);

  const { weeks, spanWeeks } = useMemo(() => {
    const end = new Date();

    const oldest = entries.reduce<string | null>(
      (min, entry) => (min === null || entry.date < min ? entry.date : min),
      null,
    );
    const history = oldest
      ? differenceInCalendarWeeks(end, dateKeyToLocal(oldest), { weekStartsOn: 0 }) + 1
      : MIN_WEEKS;
    const span = clamp(history, MIN_WEEKS, MAX_WEEKS);

    const start = startOfWeek(subWeeks(end, span - 1), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });

    const columns: Cell[][] = [];
    let current: Cell[] = [];

    for (const day of days) {
      const key = toDateKey(day);
      current.push({ date: key, mood: byDate.get(key) ?? null });
      if (day.getDay() === 6) {
        columns.push(current);
        current = [];
      }
    }
    if (current.length) columns.push(current);

    return { weeks: columns, spanWeeks: span };
  }, [byDate, entries]);

  // Um rótulo por mês, na primeira coluna em que ele aparece.
  const monthLabels = useMemo(() => {
    let previous = '';
    return weeks.map((week) => {
      const first = week[0];
      if (!first) return null;
      const month = first.date.slice(0, 7);
      if (month === previous) return null;
      previous = month;
      return format(dateKeyToLocal(first.date), 'MMM', { locale: ptBR });
    });
  }, [weeks]);

  const filled = entries.length;

  return (
    <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-card">
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-section font-medium text-content-primary">Humor ao longo do tempo</h2>
          <p className="mt-0.5 text-meta text-content-secondary">
            Últimas {spanWeeks} semanas · {filled} {filled === 1 ? 'registro' : 'registros'}
          </p>
        </div>
      </header>

      <div className="relative">
        <div className="no-scrollbar overflow-x-auto pb-1">
          {/* O teto de largura acompanha o número de semanas (≈17px por coluna).
              Fixá-lo em pixels faria a célula inchar quando há poucas colunas —
              um trimestre de diário viraria uma grade de quadrados gigantes. */}
          <div
            style={{ minWidth: spanWeeks * 11, maxWidth: spanWeeks * 26 }}
          >
            <div className="mb-1 flex gap-[3px]">
              {monthLabels.map((label, index) => (
                <div
                  key={index}
                  className="min-w-0 flex-1 text-[10px] leading-none text-content-tertiary"
                >
                  {label ? <span className="whitespace-nowrap">{label}</span> : null}
                </div>
              ))}
            </div>

            <div className="flex gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-1 flex-col gap-[3px]">
                  {week.map((day) => {
                    const color = day.mood ? MOOD_META[day.mood].color : null;
                    return (
                      <button
                        key={day.date}
                        type="button"
                        onMouseEnter={() =>
                          setHovered({ date: day.date, mood: day.mood, index: weekIndex })
                        }
                        onMouseLeave={() => setHovered(null)}
                        aria-label={
                          day.mood
                            ? `${day.date}: ${MOOD_META[day.mood].label}`
                            : `${day.date}: sem registro`
                        }
                        className="aspect-square w-full rounded-[3px] transition-transform duration-150 hover:scale-125"
                        style={{
                          backgroundColor: color
                            ? withAlpha(color, 0.85)
                            : 'var(--surface-secondary)',
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {hovered ? (
          <ChartTooltip x={`${((hovered.index + 0.5) / weeks.length) * 100}%`} y={-8}>
            <p className="whitespace-nowrap text-micro font-medium text-content-primary">
              {hovered.mood ? MOOD_META[hovered.mood].label : 'Sem registro'}
            </p>
            <p className="whitespace-nowrap text-micro text-content-tertiary">
              {capitalize(formatShort(hovered.date))}
            </p>
          </ChartTooltip>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/60 pt-3">
        {MOODS.map((mood) => (
          <span key={mood} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ backgroundColor: withAlpha(MOOD_META[mood].color, 0.85) }}
              aria-hidden
            />
            <span className="text-micro text-content-tertiary">{MOOD_META[mood].label}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
