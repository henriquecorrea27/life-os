'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CalendarCheck2, ChevronDown, Sparkles, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useStats } from '@/hooks/useStats';
import { useTaskActions } from '@/hooks/useTaskActions';
import { useTasks } from '@/hooks/useTasks';
import { capitalize, formatLong, greeting, todayKey } from '@/lib/dates';
import type { TaskDTO } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DailyCheckIn } from '@/components/home/DailyCheckIn';
import { DayProgress } from '@/components/home/DayProgress';
import { PageShell } from '@/components/layout/PageShell';
import { QuickAdd } from '@/components/tasks/QuickAdd';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskList } from '@/components/tasks/TaskList';
import { EmptyState } from '@/components/ui/EmptyState';
import { TaskListSkeleton } from '@/components/ui/Skeleton';

export default function HomePage() {
  const today = todayKey();
  const { data: tasks, isLoading } = useTasks({ view: 'today' });
  const { data: categories } = useCategories();
  const { data: stats } = useStats();
  const actions = useTaskActions();

  const [editing, setEditing] = useState<TaskDTO | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const { focus, open, completed } = useMemo(() => {
    const list = tasks ?? [];
    return {
      focus: list.filter((task) => !task.completed && task.isFocus),
      open: list.filter((task) => !task.completed && !task.isFocus),
      completed: list.filter((task) => task.completed),
    };
  }, [tasks]);

  const total = (tasks ?? []).length;

  return (
    <PageShell
      title={`${greeting()}, Henrique`}
      subtitle={capitalize(formatLong(today))}
    >
      <div className="flex flex-col gap-4">
        <DayProgress
          completed={completed.length}
          total={total}
          streak={stats?.taskStreak.current}
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
                <h2 className="mb-2 flex items-center gap-1.5 px-1 text-meta font-medium text-content-secondary">
                  <Target size={13} className="text-accent" />
                  Foco do dia
                </h2>
                <TaskList
                  tasks={focus}
                  onToggle={actions.toggle}
                  onEdit={setEditing}
                  onDelete={actions.remove}
                  onToggleFocus={actions.toggleFocus}
                />
              </section>
            ) : null}

            {open.length > 0 ? (
              <section>
                {focus.length > 0 ? (
                  <h2 className="mb-2 px-1 text-meta font-medium text-content-secondary">
                    Também hoje
                  </h2>
                ) : null}
                <TaskList
                  tasks={open}
                  onToggle={actions.toggle}
                  onEdit={setEditing}
                  onDelete={actions.remove}
                  onToggleFocus={actions.toggleFocus}
                  onReorder={actions.reorder}
                />
              </section>
            ) : null}

            {open.length === 0 && focus.length === 0 && completed.length > 0 ? (
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
                    className={cn('transition-transform duration-200', showCompleted && 'rotate-180')}
                  />
                  {completed.length} concluída{completed.length > 1 ? 's' : ''} hoje
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
          </div>
        )}

        <div className="pt-2">
          <DailyCheckIn />
        </div>
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
