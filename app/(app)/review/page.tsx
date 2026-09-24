'use client';

import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Heart,
  Repeat,
  Sprout,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { useReview } from '@/hooks/useReview';
import { MOOD_META } from '@/lib/constants';
import { capitalize, formatShort, shiftKey, todayKey } from '@/lib/dates';
import { cn, pluralize, readableTint, withAlpha } from '@/lib/utils';
import { PageShell } from '@/components/layout/PageShell';
import { MoodIcon } from '@/components/journal/MoodIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';

function percent(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}

function Card({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn('rounded-2xl border border-border/70 bg-surface p-5 shadow-card', className)}
    >
      <header className="mb-4">
        <h2 className="text-section font-medium text-content-primary">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-meta text-content-secondary">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Quotes({
  items,
  icon: Icon,
  tint,
  empty,
}: {
  items: { date: string; text: string }[];
  icon: typeof Heart;
  tint: string;
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-meta text-content-tertiary">{empty}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.date} className="flex gap-2.5">
          <Icon size={14} className="mt-0.5 shrink-0" style={{ color: tint }} />
          <div className="min-w-0">
            <p className="whitespace-pre-line text-meta leading-relaxed text-content-secondary">
              {item.text}
            </p>
            <p className="mt-0.5 text-micro text-content-tertiary">
              {capitalize(formatShort(item.date))}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ReviewPage() {
  const [week, setWeek] = useState<string>(todayKey());
  const { data, isLoading } = useReview(week);

  const canGoForward = data ? data.week.end < todayKey() : false;

  return (
    <PageShell
      title="Revisão da semana"
      subtitle={
        data
          ? `${capitalize(formatShort(data.week.start))} — ${formatShort(data.week.end)}`
          : 'Carregando…'
      }
      width="lg"
      action={
        <div className="flex items-center gap-1">
          <IconButton
            size="sm"
            aria-label="Semana anterior"
            onClick={() => setWeek((current) => shiftKey(current, -7))}
          >
            <ChevronLeft size={16} />
          </IconButton>
          <IconButton
            size="sm"
            aria-label="Próxima semana"
            disabled={!canGoForward}
            onClick={() => setWeek((current) => shiftKey(current, 7))}
          >
            <ChevronRight size={16} />
          </IconButton>
        </div>
      }
    >
      {isLoading || !data ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <WeekSummary data={data} />

          <div className="grid items-start gap-4 lg:grid-cols-2">
            <Card
              title="Por categoria"
              subtitle="O que andou e o que escapou, na semana"
            >
              {data.byCategory.length === 0 ? (
                <p className="text-meta text-content-tertiary">
                  Nenhuma tarefa concluída nem adiada nesta semana.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {data.byCategory.map((row) => {
                    const total = row.completed + row.missed;
                    return (
                      <li key={row.id}>
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
                            {row.completed} de {total}
                          </span>
                        </div>
                        <div className="flex h-2 gap-[2px] overflow-hidden rounded-full bg-surface-secondary">
                          <span
                            className="rounded-full"
                            style={{
                              width: `${(row.completed / total) * 100}%`,
                              backgroundColor: row.color,
                            }}
                          />
                          <span
                            className="rounded-full"
                            style={{
                              width: `${(row.missed / total) * 100}%`,
                              backgroundColor: withAlpha(row.color, 0.25),
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card title="Humor da semana" subtitle={`${data.mood.daysLogged} de 7 dias registrados`}>
              {data.mood.entries.length === 0 ? (
                <p className="text-meta text-content-tertiary">
                  Nenhuma entrada de diário nesta semana.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-end justify-between gap-1">
                    {data.mood.entries.map((entry) => (
                      <div key={entry.date} className="flex flex-col items-center gap-1.5">
                        <MoodIcon mood={entry.mood} size={26} />
                        <span className="text-micro text-content-tertiary">
                          {formatShort(entry.date).split(' ')[0]}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-border/60 pt-3 text-meta">
                    {data.mood.best ? (
                      <span className="text-content-secondary">
                        Melhor dia:{' '}
                        <span
                          className="font-medium"
                          style={{ color: readableTint(MOOD_META[data.mood.best.mood].color) }}
                        >
                          {capitalize(formatShort(data.mood.best.date))}
                        </span>
                      </span>
                    ) : null}
                    {data.mood.worst ? (
                      <span className="text-content-secondary">
                        Mais pesado:{' '}
                        <span
                          className="font-medium"
                          style={{ color: readableTint(MOOD_META[data.mood.worst.mood].color) }}
                        >
                          {capitalize(formatShort(data.mood.worst.date))}
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {data.stalled.length > 0 ? (
            <Card
              title="O que ficou para trás"
              subtitle="Tarefas que você adiou mais de uma vez — candidatas a quebrar em pedaços menores ou deixar ir"
            >
              <ul className="flex flex-col gap-2">
                {data.stalled.map((task) => (
                  <li key={task.id} className="flex items-center gap-2.5">
                    <Repeat size={13} className="shrink-0 text-content-tertiary" />
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: task.color ?? 'var(--text-tertiary)' }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-meta text-content-primary">
                      {task.title}
                    </span>
                    <span className="shrink-0 text-micro tabular-nums text-content-tertiary">
                      adiada {task.times}×
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <div className="grid items-start gap-4 lg:grid-cols-2">
            <Card title="Destaques" subtitle="O que você marcou como bom, na íntegra">
              <Quotes
                items={data.highlights}
                icon={Heart}
                tint="#F472B6"
                empty="Nenhum destaque escrito nesta semana."
              />
            </Card>
            <Card title="Poderia ser melhor" subtitle="Suas próprias observações da semana">
              <Quotes
                items={data.improvements}
                icon={Sprout}
                tint="#34D399"
                empty="Nada anotado nesta semana."
              />
            </Card>
          </div>

          {data.totals.completed === 0 &&
          data.totals.missed === 0 &&
          data.mood.daysLogged === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title="Semana sem registro"
              description="Nenhuma tarefa concluída e nenhuma entrada de diário neste período."
            />
          ) : null}
        </div>
      )}
    </PageShell>
  );
}

function WeekSummary({ data }: { data: NonNullable<ReturnType<typeof useReview>['data']> }) {
  const delta =
    data.totals.rate !== null && data.previousTotals.rate !== null
      ? data.totals.rate - data.previousTotals.rate
      : null;

  const planned = data.totals.completed + data.totals.missed;

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-border/70 bg-surface p-4 shadow-card sm:col-span-1">
        <p className="text-micro font-medium uppercase tracking-wide text-content-secondary">
          Taxa de conclusão
        </p>
        <p className="mt-2 text-[28px] font-semibold leading-none tabular-nums text-content-primary">
          {percent(data.totals.rate)}
        </p>
        <p className="mt-1.5 text-micro text-content-tertiary">
          {planned === 0
            ? 'nada previsto nesta semana'
            : `${data.totals.completed} de ${planned} ${pluralize(planned, 'prevista', 'previstas')}`}
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-surface p-4 shadow-card">
        <p className="text-micro font-medium uppercase tracking-wide text-content-secondary">
          Comparado à semana anterior
        </p>
        {delta === null ? (
          <p className="mt-2 text-meta text-content-tertiary">
            Sem dados suficientes para comparar.
          </p>
        ) : (
          <>
            <p
              className={cn(
                'mt-2 flex items-center gap-1.5 text-[28px] font-semibold leading-none tabular-nums',
                delta >= 0 ? 'text-[#34D399]' : 'text-[#F59E0B]',
              )}
            >
              {delta >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              {delta >= 0 ? '+' : ''}
              {Math.round(delta * 100)}
              <span className="text-body font-medium">pts</span>
            </p>
            <p className="mt-1.5 text-micro text-content-tertiary">
              antes: {percent(data.previousTotals.rate)}
            </p>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-border/70 bg-surface p-4 shadow-card">
        <p className="text-micro font-medium uppercase tracking-wide text-content-secondary">
          Humor médio
        </p>
        <p className="mt-2 text-[28px] font-semibold leading-none tabular-nums text-content-primary">
          {data.mood.average === null ? '—' : data.mood.average.toFixed(1)}
          <span className="text-body font-medium text-content-tertiary">/5</span>
        </p>
        <p className="mt-1.5 text-micro text-content-tertiary">
          {data.mood.daysLogged === 0
            ? 'nenhum dia registrado'
            : `em ${data.mood.daysLogged} ${pluralize(data.mood.daysLogged, 'dia', 'dias')}`}
        </p>
      </div>
    </section>
  );
}
