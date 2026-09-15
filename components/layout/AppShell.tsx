'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useHotkey } from '@/hooks/useHotkeys';
import { useTaskActions } from '@/hooks/useTaskActions';
import { NEW_TASK_EVENT } from '@/components/providers/CommandPaletteProvider';
import { TaskForm } from '@/components/tasks/TaskForm';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  const [creating, setCreating] = useState(false);
  const { data: categories } = useCategories();
  const actions = useTaskActions();

  const openCreate = useCallback(() => setCreating(true), []);

  useEffect(() => {
    window.addEventListener(NEW_TASK_EVENT, openCreate);
    return () => window.removeEventListener(NEW_TASK_EVENT, openCreate);
  }, [openCreate]);

  useHotkey('shift+n', (event) => {
    event.preventDefault();
    openCreate();
  });

  return (
    <div className="app-canvas relative flex min-h-dvh">
      <Sidebar onNewTask={openCreate} />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col pb-24 md:pb-0">{children}</div>

      <BottomNav onNewTask={openCreate} />

      <TaskForm
        open={creating}
        onClose={() => setCreating(false)}
        task={null}
        categories={categories ?? []}
        saving={actions.saving}
        onSubmit={async (values) => {
          const saved = await actions.save(values, null);
          if (saved) setCreating(false);
        }}
      />
    </div>
  );
}
