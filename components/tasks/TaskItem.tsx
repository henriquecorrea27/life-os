'use client';

import { motion } from 'framer-motion';
import {
  CalendarDays,
  GripVertical,
  ListChecks,
  Pencil,
  Repeat2,
  StickyNote,
  Target,
  Trash2,
} from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { PRIORITY_META } from '@/lib/constants';
import { dueState, formatDueLabel } from '@/lib/dates';
import { describeRecurrence } from '@/lib/recurrence';
import type { TaskDTO } from '@/lib/types';
import { cn, withAlpha } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { TaskCheckbox } from './TaskCheckbox';

interface TaskItemProps {
  task: TaskDTO;
  onToggle: (task: TaskDTO, completed: boolean) => void;
  onEdit: (task: TaskDTO) => void;
  onDelete: (task: TaskDTO) => void;
  onToggleFocus?: (task: TaskDTO) => void;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
  showCategory?: boolean;
}

export function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  onToggleFocus,
  dragHandleProps,
  isDragging,
  showCategory = true,
}: TaskItemProps) {
  const priority = PRIORITY_META[task.priority];
  const due = dueState(task.dueDate);
  const recurrence = describeRecurrence(task.recurrence);
  const doneSubtasks = task.subtasks.filter((subtask) => subtask.completed).length;

  return (
    <motion.div
      role="listitem"
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      className={cn(
        'group/task relative flex items-start gap-3 overflow-hidden rounded-2xl bg-surface px-3.5 py-3 transition-shadow duration-200',
        // o card recorta o que sai dele, então a alça de arrastar mora DENTRO,
        // num espaço reservado à esquerda que só existe onde há mouse
        dragHandleProps && 'lg:pl-8',
        'border border-transparent hover:border-border/70 hover:shadow-card',
        isDragging && 'shadow-float',
        task.completed && 'bg-transparent hover:bg-surface',
      )}
    >
      {task.priority !== 'NONE' && !task.completed ? (
        <span
          aria-hidden
          className="absolute inset-y-2 left-0 w-[3px] rounded-full"
          style={{ backgroundColor: priority.color }}
        />
      ) : null}

      {dragHandleProps ? (
        <button
          {...dragHandleProps}
          type="button"
          aria-label={`Reordenar ${task.title}`}
          className="absolute left-1 top-1/2 hidden -translate-y-1/2 cursor-grab touch-none rounded-lg p-1 text-content-tertiary opacity-0 transition-opacity hover:text-content-secondary focus-visible:opacity-100 group-hover/task:opacity-100 active:cursor-grabbing lg:block"
        >
          <GripVertical size={15} />
        </button>
      ) : null}

      <TaskCheckbox
        checked={task.completed}
        onChange={(checked) => onToggle(task, checked)}
        color={task.category?.color ?? null}
        label={task.completed ? `Reabrir ${task.title}` : `Concluir ${task.title}`}
        className="mt-0.5"
      />

      <button
        type="button"
        onClick={() => onEdit(task)}
        className="min-w-0 flex-1 text-left"
      >
        <span
          className={cn(
            'block text-body leading-snug transition-colors duration-300',
            task.completed
              ? 'text-content-tertiary line-through decoration-content-tertiary/50'
              : 'text-content-primary',
          )}
        >
          {task.title}
        </span>

        {(task.dueDate || recurrence || task.notes || task.subtasks.length > 0) && !task.completed ? (
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-content-tertiary">
            {task.dueDate ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1',
                  due === 'overdue' && 'font-medium text-[#EF4444]',
                  due === 'today' && 'font-medium text-accent',
                )}
              >
                <CalendarDays size={12} />
                {formatDueLabel(task.dueDate)}
              </span>
            ) : null}

            {recurrence ? (
              <span className="inline-flex items-center gap-1">
                <Repeat2 size={12} />
                {recurrence}
              </span>
            ) : null}

            {task.subtasks.length > 0 ? (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <ListChecks size={12} />
                {doneSubtasks}/{task.subtasks.length}
              </span>
            ) : null}

            {task.notes ? (
              <span className="inline-flex items-center gap-1">
                <StickyNote size={12} />
                nota
              </span>
            ) : null}
          </span>
        ) : null}
      </button>

      <div className="flex shrink-0 items-center gap-1 pt-0.5">
        {showCategory && task.category && !task.completed ? (
          <Badge color={task.category.color} className="hidden sm:inline-flex">
            {task.category.name}
          </Badge>
        ) : null}

        {showCategory && task.category ? (
          <span
            aria-hidden
            className="h-2 w-2 rounded-full sm:hidden"
            style={{ backgroundColor: task.category.color }}
          />
        ) : null}

        <div className="flex items-center gap-0.5 transition-opacity duration-200 md:opacity-0 md:group-hover/task:opacity-100 md:focus-within:opacity-100">
          {onToggleFocus && !task.completed ? (
            <IconButton
              size="sm"
              aria-label={task.isFocus ? 'Tirar do foco do dia' : 'Colocar no foco do dia'}
              onClick={() => onToggleFocus(task)}
              className={cn(task.isFocus && 'text-accent md:opacity-100')}
              style={task.isFocus ? { backgroundColor: withAlpha('#6366F1', 0.1) } : undefined}
            >
              <Target size={14} />
            </IconButton>
          ) : null}

          <IconButton size="sm" aria-label={`Editar ${task.title}`} onClick={() => onEdit(task)}>
            <Pencil size={14} />
          </IconButton>

          <IconButton
            size="sm"
            aria-label={`Excluir ${task.title}`}
            onClick={() => onDelete(task)}
            className="hover:text-[#EF4444]"
          >
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>
    </motion.div>
  );
}
