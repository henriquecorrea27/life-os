'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { CategoryDTO } from '@/lib/types';
import { cn, readableTint, withAlpha } from '@/lib/utils';
import { Segmented, type SegmentedOption } from '@/components/ui/Segmented';

export type TaskViewKey = 'today' | 'upcoming' | 'all' | 'focus' | 'completed';

export const TASK_VIEWS: SegmentedOption<TaskViewKey>[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'upcoming', label: 'Próximos 7 dias' },
  { value: 'all', label: 'Todas' },
  { value: 'focus', label: 'Foco' },
  { value: 'completed', label: 'Concluídas' },
];

export function TaskFilters({
  view,
  onViewChange,
  categories,
  categoryId,
  onCategoryChange,
  search,
  onSearchChange,
  onManageCategories,
}: {
  view: TaskViewKey;
  onViewChange: (view: TaskViewKey) => void;
  categories: CategoryDTO[];
  categoryId: string | null;
  onCategoryChange: (id: string | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onManageCategories: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Segmented options={TASK_VIEWS} value={view} onChange={onViewChange} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-border/70 bg-surface px-3 py-2 transition-colors focus-within:border-accent/40">
          <Search size={14} className="shrink-0 text-content-tertiary" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar nas tarefas…"
            aria-label="Buscar tarefas"
            className="min-w-0 flex-1 bg-transparent text-meta text-content-primary outline-none placeholder:text-content-tertiary"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpar busca"
              className="shrink-0 rounded-md p-0.5 text-content-tertiary transition-colors hover:text-content-primary"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          className={cn(
            'shrink-0 rounded-xl px-3 py-1.5 text-meta font-medium transition-colors',
            categoryId === null
              ? 'bg-surface-secondary text-content-primary'
              : 'text-content-tertiary hover:text-content-secondary',
          )}
        >
          Todas as categorias
        </button>
        {categories.map((category) => {
          const selected = categoryId === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange(selected ? null : category.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-meta font-medium transition-colors',
                !selected && 'text-content-tertiary hover:text-content-secondary',
              )}
              style={
                selected
                  ? { backgroundColor: withAlpha(category.color, 0.16), color: readableTint(category.color) }
                  : undefined
              }
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: category.color }}
                aria-hidden
              />
              {category.name}
              {category.openCount ? (
                <span className="tabular-nums opacity-60">{category.openCount}</span>
              ) : null}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onManageCategories}
          className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-meta font-medium text-content-tertiary transition-colors hover:bg-surface-secondary hover:text-content-secondary"
        >
          <SlidersHorizontal size={13} />
          Gerenciar
        </button>
      </div>
    </div>
  );
}
