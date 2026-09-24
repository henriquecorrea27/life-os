'use client';

import { CheckCircle2, ListTodo, Search, Target } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useTaskActions } from '@/hooks/useTaskActions';
import { useTasks } from '@/hooks/useTasks';
import type { TaskDTO } from '@/lib/types';
import { CategoryManager } from '@/components/categories/CategoryManager';
import { PageShell } from '@/components/layout/PageShell';
import { QuickAdd } from '@/components/tasks/QuickAdd';
import { TaskFilters, TASK_VIEWS, type TaskViewKey } from '@/components/tasks/TaskFilters';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskGroups } from '@/components/tasks/TaskGroups';
import { TaskList } from '@/components/tasks/TaskList';
import { EmptyState } from '@/components/ui/EmptyState';
import { TaskListSkeleton } from '@/components/ui/Skeleton';

const VIEW_KEYS = TASK_VIEWS.map((view) => view.value);

function TasksView() {
  const router = useRouter();
  const params = useSearchParams();

  const paramView = params.get('view');
  const initialView = (VIEW_KEYS as string[]).includes(paramView ?? '')
    ? (paramView as TaskViewKey)
    : 'all';

  const [view, setView] = useState<TaskViewKey>(initialView);
  const [categoryId, setCategoryId] = useState<string | null>(params.get('categoria'));
  const [search, setSearch] = useState(params.get('busca') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [editing, setEditing] = useState<TaskDTO | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 220);
    return () => window.clearTimeout(timer);
  }, [search]);

  // A URL reflete os filtros para que a sidebar e a paleta possam apontar direto
  // para uma visão específica.
  useEffect(() => {
    const next = new URLSearchParams();
    if (view !== 'all') next.set('view', view);
    if (categoryId) next.set('categoria', categoryId);
    if (debouncedSearch.trim()) next.set('busca', debouncedSearch.trim());
    const query = next.toString();
    router.replace(query ? `/tasks?${query}` : '/tasks', { scroll: false });
  }, [view, categoryId, debouncedSearch, router]);

  const { data: categories } = useCategories();
  const { data: tasks, isLoading } = useTasks({
    view,
    categoryId,
    q: debouncedSearch.trim() || null,
  });

  const actions = useTaskActions();
  const list = useMemo(() => tasks ?? [], [tasks]);

  const openCount = list.filter((task) => !task.completed).length;

  const handleCategoryChange = useCallback((id: string | null) => setCategoryId(id), []);

  const emptyState = () => {
    if (debouncedSearch.trim()) {
      return (
        <EmptyState
          icon={Search}
          title="Nenhuma tarefa encontrada"
          description={`Nada bate com “${debouncedSearch.trim()}”. Tente outro termo ou limpe a busca.`}
        />
      );
    }
    if (view === 'completed') {
      return (
        <EmptyState
          icon={CheckCircle2}
          title="Nada concluído ainda"
          description="Assim que você fechar tarefas, elas aparecem aqui como histórico."
        />
      );
    }
    if (view === 'focus') {
      return (
        <EmptyState
          icon={Target}
          title="Nenhum foco definido"
          description="Marque as poucas tarefas que realmente importam hoje com o alvo no item."
        />
      );
    }
    return (
      <EmptyState
        icon={ListTodo}
        title="Lista vazia"
        description="Use o campo acima para adicionar sua primeira tarefa desta visão."
      />
    );
  };

  return (
    <PageShell
      title="Tarefas"
      subtitle={
        isLoading
          ? 'Carregando…'
          : view === 'completed'
            ? `${list.length} no histórico`
            : `${openCount} em aberto`
      }
      width="lg"
    >
      <div className="flex flex-col gap-5">
        <TaskFilters
          view={view}
          onViewChange={setView}
          categories={categories ?? []}
          categoryId={categoryId}
          onCategoryChange={handleCategoryChange}
          search={search}
          onSearchChange={setSearch}
          onManageCategories={() => setManagingCategories(true)}
        />

        {view !== 'completed' ? (
          <QuickAdd
            categories={categories ?? []}
            defaultCategoryId={categoryId}
            defaultFocus={view === 'focus'}
            defaultDueDate={view === 'today' ? new Date().toISOString().slice(0, 10) : null}
          />
        ) : null}

        {isLoading ? (
          <TaskListSkeleton rows={6} />
        ) : list.length === 0 ? (
          emptyState()
        ) : view === 'upcoming' ? (
          <TaskGroups
            tasks={list}
            mode="date"
            onToggle={actions.toggle}
            onEdit={setEditing}
            onDelete={actions.remove}
            onToggleFocus={actions.toggleFocus}
            onMiss={actions.miss}
            onToggleSubtask={actions.toggleSubtask}
          />
        ) : view === 'all' ? (
          <TaskGroups
            tasks={list}
            mode="due"
            onToggle={actions.toggle}
            onEdit={setEditing}
            onDelete={actions.remove}
            onToggleFocus={actions.toggleFocus}
            onMiss={actions.miss}
            onToggleSubtask={actions.toggleSubtask}
          />
        ) : (
          <TaskList
            tasks={list}
            onToggle={actions.toggle}
            onEdit={setEditing}
            onDelete={actions.remove}
            onToggleFocus={view === 'completed' ? undefined : actions.toggleFocus}
            onMiss={view === 'completed' ? undefined : actions.miss}
            onToggleSubtask={actions.toggleSubtask}
            onReorder={view === 'completed' ? undefined : actions.reorder}
          />
        )}
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

      <CategoryManager
        open={managingCategories}
        onClose={() => setManagingCategories(false)}
      />
    </PageShell>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-5xl px-5 pt-12 sm:px-8">
          <TaskListSkeleton rows={6} />
        </div>
      }
    >
      <TasksView />
    </Suspense>
  );
}
