'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, GripVertical, Plus, Target, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PRIORITIES, PRIORITY_META, WEEKDAYS } from '@/lib/constants';
import { shiftKey, todayKey } from '@/lib/dates';
import { parseRecurrence, serializeRecurrence } from '@/lib/recurrence';
import type { CategoryDTO, TaskDTO } from '@/lib/types';
import { cn, nextId, readableTint, withAlpha } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input, Label, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';

const formSchema = z.object({
  title: z.string().trim().min(1, 'Dê um título para a tarefa').max(200),
  notes: z.string().trim().max(5000),
});

type FormValues = z.infer<typeof formSchema>;

interface DraftSubtask {
  id?: string;
  key: string;
  title: string;
  completed: boolean;
}

export interface TaskFormValues {
  title: string;
  notes: string | null;
  priority: (typeof PRIORITIES)[number];
  dueDate: string | null;
  categoryId: string | null;
  recurrence: string | null;
  isFocus: boolean;
  subtasks: { id?: string; title: string; completed: boolean }[];
}

export function TaskForm({
  open,
  onClose,
  task,
  categories,
  defaultDueDate = null,
  onSubmit,
  onDelete,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  task: TaskDTO | null;
  categories: CategoryDTO[];
  defaultDueDate?: string | null;
  onSubmit: (values: TaskFormValues) => void | Promise<void>;
  onDelete?: (task: TaskDTO) => void;
  saving?: boolean;
}) {
  const [priority, setPriority] = useState<TaskFormValues['priority']>('NONE');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isFocus, setIsFocus] = useState(false);
  const [recurrenceKind, setRecurrenceKind] = useState<'none' | 'daily' | 'weekly'>('none');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [subtasks, setSubtasks] = useState<DraftSubtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', notes: '' },
  });

  useEffect(() => {
    if (!open) return;

    reset({ title: task?.title ?? '', notes: task?.notes ?? '' });
    setPriority(task?.priority ?? 'NONE');
    setDueDate(task ? task.dueDate : defaultDueDate);
    setCategoryId(task?.categoryId ?? null);
    setIsFocus(task?.isFocus ?? false);

    const recurrence = parseRecurrence(task?.recurrence);
    setRecurrenceKind(recurrence ? recurrence.kind : 'none');
    setWeekdays(recurrence?.kind === 'weekly' ? recurrence.days : []);

    setSubtasks(
      (task?.subtasks ?? []).map((subtask) => ({
        id: subtask.id,
        key: subtask.id,
        title: subtask.title,
        completed: subtask.completed,
      })),
    );
    setNewSubtask('');
  }, [open, task, defaultDueDate, reset]);

  const recurrence =
    recurrenceKind === 'none'
      ? null
      : recurrenceKind === 'daily'
        ? 'daily'
        : serializeRecurrence({ kind: 'weekly', days: weekdays });

  function addSubtask() {
    const title = newSubtask.trim();
    if (!title) return;
    setSubtasks((current) => [...current, { key: nextId('sub'), title, completed: false }]);
    setNewSubtask('');
  }

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      title: values.title,
      notes: values.notes.trim() ? values.notes.trim() : null,
      priority,
      dueDate,
      categoryId,
      recurrence,
      isFocus,
      subtasks: subtasks.map(({ id, title, completed }) => ({ id, title, completed })),
    });
  });

  const dateShortcuts = [
    { label: 'Hoje', value: todayKey() },
    { label: 'Amanhã', value: shiftKey(todayKey(), 1) },
    { label: 'Próx. semana', value: shiftKey(todayKey(), 7) },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={task ? 'Editar tarefa' : 'Nova tarefa'}
      description={task ? undefined : 'Preencha só o que importa — o resto é opcional.'}
      footer={
        <>
          {task && onDelete ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="mr-auto"
              onClick={() => onDelete(task)}
            >
              <Trash2 size={14} />
              Excluir
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" size="sm" loading={saving} onClick={() => submit()}>
            {task ? 'Salvar' : 'Criar tarefa'}
          </Button>
        </>
      }
    >
      <form
        onSubmit={submit}
        className="flex flex-col gap-5"
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) submit();
        }}
      >
        <Input
          label="Título"
          placeholder="O que precisa ser feito?"
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="flex flex-col gap-2">
          <Label>Categoria</Label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className={cn(
                'rounded-xl border px-3 py-1.5 text-meta font-medium transition-all duration-200',
                categoryId === null
                  ? 'border-transparent bg-surface-secondary text-content-primary'
                  : 'border-border text-content-tertiary hover:text-content-secondary',
              )}
            >
              Sem categoria
            </button>
            {categories.map((category) => {
              const selected = categoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-meta font-medium transition-all duration-200',
                    selected ? 'border-transparent' : 'border-border text-content-secondary hover:border-border',
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
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="task-due">Data</Label>
            <input
              id="task-due"
              type="date"
              value={dueDate ?? ''}
              onChange={(event) => setDueDate(event.target.value || null)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-body text-content-primary outline-none transition-all focus:border-accent/50 focus:ring-4 focus:ring-accent-soft"
            />
            <div className="flex flex-wrap gap-1.5">
              {dateShortcuts.map((shortcut) => (
                <button
                  key={shortcut.label}
                  type="button"
                  onClick={() => setDueDate(shortcut.value)}
                  className={cn(
                    'rounded-lg px-2 py-1 text-micro font-medium transition-colors',
                    dueDate === shortcut.value
                      ? 'bg-accent-soft text-accent'
                      : 'text-content-tertiary hover:bg-surface-secondary hover:text-content-secondary',
                  )}
                >
                  {shortcut.label}
                </button>
              ))}
              {dueDate ? (
                <button
                  type="button"
                  onClick={() => setDueDate(null)}
                  className="rounded-lg px-2 py-1 text-micro font-medium text-content-tertiary transition-colors hover:bg-surface-secondary hover:text-content-secondary"
                >
                  Limpar
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Prioridade</Label>
            <div className="flex gap-1.5">
              {PRIORITIES.map((value) => {
                const meta = PRIORITY_META[value];
                const selected = priority === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPriority(value)}
                    className={cn(
                      'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border text-meta font-medium transition-all duration-200',
                      selected ? 'border-transparent' : 'border-border text-content-tertiary hover:text-content-secondary',
                    )}
                    style={
                      selected && value !== 'NONE'
                        ? { backgroundColor: withAlpha(meta.color, 0.16), color: readableTint(meta.color) }
                        : selected
                          ? { backgroundColor: 'var(--surface-secondary)', color: 'var(--text-primary)' }
                          : undefined
                    }
                  >
                    {value === 'NONE' ? '—' : meta.short}
                  </button>
                );
              })}
            </div>
            <p className="text-micro text-content-tertiary">
              {PRIORITY_META[priority].label}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Repetir</Label>
          <div className="flex gap-1.5">
            {(
              [
                { value: 'none', label: 'Não repete' },
                { value: 'daily', label: 'Todo dia' },
                { value: 'weekly', label: 'Dias da semana' },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRecurrenceKind(option.value)}
                className={cn(
                  'flex-1 rounded-xl border px-3 py-2 text-meta font-medium transition-all duration-200',
                  recurrenceKind === option.value
                    ? 'border-transparent bg-accent-soft text-accent'
                    : 'border-border text-content-tertiary hover:text-content-secondary',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <AnimatePresence initial={false}>
            {recurrenceKind === 'weekly' ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-1.5 pt-1">
                  {WEEKDAYS.map((day) => {
                    const selected = weekdays.includes(day.index);
                    return (
                      <button
                        key={day.key}
                        type="button"
                        aria-label={day.full}
                        aria-pressed={selected}
                        onClick={() =>
                          setWeekdays((current) =>
                            current.includes(day.index)
                              ? current.filter((value) => value !== day.index)
                              : [...current, day.index],
                          )
                        }
                        className={cn(
                          'h-9 flex-1 rounded-xl border text-meta font-medium transition-all duration-200',
                          selected
                            ? 'border-transparent bg-accent text-white dark:text-[#111114]'
                            : 'border-border text-content-tertiary hover:text-content-secondary',
                        )}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-2">
          <Label hint={subtasks.length ? `${subtasks.filter((s) => s.completed).length}/${subtasks.length}` : undefined}>
            Subtarefas
          </Label>

          <div className="flex flex-col gap-1">
            <AnimatePresence initial={false}>
              {subtasks.map((subtask, index) => (
                <motion.div
                  key={subtask.key}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="group flex items-center gap-2 rounded-xl bg-surface-secondary/60 px-2.5 py-1.5"
                >
                  <GripVertical size={13} className="shrink-0 text-content-tertiary opacity-40" />
                  <button
                    type="button"
                    aria-label={subtask.completed ? 'Reabrir subtarefa' : 'Concluir subtarefa'}
                    onClick={() =>
                      setSubtasks((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, completed: !item.completed } : item,
                        ),
                      )
                    }
                    className={cn(
                      'grid h-4 w-4 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors',
                      subtask.completed
                        ? 'border-accent bg-accent text-white dark:text-[#111114]'
                        : 'border-border',
                    )}
                  >
                    {subtask.completed ? <Check size={10} strokeWidth={3} /> : null}
                  </button>
                  <input
                    value={subtask.title}
                    onChange={(event) =>
                      setSubtasks((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, title: event.target.value } : item,
                        ),
                      )
                    }
                    aria-label={`Subtarefa ${index + 1}`}
                    className={cn(
                      'min-w-0 flex-1 bg-transparent text-meta outline-none',
                      subtask.completed
                        ? 'text-content-tertiary line-through'
                        : 'text-content-primary',
                    )}
                  />
                  <IconButton
                    size="sm"
                    aria-label="Remover subtarefa"
                    onClick={() =>
                      setSubtasks((current) => current.filter((_, itemIndex) => itemIndex !== index))
                    }
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <X size={12} />
                  </IconButton>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex items-center gap-2 rounded-xl px-2.5 py-1.5">
              <Plus size={13} className="shrink-0 text-content-tertiary" />
              <input
                value={newSubtask}
                onChange={(event) => setNewSubtask(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addSubtask();
                  }
                }}
                placeholder="Adicionar passo…"
                aria-label="Nova subtarefa"
                className="min-w-0 flex-1 bg-transparent text-meta text-content-primary outline-none placeholder:text-content-tertiary"
              />
            </div>
          </div>
        </div>

        <Textarea
          label="Notas"
          rows={3}
          placeholder="Contexto, links, o que lembrar…"
          {...register('notes')}
        />

        <button
          type="button"
          onClick={() => setIsFocus((current) => !current)}
          className={cn(
            'flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200',
            isFocus ? 'border-transparent bg-accent-soft' : 'border-border hover:bg-surface-secondary',
          )}
        >
          <Target size={16} className={isFocus ? 'text-accent' : 'text-content-tertiary'} />
          <span className="flex-1">
            <span
              className={cn(
                'block text-meta font-medium',
                isFocus ? 'text-accent' : 'text-content-primary',
              )}
            >
              Foco do dia
            </span>
            <span className="block text-micro text-content-secondary">
              Aparece na Home mesmo sem data marcada.
            </span>
          </span>
          <span
            className={cn(
              'h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors',
              isFocus ? 'bg-accent' : 'bg-border',
            )}
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 34 }}
              className={cn(
                'block h-4 w-4 rounded-full bg-white shadow-card',
                isFocus ? 'ml-4' : 'ml-0',
              )}
            />
          </span>
        </button>
      </form>
    </Modal>
  );
}
