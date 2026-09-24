'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CornerDownLeft,
  Keyboard,
  Moon,
  Plus,
  Search,
  Sun,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useHotkey } from '@/hooks/useHotkeys';
import { useJournalEntries } from '@/hooks/useJournal';
import { useTasks } from '@/hooks/useTasks';
import { MOOD_META } from '@/lib/constants';
import { formatDueLabel, formatLong } from '@/lib/dates';
import { NAV_ITEMS } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { MoodIcon } from '@/components/journal/MoodIcon';
import { useTheme } from './ThemeProvider';

/** Evento interno: a paleta pede a criação de tarefa, o shell abre o formulário. */
export const NEW_TASK_EVENT = 'life-os:new-task';
/** A paleta pede a ajuda de atalhos; o shell abre o diálogo. */
export const SHORTCUTS_EVENT = 'life-os:shortcuts';

interface CommandPaletteContextValue {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: ReactNode;
  run: () => void;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useHotkey('mod+k', (event) => {
    event.preventDefault();
    setIsOpen((current) => !current);
  });

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  const trimmed = query.trim();

  // A paleta vive no shell, então estas consultas montavam em TODA página e
  // voltavam a buscar a cada invalidação — seis requisições por clique em
  // checkbox, para alimentar uma lista que ninguém estava vendo. Só busca aberta.
  const { data: tasks } = useTasks(
    trimmed ? { view: 'all', q: trimmed, includeCompleted: true } : { view: 'today' },
    { enabled: isOpen },
  );
  const { data: entries } = useJournalEntries(trimmed ? { q: trimmed, limit: 6 } : { limit: 3 }, {
    enabled: isOpen,
  });

  const items = useMemo<CommandItem[]>(() => {
    const navigation: CommandItem[] = NAV_ITEMS.filter((item) =>
      trimmed ? item.label.toLowerCase().includes(trimmed.toLowerCase()) : true,
    ).map((item) => ({
      id: `nav-${item.href}`,
      label: item.label,
      group: 'Navegar',
      icon: <item.icon size={15} />,
      run: () => router.push(item.href),
    }));

    const actions: CommandItem[] = [
      {
        id: 'action-new-task',
        label: 'Nova tarefa',
        hint: 'N',
        group: 'Ações',
        icon: <Plus size={15} />,
        run: () => window.dispatchEvent(new CustomEvent(NEW_TASK_EVENT)),
      },
      {
        id: 'action-shortcuts',
        label: 'Ver atalhos de teclado',
        hint: '?',
        group: 'Ações',
        icon: <Keyboard size={15} />,
        run: () => window.dispatchEvent(new CustomEvent(SHORTCUTS_EVENT)),
      },
      {
        id: 'action-theme',
        label: theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro',
        group: 'Ações',
        icon: theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />,
        run: toggle,
      },
    ].filter((item) => (trimmed ? item.label.toLowerCase().includes(trimmed.toLowerCase()) : true));

    const taskItems: CommandItem[] = (tasks ?? []).slice(0, 7).map((task) => ({
      id: `task-${task.id}`,
      label: task.completed ? `✓ ${task.title}` : task.title,
      hint: [task.category?.name, task.dueDate ? formatDueLabel(task.dueDate) : null]
        .filter(Boolean)
        .join(' · '),
      group: trimmed ? 'Tarefas' : 'Hoje',
      icon: (
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: task.category?.color ?? 'var(--text-tertiary)',
            opacity: task.completed ? 0.4 : 1,
          }}
        />
      ),
      run: () => router.push(`/tasks?busca=${encodeURIComponent(task.title)}`),
    }));

    const journalItems: CommandItem[] = (entries ?? []).slice(0, 5).map((entry) => ({
      id: `journal-${entry.id}`,
      label: formatLong(entry.date),
      hint: entry.summary?.slice(0, 48) ?? MOOD_META[entry.mood].label,
      group: 'Diário',
      icon: <MoodIcon mood={entry.mood} size={16} strokeWidth={1.8} />,
      run: () => router.push(`/journal/${entry.date}`),
    }));

    return [...actions, ...navigation, ...taskItems, ...journalItems];
  }, [trimmed, tasks, entries, router, theme, toggle]);

  useEffect(() => {
    setActiveIndex(0);
  }, [trimmed]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of items) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return [...map.entries()];
  }, [items]);

  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  function runItem(item: CommandItem) {
    close();
    // deixa o modal fechar antes de navegar/abrir outro overlay
    window.setTimeout(() => item.run(), 30);
  }

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence>
              {isOpen ? (
                <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    onClick={close}
                    className="absolute inset-0 bg-[#18181B]/25 backdrop-blur-[3px] dark:bg-black/60"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Busca rápida"
                    className="relative z-10 flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-pop"
                  >
                    <div className="flex items-center gap-3 border-b border-border/70 px-4">
                      <Search size={17} className="shrink-0 text-content-tertiary" />
                      <input
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') close();
                          if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            setActiveIndex((index) => (index + 1) % Math.max(items.length, 1));
                          }
                          if (event.key === 'ArrowUp') {
                            event.preventDefault();
                            setActiveIndex((index) =>
                              index === 0 ? Math.max(items.length - 1, 0) : index - 1,
                            );
                          }
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            const item = items[activeIndex];
                            if (item) runItem(item);
                          }
                        }}
                        placeholder="Buscar tarefas, dias do diário, ações…"
                        className="h-14 min-w-0 flex-1 bg-transparent text-body text-content-primary outline-none placeholder:text-content-tertiary"
                      />
                      <kbd className="hidden shrink-0 rounded-md bg-surface-secondary px-1.5 py-0.5 text-[10px] font-medium text-content-tertiary sm:block">
                        esc
                      </kbd>
                    </div>

                    <div className="scroll-area flex-1 overflow-y-auto p-2">
                      {items.length === 0 ? (
                        <p className="px-3 py-8 text-center text-meta text-content-tertiary">
                          Nada encontrado para “{trimmed}”.
                        </p>
                      ) : (
                        grouped.map(([group, groupItems]) => (
                          <div key={group} className="mb-1">
                            <p className="px-3 py-1.5 text-micro font-medium uppercase tracking-wide text-content-tertiary">
                              {group}
                            </p>
                            {groupItems.map((item) => {
                              const index = items.indexOf(item);
                              const active = index === activeIndex;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onMouseEnter={() => setActiveIndex(index)}
                                  onClick={() => runItem(item)}
                                  className={cn(
                                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                                    active ? 'bg-surface-secondary' : 'hover:bg-surface-secondary/60',
                                  )}
                                >
                                  <span className="grid h-6 w-6 shrink-0 place-items-center text-content-secondary">
                                    {item.icon}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-meta text-content-primary">
                                      {item.label}
                                    </span>
                                    {item.hint ? (
                                      <span className="block truncate text-micro text-content-tertiary">
                                        {item.hint}
                                      </span>
                                    ) : null}
                                  </span>
                                  {active ? (
                                    <CornerDownLeft size={13} className="shrink-0 text-content-tertiary" />
                                  ) : (
                                    <ArrowRight
                                      size={13}
                                      className="shrink-0 text-content-tertiary opacity-0"
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) throw new Error('useCommandPalette precisa estar dentro de CommandPaletteProvider');
  return context;
}
