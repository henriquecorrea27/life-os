'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, CornerDownLeft, Flag, Plus, Repeat2, Target } from 'lucide-react';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import { PRIORITY_META } from '@/lib/constants';
import { formatDueLabel } from '@/lib/dates';
import { parseQuickAdd } from '@/lib/quick-parse';
import { describeRecurrence } from '@/lib/recurrence';
import type { CategoryDTO } from '@/lib/types';
import { cn, readableTint, withAlpha } from '@/lib/utils';
import { useCreateTask } from '@/hooks/useTasks';
import { useToast } from '@/components/providers/ToastProvider';
import { useHotkey } from '@/hooks/useHotkeys';

export function QuickAdd({
  categories,
  defaultDueDate = null,
  defaultCategoryId = null,
  defaultFocus = false,
  placeholder = 'Adicionar tarefa… tente "revisar trades amanhã #trade"',
  className,
  autoFocusHotkey = true,
}: {
  categories: CategoryDTO[];
  defaultDueDate?: string | null;
  defaultCategoryId?: string | null;
  defaultFocus?: boolean;
  placeholder?: string;
  className?: string;
  autoFocusHotkey?: boolean;
}) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const createTask = useCreateTask();
  const { toast } = useToast();

  const parsed = useMemo(() => parseQuickAdd(value, categories), [value, categories]);

  useHotkey(
    'n',
    (event) => {
      event.preventDefault();
      inputRef.current?.focus();
    },
    autoFocusHotkey,
  );

  const recurrenceLabel = describeRecurrence(parsed.recurrence);
  const dueDate = parsed.dueDate ?? defaultDueDate;
  const categoryId = parsed.categoryId ?? defaultCategoryId;
  const category = categories.find((item) => item.id === categoryId) ?? null;

  const hints = [
    dueDate ? { icon: CalendarDays, label: formatDueLabel(dueDate), color: undefined } : null,
    category ? { icon: null, label: category.name, color: category.color } : null,
    parsed.priority !== 'NONE'
      ? { icon: Flag, label: PRIORITY_META[parsed.priority].label, color: PRIORITY_META[parsed.priority].color }
      : null,
    recurrenceLabel ? { icon: Repeat2, label: recurrenceLabel, color: undefined } : null,
    parsed.isFocus || defaultFocus ? { icon: Target, label: 'Foco do dia', color: undefined } : null,
  ].filter(Boolean) as { icon: typeof Flag | null; label: string; color?: string }[];

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!parsed.title.trim()) return;

    try {
      await createTask.mutateAsync({
        title: parsed.title,
        priority: parsed.priority,
        dueDate,
        categoryId,
        recurrence: parsed.recurrence,
        isFocus: parsed.isFocus || defaultFocus,
      });
      setValue('');
      inputRef.current?.focus();
    } catch (error) {
      toast({
        message: 'Não consegui salvar a tarefa',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'rounded-2xl border bg-surface shadow-card transition-all duration-200 ease-soft',
        focused ? 'border-accent/40 ring-4 ring-accent-soft' : 'border-border/70',
        className,
      )}
    >
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <span
          className={cn(
            'grid h-6 w-6 shrink-0 place-items-center rounded-full border-[1.75px] border-dashed transition-colors',
            focused ? 'border-accent text-accent' : 'border-border text-content-tertiary',
          )}
        >
          <Plus size={13} />
        </span>

        <input
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setValue('');
              inputRef.current?.blur();
            }
          }}
          placeholder={placeholder}
          aria-label="Nova tarefa"
          className="min-w-0 flex-1 bg-transparent text-body text-content-primary outline-none placeholder:text-content-tertiary"
        />

        <AnimatePresence>
          {parsed.title.trim() ? (
            <motion.button
              type="submit"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              disabled={createTask.isPending}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-2.5 py-1.5 text-micro font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60 dark:text-[#111114]"
            >
              <CornerDownLeft size={12} />
              Criar
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {hints.length > 0 && value.trim() ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 px-3.5 py-2">
              {hints.map((hint) => (
                <span
                  key={hint.label}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-micro font-medium"
                  style={{
                    backgroundColor: hint.color
                      ? withAlpha(hint.color, 0.14)
                      : 'var(--surface-secondary)',
                    color: hint.color ? readableTint(hint.color) : 'var(--text-secondary)',
                  }}
                >
                  {hint.icon ? <hint.icon size={11} /> : null}
                  {hint.label}
                </span>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {focused && !value.trim() ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="border-t border-border/60 px-3.5 py-2 text-micro text-content-tertiary">
              <span className="font-medium text-content-secondary">#categoria</span> ·{' '}
              <span className="font-medium text-content-secondary">amanhã, sexta, 15/03</span> ·{' '}
              <span className="font-medium text-content-secondary">!alta</span> ·{' '}
              <span className="font-medium text-content-secondary">todo dia</span> ·{' '}
              <span className="font-medium text-content-secondary">@foco</span>
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}
