'use client';

import { BookOpen, CheckCircle2, Flame, Percent, TrendingUp } from 'lucide-react';
import { useStats } from '@/hooks/useStats';
import { MOOD_META } from '@/lib/constants';
import { pluralize, readableTint } from '@/lib/utils';
import { PageShell } from '@/components/layout/PageShell';
import { CategoryBreakdown } from '@/components/stats/CategoryBreakdown';
import { CompletionChart } from '@/components/stats/CompletionChart';
import { MoodHeatmap } from '@/components/stats/MoodHeatmap';
import { MoodTrend } from '@/components/stats/MoodTrend';
import { StatTile } from '@/components/stats/StatTile';
import { Skeleton } from '@/components/ui/Skeleton';

export default function StatsPage() {
  const { data: stats, isLoading } = useStats();

  if (isLoading || !stats) {
    return (
      <PageShell title="Estatísticas" subtitle="Como as últimas semanas andaram." width="lg">
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
      </PageShell>
    );
  }

  const topMood = [...stats.moodDistribution].sort((a, b) => b.count - a.count)[0];

  return (
    <PageShell
      title="Estatísticas"
      subtitle="Como as últimas semanas andaram."
      width="lg"
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon={Flame}
            label="Sequência"
            value={stats.taskStreak.current}
            hint={`${pluralize(stats.taskStreak.current, 'dia seguido', 'dias seguidos')} · recorde ${stats.taskStreak.best}`}
            accent="#FB923C"
          />
          <StatTile
            icon={CheckCircle2}
            label="Concluídas"
            value={stats.totals.completedThisWeek}
            hint={`nos últimos 7 dias · ${stats.totals.completed} no total`}
            accent="#34D399"
          />
          <StatTile
            icon={Percent}
            label="Conclusão"
            value={
              stats.completionRate.last30 === null
                ? '—'
                : `${Math.round(stats.completionRate.last30 * 100)}%`
            }
            hint={
              stats.completionRate.daysCounted === 0
                ? 'marque o que não deu para fazer'
                : `do previsto · ${stats.completionRate.daysCounted} ${pluralize(stats.completionRate.daysCounted, 'dia contado', 'dias contados')}`
            }
            accent="#60A5FA"
          />
          <StatTile
            icon={BookOpen}
            label="Diário"
            value={stats.journalStreak.current}
            hint={`${stats.journalCount} ${pluralize(stats.journalCount, 'entrada', 'entradas')} · recorde ${stats.journalStreak.best}`}
            accent="#A78BFA"
          />
        </div>

        <CompletionChart data={stats.completionByDay} days={30} />

        {/* Os dois cartões de humor lado a lado: leem-se juntos (a grade mostra a
            constância, a curva mostra a direção) e nenhum dos dois precisa da
            largura total da página. */}
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <MoodHeatmap entries={stats.moodByDay} />
          <MoodTrend data={stats.moodByDay} />
        </div>

        <CategoryBreakdown rows={stats.byCategory} />

        {topMood && topMood.count > 0 ? (
          <p className="flex items-center justify-center gap-2 pb-2 text-meta text-content-tertiary">
            <TrendingUp size={14} />
            Seu humor mais frequente é{' '}
            <span className="font-medium" style={{ color: readableTint(MOOD_META[topMood.mood].color) }}>
              {MOOD_META[topMood.mood].label.toLowerCase()}
            </span>
            , em {topMood.count} {pluralize(topMood.count, 'dia', 'dias')}.
          </p>
        ) : null}
      </div>
    </PageShell>
  );
}
