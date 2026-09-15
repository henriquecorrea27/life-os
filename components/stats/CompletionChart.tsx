'use client';

import { useState } from 'react';
import { capitalize, formatShort } from '@/lib/dates';
import { pluralize } from '@/lib/utils';
import { ChartTooltip } from './ChartTooltip';

interface Point {
  date: string;
  completed: number;
}

/**
 * Barras de tarefas concluídas por dia. Uma única série, então dispensa legenda:
 * o título do card já a nomeia. Eixo e grade ficam recessivos de propósito.
 */
export function CompletionChart({ data, days = 30 }: { data: Point[]; days?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const points = data.slice(-days);
  const max = Math.max(...points.map((point) => point.completed), 1);
  const total = points.reduce((sum, point) => sum + point.completed, 0);
  const average = points.length ? total / points.length : 0;

  return (
    <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-card">
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-section font-medium text-content-primary">Tarefas concluídas</h2>
          <p className="mt-0.5 text-meta text-content-secondary">Últimos {points.length} dias</p>
        </div>
        {total > 0 ? (
          <p className="shrink-0 text-meta tabular-nums text-content-tertiary">
            {average.toFixed(1)}/dia
          </p>
        ) : null}
      </header>

      {total === 0 ? (
        <p className="py-8 text-center text-meta text-content-tertiary">
          Nenhuma tarefa concluída nesse período ainda.
        </p>
      ) : (
        <>
          <div className="relative">
            <div className="flex h-32 items-end gap-[2px]">
              {points.map((point, index) => {
                const ratio = point.completed / max;
                const active = hovered === index;
                return (
                  <button
                    key={point.date}
                    type="button"
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered(null)}
                    aria-label={`${formatShort(point.date)}: ${point.completed} ${pluralize(point.completed, 'tarefa', 'tarefas')}`}
                    className="group relative flex h-full flex-1 items-end"
                  >
                    <span
                      className="w-full rounded-t-[4px] transition-colors duration-150"
                      style={{
                        height: `${Math.max(ratio * 100, point.completed > 0 ? 6 : 2)}%`,
                        backgroundColor:
                          point.completed === 0
                            ? 'var(--surface-secondary)'
                            : active
                              ? 'var(--accent-hover)'
                              : 'var(--accent)',
                        opacity: point.completed === 0 ? 1 : active ? 1 : 0.85,
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {hovered !== null && points[hovered] ? (
              <ChartTooltip x={`${((hovered + 0.5) / points.length) * 100}%`} y={-8}>
                <p className="whitespace-nowrap text-micro font-medium text-content-primary">
                  {points[hovered].completed}{' '}
                  {pluralize(points[hovered].completed, 'tarefa', 'tarefas')}
                </p>
                <p className="whitespace-nowrap text-micro text-content-tertiary">
                  {capitalize(formatShort(points[hovered].date))}
                </p>
              </ChartTooltip>
            ) : null}
          </div>

          {points.length ? (
            <div className="mt-2 flex justify-between text-micro text-content-tertiary">
              <span>{capitalize(formatShort(points[0].date))}</span>
              <span>hoje</span>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
