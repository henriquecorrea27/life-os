'use client';

import { motion } from 'framer-motion';
import { withAlpha } from '@/lib/utils';

interface Row {
  id: string;
  name: string;
  color: string;
  completed: number;
  open: number;
}

/**
 * Barras horizontais por categoria. Cada linha traz o nome escrito ao lado da cor,
 * então a identidade nunca depende do matiz — o que importa porque a paleta de
 * categorias é pastel por decisão de design e tem pares de baixo contraste entre si.
 */
export function CategoryBreakdown({ rows }: { rows: Row[] }) {
  const ranked = [...rows]
    .map((row) => ({ ...row, total: row.completed + row.open }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);

  const max = Math.max(...ranked.map((row) => row.total), 1);

  return (
    <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-card">
      <header className="mb-4">
        <h2 className="text-section font-medium text-content-primary">Por categoria</h2>
        <p className="mt-0.5 text-meta text-content-secondary">
          Concluídas e em aberto, desde o começo
        </p>
      </header>

      {ranked.length === 0 ? (
        <p className="py-4 text-meta text-content-tertiary">
          Nenhuma tarefa categorizada ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-3.5">
          {ranked.map((row) => (
            <div key={row.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                    aria-hidden
                  />
                  <span className="truncate text-meta font-medium text-content-primary">
                    {row.name}
                  </span>
                </span>
                <span className="shrink-0 text-micro tabular-nums text-content-tertiary">
                  {row.completed} de {row.total}
                </span>
              </div>

              <div className="flex h-2 gap-[2px] overflow-hidden rounded-full">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${(row.completed / max) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 140, damping: 24 }}
                  className="rounded-full"
                  style={{ backgroundColor: row.color }}
                />
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${(row.open / max) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 140, damping: 24, delay: 0.05 }}
                  className="rounded-full"
                  style={{ backgroundColor: withAlpha(row.color, 0.25) }}
                />
              </div>
            </div>
          ))}

          <div className="mt-1 flex items-center gap-4 border-t border-border/60 pt-3">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full bg-content-tertiary"
                aria-hidden
              />
              <span className="text-micro text-content-tertiary">concluídas</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full bg-content-tertiary/30"
                aria-hidden
              />
              <span className="text-micro text-content-tertiary">em aberto</span>
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
