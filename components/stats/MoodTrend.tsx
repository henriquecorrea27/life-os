'use client';

import { useMemo, useState } from 'react';
import { MOODS, MOOD_META, type Mood } from '@/lib/constants';
import { capitalize, formatShort } from '@/lib/dates';
import { ChartTooltip } from './ChartTooltip';

interface Point {
  date: string;
  mood: Mood;
  score: number;
}

const WIDTH = 100;
const HEIGHT = 34;
const LIMIT = 40;

/**
 * Linha de humor das últimas entradas. Série única: sem legenda de série, mas com
 * os rótulos da escala (muito ruim → muito bom) no eixo, que é o que dá sentido
 * à altura. Cada ponto usa a cor do próprio humor.
 */
export function MoodTrend({ data }: { data: Point[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const points = useMemo(() => data.slice(-LIMIT), [data]);

  if (points.length < 2) {
    return (
      <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-card">
        <h2 className="text-section font-medium text-content-primary">Curva de humor</h2>
        <p className="mt-2 text-meta text-content-secondary">
          Registre pelo menos dois dias no diário para ver a tendência aparecer aqui.
        </p>
      </section>
    );
  }

  const coords = points.map((point, index) => ({
    ...point,
    x: (index / (points.length - 1)) * WIDTH,
    y: HEIGHT - ((point.score - 1) / 4) * HEIGHT,
  }));

  const path = coords
    .map((coord, index) => `${index === 0 ? 'M' : 'L'}${coord.x.toFixed(2)} ${coord.y.toFixed(2)}`)
    .join(' ');

  const area = `${path} L${WIDTH} ${HEIGHT} L0 ${HEIGHT} Z`;
  const average = points.reduce((sum, point) => sum + point.score, 0) / points.length;
  const averageLabel = MOOD_META[MOODS[Math.round(average) - 1] ?? 'NEUTRAL'].label;

  return (
    <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-card">
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-section font-medium text-content-primary">Curva de humor</h2>
          <p className="mt-0.5 text-meta text-content-secondary">
            Últimas {points.length} entradas
          </p>
        </div>
        <p className="shrink-0 text-meta text-content-tertiary">média: {averageLabel}</p>
      </header>

      <div className="flex gap-3">
        <div className="flex h-28 shrink-0 flex-col justify-between py-0.5 text-micro text-content-tertiary">
          <span>Muito bom</span>
          <span>Neutro</span>
          <span>Muito ruim</span>
        </div>

        <div className="relative min-w-0 flex-1">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
            className="h-28 w-full overflow-visible"
            role="img"
            aria-label="Evolução do humor ao longo das últimas entradas"
          >
            <defs>
              <linearGradient id="mood-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0, 0.5, 1].map((ratio) => (
              <line
                key={ratio}
                x1={0}
                x2={WIDTH}
                y1={ratio * HEIGHT}
                y2={ratio * HEIGHT}
                stroke="var(--border)"
                strokeWidth={0.4}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            <path d={area} fill="url(#mood-area)" />
            <path
              d={path}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Marcadores posicionados em % sobre o mesmo sistema de coordenadas do path */}
          <div className="pointer-events-none absolute inset-0">
            {coords.map((coord, index) => (
              <span
                key={coord.date}
                className="absolute rounded-full ring-2 ring-[var(--surface)] transition-all duration-150"
                style={{
                  left: `${(coord.x / WIDTH) * 100}%`,
                  top: `${(coord.y / HEIGHT) * 100}%`,
                  width: hovered === index ? 10 : 8,
                  height: hovered === index ? 10 : 8,
                  marginLeft: hovered === index ? -5 : -4,
                  marginTop: hovered === index ? -5 : -4,
                  backgroundColor: MOOD_META[coord.mood].color,
                  opacity: hovered === null || hovered === index ? 1 : 0.5,
                }}
              />
            ))}
          </div>

          {/* Faixas invisíveis: alvo de hover bem maior que o marcador */}
          <div className="absolute inset-0 flex">
            {coords.map((coord, index) => (
              <button
                key={coord.date}
                type="button"
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                aria-label={`${coord.date}: ${MOOD_META[coord.mood].label}`}
                className="h-full flex-1"
              />
            ))}
          </div>

          {hovered !== null ? (
            <ChartTooltip x={`${((hovered + 0.5) / coords.length) * 100}%`} y={-4}>
              <p className="whitespace-nowrap text-micro font-medium text-content-primary">
                {MOOD_META[coords[hovered].mood].label}
              </p>
              <p className="whitespace-nowrap text-micro text-content-tertiary">
                {capitalize(formatShort(coords[hovered].date))}
              </p>
            </ChartTooltip>
          ) : null}
        </div>
      </div>
    </section>
  );
}
