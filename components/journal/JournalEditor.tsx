'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  Sparkles,
  Sprout,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDeleteJournalEntry, useJournalDay, useSaveJournalEntry } from '@/hooks/useJournal';
import { JOURNAL_PROMPTS, MOOD_META, type Mood } from '@/lib/constants';
import { capitalize, formatLong, shiftKey, todayKey } from '@/lib/dates';
import { cn, withAlpha } from '@/lib/utils';
import { useToast } from '@/components/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { MoodPicker } from './MoodPicker';

interface Draft {
  mood: Mood | null;
  summary: string;
  gratitude: string;
  improve: string;
  freeText: string;
}

const EMPTY_DRAFT: Draft = {
  mood: null,
  summary: '',
  gratitude: '',
  improve: '',
  freeText: '',
};

export function JournalEditor({ date }: { date: string }) {
  const router = useRouter();
  const { data, isLoading } = useJournalDay(date);
  const saveEntry = useSaveJournalEntry();
  const deleteEntry = useDeleteJournalEntry();
  const { toast } = useToast();

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const loadedFor = useRef<string | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    if (!data || loadedFor.current === date) return;
    loadedFor.current = date;
    setDraft({
      mood: data.entry?.mood ?? null,
      summary: data.entry?.summary ?? '',
      gratitude: data.entry?.gratitude ?? '',
      improve: data.entry?.improve ?? '',
      freeText: data.entry?.freeText ?? '',
    });
    setDirty(false);
  }, [data, date]);

  // Autosave: o diário é escrito de uma vez só no fim do dia, e perder texto por
  // esquecer de salvar seria o pior defeito possível aqui.
  useEffect(() => {
    if (!dirty || !draft.mood || saveEntry.isPending) return;

    const snapshot = JSON.stringify(draft);
    const timer = window.setTimeout(() => {
      saveEntry.mutate(
        {
          date,
          mood: draft.mood as Mood,
          summary: draft.summary.trim() || null,
          gratitude: draft.gratitude.trim() || null,
          improve: draft.improve.trim() || null,
          freeText: draft.freeText.trim() || null,
        },
        {
          onSuccess: () => {
            // Só limpa o "sujo" se nada foi digitado enquanto a requisição corria.
            if (JSON.stringify(draftRef.current) === snapshot) setDirty(false);
            setSavedAt(Date.now());
          },
          onError: (error) =>
            toast({
              message: 'Não consegui salvar a entrada',
              description: error instanceof Error ? error.message : undefined,
              tone: 'error',
            }),
        },
      );
    }, 900);

    return () => window.clearTimeout(timer);
  }, [dirty, draft, date, saveEntry, toast]);

  const today = todayKey();
  const isToday = date === today;
  const canGoForward = date < today;

  const prompts = useMemo(() => JOURNAL_PROMPTS.slice(0, 4), []);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const accent = draft.mood ? MOOD_META[draft.mood].color : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <IconButton
          aria-label="Dia anterior"
          onClick={() => router.push(`/journal/${shiftKey(date, -1)}`)}
        >
          <ChevronLeft size={16} />
        </IconButton>

        <AnimatePresence mode="wait">
          <motion.span
            key={`${saveEntry.isPending}-${dirty}-${savedAt}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-micro text-content-tertiary"
          >
            {saveEntry.isPending ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                salvando…
              </>
            ) : dirty ? (
              'alterações não salvas'
            ) : savedAt || data?.entry ? (
              <>
                <Check size={12} />
                salvo automaticamente
              </>
            ) : null}
          </motion.span>
        </AnimatePresence>

        <IconButton
          aria-label="Próximo dia"
          disabled={!canGoForward}
          onClick={() => router.push(`/journal/${shiftKey(date, 1)}`)}
        >
          <ChevronRight size={16} />
        </IconButton>
      </div>

      <section
        className="rounded-2xl border border-border/70 bg-surface p-4 shadow-card"
        style={accent ? { borderColor: withAlpha(accent, 0.3) } : undefined}
      >
        <h2 className="mb-3 px-1 text-meta font-medium text-content-secondary">
          {isToday ? 'Como foi seu dia?' : 'Como foi esse dia?'}
        </h2>
        <MoodPicker value={draft.mood} onChange={(mood) => update('mood', mood)} size="lg" />
      </section>

      <AnimatePresence initial={false}>
        {draft.mood ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-card">
              <label
                htmlFor="journal-summary"
                className="text-meta font-medium text-content-secondary"
              >
                O que aconteceu
              </label>
              <textarea
                id="journal-summary"
                value={draft.summary}
                onChange={(event) => update('summary', event.target.value)}
                rows={3}
                placeholder="Um resumo do dia, do jeito que vier."
                className="scroll-area mt-2 w-full resize-none bg-transparent text-body leading-relaxed text-content-primary outline-none placeholder:text-content-tertiary"
              />
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-card">
                <label
                  htmlFor="journal-gratitude"
                  className="flex items-center gap-1.5 text-meta font-medium text-content-secondary"
                >
                  <Heart size={13} className="text-[#F472B6]" />
                  Destaque positivo
                </label>
                <textarea
                  id="journal-gratitude"
                  value={draft.gratitude}
                  onChange={(event) => update('gratitude', event.target.value)}
                  rows={3}
                  placeholder="Algo bom que aconteceu."
                  className="scroll-area mt-2 w-full resize-none bg-transparent text-meta leading-relaxed text-content-primary outline-none placeholder:text-content-tertiary"
                />
              </section>

              <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-card">
                <label
                  htmlFor="journal-improve"
                  className="flex items-center gap-1.5 text-meta font-medium text-content-secondary"
                >
                  <Sprout size={13} className="text-[#34D399]" />
                  O que poderia ser melhor
                </label>
                <textarea
                  id="journal-improve"
                  value={draft.improve}
                  onChange={(event) => update('improve', event.target.value)}
                  rows={3}
                  placeholder="Sem culpa — só observação."
                  className="scroll-area mt-2 w-full resize-none bg-transparent text-meta leading-relaxed text-content-primary outline-none placeholder:text-content-tertiary"
                />
              </section>
            </div>

            <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-card">
              <label
                htmlFor="journal-free"
                className="text-meta font-medium text-content-secondary"
              >
                Diário livre
              </label>
              <textarea
                id="journal-free"
                value={draft.freeText}
                onChange={(event) => update('freeText', event.target.value)}
                rows={8}
                placeholder="Espaço aberto. Escreva o quanto quiser."
                className="scroll-area mt-2 w-full resize-none bg-transparent text-body leading-relaxed text-content-primary outline-none placeholder:text-content-tertiary"
              />

              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
                <span className="inline-flex items-center gap-1 pr-1 text-micro text-content-tertiary">
                  <Sparkles size={11} />
                  Sugestões:
                </span>
                {prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() =>
                      update(
                        'freeText',
                        draft.freeText.trim()
                          ? `${draft.freeText.trim()}\n\n${prompt}\n`
                          : `${prompt}\n`,
                      )
                    }
                    className="rounded-lg bg-surface-secondary px-2 py-1 text-micro text-content-secondary transition-colors hover:text-content-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </section>
          </motion.div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="Comece pelo humor"
            description="Escolha como foi o dia acima — os campos de escrita aparecem em seguida."
            compact
          />
        )}
      </AnimatePresence>

      {data && data.completedTasks.length > 0 ? (
        <section className="rounded-2xl border border-border/70 bg-surface-secondary/50 p-5">
          <h3 className="text-meta font-medium text-content-secondary">
            Concluído nesse dia
            <span className="ml-1.5 text-content-tertiary">({data.completedTasks.length})</span>
          </h3>
          <ul className="mt-3 flex flex-col gap-1.5">
            {data.completedTasks.map((task) => (
              <li key={task.id} className="flex items-center gap-2.5 text-meta text-content-secondary">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: task.categoryColor ?? 'var(--text-tertiary)' }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{task.title}</span>
                {task.categoryName ? (
                  <span className="shrink-0 text-micro text-content-tertiary">
                    {task.categoryName}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data?.entry ? (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            loading={deleteEntry.isPending}
            onClick={() => {
              deleteEntry.mutate(date, {
                onSuccess: () => {
                  loadedFor.current = null;
                  setDraft(EMPTY_DRAFT);
                  setDirty(false);
                  setSavedAt(null);
                  toast({ message: 'Entrada apagada' });
                },
              });
            }}
            className="text-content-tertiary hover:text-[#EF4444]"
          >
            <Trash2 size={14} />
            Apagar entrada do dia
          </Button>
        </div>
      ) : null}

      <p className="pb-2 text-center text-micro text-content-tertiary">
        {capitalize(formatLong(date))}
      </p>
    </div>
  );
}
