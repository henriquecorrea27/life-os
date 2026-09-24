'use client';

import { useState } from 'react';
import { capitalize, formatShort } from '@/lib/dates';
import { cn, pluralize } from '@/lib/utils';
import { ChartTooltip } from './ChartTooltip';

interface Point {
  date: string;
  completed: number;
  missed: number;
}

/**
 * Barras de tarefas concluídas por dia. Uma única série, então dispensa legenda:
 * o título do card já a nomeia. Eixo e grade ficam recessivos de propósito.
 */
export function CompletionChart({ data, days = 30 }: { data: Point[]; days?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const points = data.slice(-days);
  // A escala inclui as não feitas: sem isso, um dia de 1 feita e 6 adiadas
  // desenharia a mesma barra de um dia de 1 feita e nada pendente.
  const max = Math.max(...points.map((point) => point.completed + point.missed), 1);
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
                const planned = point.completed + point.missed;
                const active = hovered === index;
                return (
                  <button
                    key={point.date}
                    type="button"
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered(null)}
                    aria-label={`${formatShort(point.date)}: ${point.completed} ${pluralize(point.completed, 'concluída', 'concluídas')}${point.missed ? `, ${point.missed} não ${pluralize(point.missed, 'feita', 'feitas')}` : ''}`}
                    className="group relative flex h-full flex-1 flex-col justify-end"
                  >
                    {point.missed > 0 ? (
                      <span
                        className="w-full rounded-t-[4px] transition-opacity duration-150"
                        style={{
                          height: `${(point.missed / max) * 100}%`,
                          backgroundColor: 'var(--border)',
                          opacity: active ? 1 : 0.9,
                        }}
                      />
                    ) : null}
                    <span
                      className={cn(
                        'w-full transition-colors duration-150',
                        point.missed > 0 ? 'rounded-b-[4px]' : 'rounded-t-[4px]',
                      )}
                      style={{
                        height: `${Math.max((point.completed / max) * 100, point.completed > 0 ? 6 : planned > 0 ? 0 : 2)}%`,
                        backgroundColor:
                          point.completed === 0
                            ? planned > 0
                              ? 'transparent'
                              : 'var(--surface-secondary)'
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
                  {pluralize(points[hovered].completed, 'concluída', 'concluídas')}
                </p>
                {points[hovered].missed > 0 ? (
                  <p className="whitespace-nowrap text-micro text-content-tertiary">
                    {points[hovered].missed} não{' '}
                    {pluralize(points[hovered].missed, 'feita', 'feitas')}
                  </p>
                ) : null}
                <p className="whitespace-nowrap text-micro text-content-tertiary">
                  {capitalize(formatShort(points[hovered].date))}
                </p>
              </ChartTooltip>
            ) : null}
          </div>

          {points.length ? (
            <div className="mt-2 flex items-center justify-between text-micro text-content-tertiary">
              <span>{capitalize(formatShort(points[0].date))}</span>
              {points.some((point) => point.missed > 0) ? (
                <span className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-[2px] bg-accent" aria-hidden />
                    concluídas
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-[2px] bg-border" aria-hidden />
                    não feitas
                  </span>
                </span>
              ) : null}
              <span>hoje</span>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
