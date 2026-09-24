'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useHotkey } from '@/hooks/useHotkeys';
import { useTaskActions } from '@/hooks/useTaskActions';
import { NEW_TASK_EVENT, SHORTCUTS_EVENT } from '@/components/providers/CommandPaletteProvider';
import { TaskForm } from '@/components/tasks/TaskForm';
import { ShortcutsHelp } from './ShortcutsHelp';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  const [creating, setCreating] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { data: categories } = useCategories();
  const actions = useTaskActions();

  const openCreate = useCallback(() => setCreating(true), []);
  const openShortcuts = useCallback(() => setShowShortcuts(true), []);

  useEffect(() => {
    window.addEventListener(NEW_TASK_EVENT, openCreate);
    window.addEventListener(SHORTCUTS_EVENT, openShortcuts);
    return () => {
      window.removeEventListener(NEW_TASK_EVENT, openCreate);
      window.removeEventListener(SHORTCUTS_EVENT, openShortcuts);
    };
  }, [openCreate, openShortcuts]);

  useHotkey('shift+n', (event) => {
    event.preventDefault();
    openCreate();
  });

  // "?" exige Shift na maioria dos teclados (inclusive ABNT2, onde divide a tecla
  // com "/"). Quem estiver num layout diferente ainda chega pela paleta (⌘K).
  useHotkey('shift+?', (event) => {
    event.preventDefault();
    setShowShortcuts((current) => !current);
  });

  return (
    <div className="app-canvas relative flex min-h-dvh">
      <Sidebar onNewTask={openCreate} />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col pb-24 md:pb-0">{children}</div>

      <BottomNav onNewTask={openCreate} />

      <ShortcutsHelp open={showShortcuts} onClose={() => setShowShortcuts(false)} />

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
