'use client';

import { motion } from 'framer-motion';
import { PenLine } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { useJournalEntries } from '@/hooks/useJournal';
import { capitalize, formatDueLabel, shiftKey, todayKey } from '@/lib/dates';
import { pluralize } from '@/lib/utils';

const LOOKBACK_DAYS = 14;
const SHOW = 4;

/**
 * Aviso de dias sem diário.
 *
 * Hoje fica de fora: o card de check-in logo acima já é o convite para o dia
 * corrente, e repetir a cobrança duas vezes na mesma tela seria barulho.
 * A janela é curta de propósito — cobrar duas semanas atrás não ajuda ninguém
 * a retomar o hábito, só faz o aviso virar permanente.
 */
export function JournalGaps() {
  const today = todayKey();
  const from = shiftKey(today, -LOOKBACK_DAYS);

  const { data: entries } = useJournalEntries({ from, to: today });

  const missing = useMemo(() => {
    const filled = new Set((entries ?? []).map((entry) => entry.date));
    const gaps: string[] = [];
    for (let i = 1; i <= LOOKBACK_DAYS; i += 1) {
      const key = shiftKey(today, -i);
      if (!filled.has(key)) gaps.push(key);
    }
    return gaps;
  }, [entries, today]);

  if (!entries || missing.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border/70 bg-surface-secondary/50 px-4 py-3.5"
    >
      <p className="text-meta text-content-secondary">
        <span className="font-medium text-content-primary">
          {missing.length} {pluralize(missing.length, 'dia', 'dias')}
        </span>{' '}
        {pluralize(missing.length, 'sem registro', 'sem registro')} nas últimas duas semanas.
      </p>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {missing.slice(0, SHOW).map((date) => (
          <Link
            key={date}
            href={`/journal/${date}`}
            className="inline-flex items-center gap-1 rounded-lg bg-surface px-2 py-1 text-micro font-medium text-content-secondary shadow-card transition-colors hover:text-content-primary"
          >
            <PenLine size={11} />
            {capitalize(formatDueLabel(date))}
          </Link>
        ))}
        {missing.length > SHOW ? (
          <Link
            href="/journal"
            className="inline-flex items-center rounded-lg px-2 py-1 text-micro font-medium text-content-tertiary transition-colors hover:text-content-secondary"
          >
            +{missing.length - SHOW} no calendário
          </Link>
        ) : null}
      </div>
    </motion.section>
  );
}
