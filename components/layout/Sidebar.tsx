'use client';

import { motion } from 'framer-motion';
import { Keyboard, PanelLeftClose, PanelLeftOpen, Plus, Search, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { isActivePath, NAV_ITEMS } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { CategoryManager } from '@/components/categories/CategoryManager';
import { SHORTCUTS_EVENT, useCommandPalette } from '@/components/providers/CommandPaletteProvider';
import { IconButton } from '@/components/ui/IconButton';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const STORAGE_KEY = 'life-os-sidebar';

export function Sidebar({ onNewTask }: { onNewTask: () => void }) {
  const pathname = usePathname();
  const { data: categories } = useCategories();
  const { open: openPalette } = useCommandPalette();
  const [collapsed, setCollapsed] = useState(false);
  const [managingCategories, setManagingCategories] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === 'true');
    } catch {
      // storage bloqueado: a sidebar só começa sempre expandida
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // idem
      }
      return next;
    });
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 76 : 244 }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      className="sticky top-0 z-30 hidden h-dvh shrink-0 flex-col border-r border-border/70 bg-surface/60 backdrop-blur-xl md:flex"
    >
      <div
        className={cn(
          'flex items-center gap-2 px-4 pb-2 pt-5',
          collapsed && 'justify-center px-2',
        )}
      >
        {!collapsed ? (
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Logo size={32} />
            <span className="min-w-0">
              <span className="block truncate text-meta font-semibold text-content-primary">
                Life OS
              </span>
              <span className="block truncate text-micro text-content-tertiary">
                tarefas + diário
              </span>
            </span>
          </div>
        ) : (
          <Logo size={32} />
        )}
      </div>

      <div className={cn('flex flex-col gap-1.5 px-3 pb-3 pt-2', collapsed && 'px-2')}>
        <button
          type="button"
          onClick={onNewTask}
          className={cn(
            'flex h-10 items-center gap-2 rounded-xl bg-accent px-3 text-meta font-medium text-white shadow-card transition-all duration-200 hover:bg-accent-hover active:scale-[0.98] dark:text-[#111114]',
            collapsed && 'justify-center px-0',
          )}
        >
          <Plus size={16} />
          {!collapsed ? 'Nova tarefa' : null}
        </button>

        <button
          type="button"
          onClick={openPalette}
          className={cn(
            'flex h-9 items-center gap-2 rounded-xl border border-border/80 px-3 text-meta text-content-tertiary transition-colors hover:bg-surface-secondary hover:text-content-secondary',
            collapsed && 'justify-center px-0',
          )}
        >
          <Search size={15} />
          {!collapsed ? (
            <>
              <span className="flex-1 text-left">Buscar</span>
              <kbd className="rounded-md bg-surface-secondary px-1.5 py-0.5 text-[10px] font-medium text-content-tertiary">
                ⌘K
              </kbd>
            </>
          ) : null}
        </button>
      </div>

      <nav className="scroll-area flex-1 overflow-y-auto px-3 pb-4">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href, item.exact);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'relative flex h-10 items-center gap-3 rounded-xl px-3 text-meta font-medium transition-colors duration-200',
                    collapsed && 'justify-center px-0',
                    active
                      ? 'text-content-primary'
                      : 'text-content-secondary hover:bg-surface-secondary hover:text-content-primary',
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="nav-active"
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                      className="absolute inset-0 rounded-xl bg-surface-secondary"
                    />
                  ) : null}
                  <item.icon
                    size={17}
                    className={cn('relative shrink-0', active && 'text-accent')}
                    strokeWidth={active ? 2.2 : 1.9}
                  />
                  {!collapsed ? <span className="relative truncate">{item.label}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>

        {!collapsed && categories && categories.length > 0 ? (
          <div className="mt-6">
            <div className="group/cats flex items-center justify-between gap-2 px-3 pb-2">
              <p className="text-micro font-medium uppercase tracking-wide text-content-tertiary">
                Categorias
              </p>
              <IconButton
                size="sm"
                aria-label="Gerenciar categorias"
                onClick={() => setManagingCategories(true)}
                className="h-6 w-6 opacity-0 transition-opacity group-hover/cats:opacity-100 focus-visible:opacity-100"
              >
                <SlidersHorizontal size={12} />
              </IconButton>
            </div>
            <ul className="flex flex-col gap-0.5">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/tasks?categoria=${category.id}`}
                    className="group flex h-9 items-center gap-2.5 rounded-xl px-3 text-meta text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full transition-transform group-hover:scale-125"
                      style={{ backgroundColor: category.color }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate">{category.name}</span>
                    {category.openCount ? (
                      <span className="shrink-0 text-micro tabular-nums text-content-tertiary">
                        {category.openCount}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </nav>

      <div
        className={cn(
          'flex items-center gap-1 border-t border-border/70 px-3 py-3',
          collapsed && 'flex-col px-2',
        )}
      >
        <ThemeToggle size="sm" />
        <IconButton
          size="sm"
          aria-label="Ver atalhos de teclado"
          title="Atalhos (?)"
          onClick={() => window.dispatchEvent(new CustomEvent(SHORTCUTS_EVENT))}
        >
          <Keyboard size={15} />
        </IconButton>
        <IconButton
          size="sm"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          onClick={toggleCollapsed}
          className={collapsed ? '' : 'ml-auto'}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </IconButton>
      </div>

      <CategoryManager
        open={managingCategories}
        onClose={() => setManagingCategories(false)}
      />
    </motion.aside>
  );
}
