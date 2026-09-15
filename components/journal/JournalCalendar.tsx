'use client';

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  isSameMonth,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { MOOD_META } from '@/lib/constants';
import { capitalize, formatMonthTitle, toDateKey, todayKey } from '@/lib/dates';
import type { JournalEntryDTO } from '@/lib/types';
import { cn, readableTint, withAlpha } from '@/lib/utils';
import { IconButton } from '@/components/ui/IconButton';

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function JournalCalendar({
  month,
  onMonthChange,
  entries,
}: {
  month: Date;
  onMonthChange: (month: Date) => void;
  entries: JournalEntryDTO[];
}) {
  const today = todayKey();

  const byDate = useMemo(() => {
    const map = new Map<string, JournalEntryDTO>();
    for (const entry of entries) map.set(entry.date, entry);
    return map;
  }, [entries]);

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const leading = start.getDay();
    return {
      leading: Array.from({ length: leading }),
      dates: eachDayOfInterval({ start, end }),
    };
  }, [month]);

  const isCurrentMonth = isSameMonth(month, new Date());

  return (
    <section className="rounded-2xl border border-border/70 bg-surface p-4 shadow-card">
      <header className="mb-3 flex items-center justify-between gap-2 px-1">
        <h2 className="text-section font-medium text-content-primary">
          {capitalize(formatMonthTitle(month))}
        </h2>
        <div className="flex items-center gap-1">
          <IconButton
            size="sm"
            aria-label="Mês anterior"
            onClick={() => onMonthChange(subMonths(month, 1))}
          >
            <ChevronLeft size={15} />
          </IconButton>
          <IconButton
            size="sm"
            aria-label="Próximo mês"
            onClick={() => onMonthChange(addMonths(month, 1))}
            disabled={isCurrentMonth}
          >
            <ChevronRight size={15} />
          </IconButton>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className="pb-1 text-center text-micro font-medium text-content-tertiary"
          >
            {label}
          </span>
        ))}

        {days.leading.map((_, index) => (
          <span key={`lead-${index}`} />
        ))}

        {days.dates.map((date) => {
          const key = toDateKey(date);
          const entry = byDate.get(key);
          const isToday = key === today;
          const isFuture = key > today;
          const color = entry ? MOOD_META[entry.mood].color : null;

          const content = (
            <motion.span
              whileHover={isFuture ? undefined : { scale: 1.08 }}
              whileTap={isFuture ? undefined : { scale: 0.94 }}
              className={cn(
                'relative flex h-10 w-full items-center justify-center rounded-xl text-meta tabular-nums transition-colors sm:h-11',
                isFuture
                  ? 'text-content-tertiary/50'
                  : entry
                    ? 'font-medium'
                    : 'text-content-secondary hover:bg-surface-secondary',
                isToday && !entry && 'ring-1 ring-inset ring-accent/60 text-accent font-medium',
              )}
              style={
                entry
                  ? {
                      backgroundColor: withAlpha(color as string, 0.22),
                      color: readableTint(color as string),
                      boxShadow: isToday ? `inset 0 0 0 1.5px ${color}` : undefined,
                    }
                  : undefined
              }
            >
              {date.getDate()}
            </motion.span>
          );

          if (isFuture) {
            return (
              <span key={key} className="flex" aria-disabled>
                {content}
              </span>
            );
          }

          return (
            <Link
              key={key}
              href={`/journal/${key}`}
              aria-label={
                entry ? `${key} — ${MOOD_META[entry.mood].label}` : `Escrever sobre ${key}`
              }
              className="flex"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
