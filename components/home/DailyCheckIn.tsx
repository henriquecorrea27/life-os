'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useJournalDay, useSaveJournalEntry } from '@/hooks/useJournal';
import { MOOD_META, type Mood } from '@/lib/constants';
import { todayKey } from '@/lib/dates';
import { cn, readableTint, withAlpha } from '@/lib/utils';
import { MoodPicker } from '@/components/journal/MoodPicker';
import { Skeleton } from '@/components/ui/Skeleton';

export function DailyCheckIn() {
  const date = todayKey();
  const { data, isLoading } = useJournalDay(date);
  const saveEntry = useSaveJournalEntry();

  const [mood, setMood] = useState<Mood | null>(null);
  const [summary, setSummary] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!data || hydrated.current) return;
    hydrated.current = true;
    setMood(data.entry?.mood ?? null);
    setSummary(data.entry?.summary ?? '');
  }, [data]);

  function persist(nextMood: Mood, nextSummary: string) {
    saveEntry.mutate(
      {
        date,
        mood: nextMood,
        summary: nextSummary.trim() ? nextSummary.trim() : null,
        gratitude: data?.entry?.gratitude ?? null,
        improve: data?.entry?.improve ?? null,
        freeText: data?.entry?.freeText ?? null,
      },
      {
        onSuccess: () => {
          setJustSaved(true);
          window.setTimeout(() => setJustSaved(false), 1800);
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-card">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-16 w-full" />
      </div>
    );
  }

  const accent = mood ? MOOD_META[mood].color : null;

  return (
    <motion.section
      layout
      className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-card"
      style={accent ? { borderColor: withAlpha(accent, 0.28) } : undefined}
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="text-section font-medium text-content-primary">
            {mood ? 'Seu dia até aqui' : 'Como foi seu dia?'}
          </h2>
          <p className="mt-0.5 text-meta text-content-secondary">
            {mood
              ? 'Pode voltar e ajustar quantas vezes quiser.'
              : 'Um toque para registrar o humor de hoje.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {saveEntry.isPending ? (
            <motion.span
              key="saving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-micro text-content-tertiary"
            >
              <Loader2 size={12} className="animate-spin" />
              salvando
            </motion.span>
          ) : justSaved ? (
            <motion.span
              key="saved"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-micro text-content-tertiary"
            >
              <Check size={12} />
              salvo
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="px-4 py-4">
        <MoodPicker
          value={mood}
          onChange={(next) => {
            setMood(next);
            persist(next, summary);
          }}
        />
      </div>

      <AnimatePresence initial={false}>
        {mood ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/60 px-5 py-4">
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                onBlur={() => {
                  if (mood && summary !== (data?.entry?.summary ?? '')) persist(mood, summary);
                }}
                rows={2}
                placeholder="O que aconteceu hoje? (opcional)"
                aria-label="Resumo do dia"
                className="scroll-area w-full resize-none bg-transparent text-body leading-relaxed text-content-primary outline-none placeholder:text-content-tertiary"
              />

              <div className="mt-3 flex items-center justify-between gap-3">
                <span
                  className={cn('text-micro font-medium')}
                  style={{ color: accent ? readableTint(accent) : 'var(--text-tertiary)' }}
                >
                  {MOOD_META[mood].label}
                </span>
                <Link
                  href={`/journal/${date}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-micro font-medium text-accent transition-colors hover:bg-accent-soft"
                >
                  Abrir diário completo
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}
