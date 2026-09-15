'use client';

import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { BookOpen, PenLine, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useJournalEntries } from '@/hooks/useJournal';
import { toDateKey, todayKey } from '@/lib/dates';
import { PageShell } from '@/components/layout/PageShell';
import { JournalCalendar } from '@/components/journal/JournalCalendar';
import { JournalEntryCard } from '@/components/journal/JournalEntryCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

export default function JournalPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  // O calendário precisa do mês inteiro; a timeline mostra uma janela maior.
  const calendarRange = useMemo(
    () => ({ from: toDateKey(startOfMonth(month)), to: toDateKey(endOfMonth(month)) }),
    [month],
  );

  const { data: monthEntries } = useJournalEntries(calendarRange);
  const { data: timeline, isLoading } = useJournalEntries(
    debounced.trim()
      ? { q: debounced.trim(), limit: 60 }
      : { from: toDateKey(subMonths(new Date(), 6)), limit: 60 },
  );

  const today = todayKey();
  const hasToday = (monthEntries ?? []).some((entry) => entry.date === today);

  return (
    <PageShell
      title="Diário"
      subtitle="Um registro por dia — humor, o que aconteceu e o que ficou."
      action={
        <Link
          href={`/journal/${today}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-accent px-3 text-meta font-medium text-white shadow-card transition-colors hover:bg-accent-hover dark:text-[#111114]"
        >
          <PenLine size={14} />
          {hasToday ? 'Editar hoje' : 'Escrever hoje'}
        </Link>
      }
    >
      <div className="flex flex-col gap-5">
        <JournalCalendar month={month} onMonthChange={setMonth} entries={monthEntries ?? []} />

        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-surface px-3 py-2 transition-colors focus-within:border-accent/40">
          <Search size={14} className="shrink-0 text-content-tertiary" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar no diário…"
            aria-label="Buscar no diário"
            className="min-w-0 flex-1 bg-transparent text-meta text-content-primary outline-none placeholder:text-content-tertiary"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Limpar busca"
              className="shrink-0 rounded-md p-0.5 text-content-tertiary transition-colors hover:text-content-primary"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-meta font-medium text-content-secondary">
            {debounced.trim() ? 'Resultados' : 'Últimas entradas'}
          </h2>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : (timeline ?? []).length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={debounced.trim() ? 'Nada encontrado' : 'Seu diário começa hoje'}
              description={
                debounced.trim()
                  ? `Nenhuma entrada menciona “${debounced.trim()}”.`
                  : 'Registre como foi o dia de hoje — leva menos de um minuto e vira histórico.'
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {(timeline ?? []).map((entry) => (
                <JournalEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
