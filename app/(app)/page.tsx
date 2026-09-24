'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CalendarCheck2, ChevronDown, Sparkles, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useStats } from '@/hooks/useStats';
import { useTaskActions } from '@/hooks/useTaskActions';
import { useTasks } from '@/hooks/useTasks';
import { capitalize, dueState, formatLong, greeting, todayKey } from '@/lib/dates';
import type { TaskDTO } from '@/lib/types';
import { cn, pluralize } from '@/lib/utils';
import { CloseDayButton } from '@/components/home/CloseDayButton';
import { DailyCheckIn } from '@/components/home/DailyCheckIn';
import { JournalGaps } from '@/components/home/JournalGaps';
import { DayProgress } from '@/components/home/DayProgress';
import { PageShell } from '@/components/layout/PageShell';
import { QuickAdd } from '@/components/tasks/QuickAdd';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskList } from '@/components/tasks/TaskList';
import { EmptyState } from '@/components/ui/EmptyState';
import { TaskListSkeleton } from '@/components/ui/Skeleton';

function SectionTitle({
  children,
  icon: Icon,
  tone,
  count,
}: {
  children: React.ReactNode;
  icon?: typeof Target;
  tone?: 'accent' | 'danger';
  count?: number;
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
      <h2
        className={cn(
          'flex items-center gap-1.5 text-meta font-medium',
          tone === 'danger' ? 'text-[#EF4444]' : 'text-content-secondary',
        )}
      >
        {Icon ? (
          <Icon
            size={13}
            className={tone === 'danger' ? '' : 'text-accent'}
            aria-hidden
          />
        ) : null}
        {children}
      </h2>
      {count ? (
        <span className="text-micro tabular-nums text-content-tertiary">{count}</span>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const today = todayKey();
  const { data: tasks, isLoading } = useTasks({ view: 'today' });
  const { data: categories } = useCategories();
  const { data: stats } = useStats();
  const actions = useTaskActions();

  const [editing, setEditing] = useState<TaskDTO | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // A view "hoje" traz o que venceu antes e segue aberto. Separar as atrasadas
  // do resto evita que a única pista de atraso seja a cor da data.
  const { focus, overdue, open, completed } = useMemo(() => {
    const list = tasks ?? [];
    const pending = list.filter((task) => !task.completed);
    const focusTasks = pending.filter((task) => task.isFocus);
    const rest = pending.filter((task) => !task.isFocus);

    return {
      focus: focusTasks,
      overdue: rest.filter((task) => dueState(task.dueDate) === 'overdue'),
      open: rest.filter((task) => dueState(task.dueDate) !== 'overdue'),
      completed: list.filter((task) => task.completed),
    };
  }, [tasks]);

  const total = (tasks ?? []).length;
  const nothingLeft = focus.length === 0 && overdue.length === 0 && open.length === 0;

  return (
    <PageShell
      title={`${greeting()}, Henrique`}
      subtitle={capitalize(formatLong(today))}
      width="xl"
    >
      <div className="mx-auto grid w-full max-w-3xl grid-cols-1 items-start gap-4 xl:max-w-none xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          <DayProgress
            completed={completed.length}
            total={total}
            streak={stats?.taskStreak.current}
            overdue={overdue.length}
          />

          <QuickAdd categories={categories ?? []} defaultDueDate={today} />

          {isLoading ? (
            <TaskListSkeleton />
          ) : total === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="O dia está limpo"
              description="Nenhuma tarefa marcada para hoje. Adicione a primeira acima ou aproveite a folga."
            />
          ) : (
            <div className="flex flex-col gap-6">
              {focus.length > 0 ? (
                <section>
                  <SectionTitle icon={Target}>Foco do dia</SectionTitle>
                  <TaskList
                    tasks={focus}
                    onToggle={actions.toggle}
                    onEdit={setEditing}
                    onDelete={actions.remove}
                    onToggleFocus={actions.toggleFocus}
                    onMiss={actions.miss}
                    onToggleSubtask={actions.toggleSubtask}
                    onReorder={actions.reorder}
                  />
                </section>
              ) : null}

              {overdue.length > 0 ? (
                <section>
                  <SectionTitle icon={AlertCircle} tone="danger" count={overdue.length}>
                    Atrasadas
                  </SectionTitle>
                  <TaskList
                    tasks={overdue}
                    onToggle={actions.toggle}
                    onEdit={setEditing}
                    onDelete={actions.remove}
                    onToggleFocus={actions.toggleFocus}
                    onMiss={actions.miss}
                    onToggleSubtask={actions.toggleSubtask}
                  />
                </section>
              ) : null}

              {open.length > 0 ? (
                <section>
                  {focus.length > 0 || overdue.length > 0 ? (
                    <SectionTitle>Também hoje</SectionTitle>
                  ) : null}
                  <TaskList
                    tasks={open}
                    onToggle={actions.toggle}
                    onEdit={setEditing}
                    onDelete={actions.remove}
                    onToggleFocus={actions.toggleFocus}
                    onMiss={actions.miss}
                    onToggleSubtask={actions.toggleSubtask}
                    onReorder={actions.reorder}
                  />
                </section>
              ) : null}

              {nothingLeft && completed.length > 0 ? (
                <EmptyState
                  icon={CalendarCheck2}
                  title="Tudo feito por hoje"
                  description="Você fechou todas as tarefas do dia. Que tal registrar como foi no diário?"
                  compact
                />
              ) : null}

              {completed.length > 0 ? (
                <section>
                  <button
                    type="button"
                    onClick={() => setShowCompleted((current) => !current)}
                    className="mb-1 flex items-center gap-1.5 rounded-lg px-1 py-1 text-meta font-medium text-content-tertiary transition-colors hover:text-content-secondary"
                  >
                    <ChevronDown
                      size={14}
                      className={cn(
                        'transition-transform duration-200',
                        showCompleted && 'rotate-180',
                      )}
                    />
                    {completed.length}{' '}
                    {pluralize(completed.length, 'concluída', 'concluídas')} hoje
                  </button>

                  <AnimatePresence initial={false}>
                    {showCompleted ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <TaskList
                          tasks={completed}
                          onToggle={actions.toggle}
                          onEdit={setEditing}
                          onDelete={actions.remove}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </section>
              ) : null}

              {!nothingLeft ? (
                <CloseDayButton pending={focus.length + overdue.length + open.length} />
              ) : null}
            </div>
          )}
        </div>

        {/* No desktop o check-in fica à direita, sempre visível enquanto a lista
            rola; no celular ele cai naturalmente para o fim da página. */}
        <aside className="flex min-w-0 flex-col gap-3 pt-2 xl:sticky xl:top-8 xl:pt-0">
          <DailyCheckIn />
          <JournalGaps />
        </aside>
      </div>

      <TaskForm
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        task={editing}
        categories={categories ?? []}
        saving={actions.saving}
        onSubmit={async (values) => {
          const saved = await actions.save(values, editing);
          if (saved) setEditing(null);
        }}
        onDelete={(task) => {
          setEditing(null);
          actions.remove(task);
        }}
      />
    </PageShell>
  );
}
