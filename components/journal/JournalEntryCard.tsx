'use client';

import { motion } from 'framer-motion';
import { Heart, Sprout } from 'lucide-react';
import Link from 'next/link';
import { MOOD_META } from '@/lib/constants';
import { capitalize, formatLong } from '@/lib/dates';
import type { JournalEntryDTO } from '@/lib/types';
import { readableTint, withAlpha } from '@/lib/utils';
import { MoodIcon } from './MoodIcon';

export function JournalEntryCard({ entry }: { entry: JournalEntryDTO }) {
  const meta = MOOD_META[entry.mood];
  const preview = entry.summary ?? entry.freeText ?? null;

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        href={`/journal/${entry.date}`}
        className="group flex gap-3.5 rounded-2xl border border-transparent bg-surface px-4 py-3.5 shadow-card transition-all duration-200 hover:border-border/70 hover:shadow-float"
      >
        <span
          className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: withAlpha(meta.color, 0.16) }}
        >
          <MoodIcon mood={entry.mood} size={22} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-body font-medium text-content-primary">
              {capitalize(formatLong(entry.date))}
            </p>
            <span className="shrink-0 text-micro font-medium" style={{ color: readableTint(meta.color) }}>
              {meta.label}
            </span>
          </div>

          {preview ? (
            <p className="mt-1 line-clamp-2 text-meta leading-relaxed text-content-secondary">
              {preview}
            </p>
          ) : (
            <p className="mt-1 text-meta italic text-content-tertiary">Sem anotações neste dia.</p>
          )}

          {entry.gratitude || entry.improve ? (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-micro text-content-tertiary">
              {entry.gratitude ? (
                <span className="inline-flex items-center gap-1">
                  <Heart size={11} />
                  gratidão
                </span>
              ) : null}
              {entry.improve ? (
                <span className="inline-flex items-center gap-1">
                  <Sprout size={11} />
                  a melhorar
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </Link>
    </motion.div>
  );
}
