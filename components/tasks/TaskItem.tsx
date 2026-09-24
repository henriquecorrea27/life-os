'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  CalendarX2,
  GripVertical,
  ListChecks,
  Pencil,
  Repeat2,
  StickyNote,
  Target,
  Trash2,
} from 'lucide-react';
import { useState, type HTMLAttributes } from 'react';
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
  onMiss?: (task: TaskDTO) => void;
  onToggleSubtask?: (task: TaskDTO, subtaskId: string) => void;
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
  onMiss,
  onToggleSubtask,
  dragHandleProps,
  isDragging,
  showCategory = true,
}: TaskItemProps) {
  const [showSubtasks, setShowSubtasks] = useState(false);

  const priority = PRIORITY_META[task.priority];
  const due = dueState(task.dueDate);
  const recurrence = describeRecurrence(task.recurrence);
  const doneSubtasks = task.subtasks.filter((subtask) => subtask.completed).length;
  const hasSubtasks = task.subtasks.length > 0;
  const canExpand = hasSubtasks && Boolean(onToggleSubtask) && !task.completed;

  return (
    <motion.div
      role="listitem"
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      className={cn(
        'group/task relative overflow-hidden rounded-2xl bg-surface transition-shadow duration-200',
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

      <div
        className={cn(
          'flex items-start gap-3 px-3.5 py-3',
          // o card recorta o que sai dele, então a alça de arrastar mora DENTRO,
          // num espaço reservado à esquerda que só existe onde há mouse
          dragHandleProps && 'lg:pl-8',
        )}
      >
        {dragHandleProps ? (
          <button
            {...dragHandleProps}
            type="button"
            aria-label={`Reordenar ${task.title}`}
            className="absolute left-1 top-5 hidden -translate-y-1/2 cursor-grab touch-none rounded-lg p-1 text-content-tertiary opacity-0 transition-opacity hover:text-content-secondary focus-visible:opacity-100 group-hover/task:opacity-100 active:cursor-grabbing lg:block"
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

        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => onEdit(task)} className="block w-full text-left">
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
          </button>

          {(task.dueDate || recurrence || task.notes || hasSubtasks) && !task.completed ? (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-content-tertiary">
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

              {hasSubtasks ? (
                canExpand ? (
                  <button
                    type="button"
                    onClick={() => setShowSubtasks((current) => !current)}
                    aria-expanded={showSubtasks}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md tabular-nums transition-colors hover:text-content-secondary',
                      showSubtasks && 'text-content-secondary',
                    )}
                  >
                    <ListChecks size={12} />
                    {doneSubtasks}/{task.subtasks.length}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <ListChecks size={12} />
                    {doneSubtasks}/{task.subtasks.length}
                  </span>
                )
              ) : null}

              {task.notes ? (
                <span className="inline-flex items-center gap-1">
                  <StickyNote size={12} />
                  nota
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* No celular ficam só "foco" e "não fiz", que são ações do dia a dia.
            Lápis e lixeira saem: a linha inteira já abre o editor, que tem
            "Excluir" — e três alvos de toque ao lado do título roubavam metade da
            largura, com o "excluir" perto demais do polegar. */}
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

            {onMiss && !task.completed ? (
              <IconButton
                size="sm"
                aria-label={`Marcar ${task.title} como não feita hoje`}
                title="Não fiz hoje — vai para amanhã"
                onClick={() => onMiss(task)}
                className="hover:text-[#F59E0B]"
              >
                <CalendarX2 size={14} />
              </IconButton>
            ) : null}

            <IconButton
              size="sm"
              aria-label={`Editar ${task.title}`}
              onClick={() => onEdit(task)}
              className="hidden md:inline-flex"
            >
              <Pencil size={14} />
            </IconButton>

            <IconButton
              size="sm"
              aria-label={`Excluir ${task.title}`}
              onClick={() => onDelete(task)}
              className="hidden hover:text-[#EF4444] md:inline-flex"
            >
              <Trash2 size={14} />
            </IconButton>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {canExpand && showSubtasks ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ul className="flex flex-col gap-0.5 border-t border-border/50 px-3.5 py-2 pl-[3.25rem]">
              {task.subtasks.map((subtask) => (
                <li key={subtask.id} className="flex items-center gap-2.5">
                  <TaskCheckbox
                    checked={subtask.completed}
                    onChange={() => onToggleSubtask?.(task, subtask.id)}
                    color={task.category?.color ?? null}
                    size={15}
                    label={
                      subtask.completed
                        ? `Reabrir subtarefa ${subtask.title}`
                        : `Concluir subtarefa ${subtask.title}`
                    }
                  />
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate text-meta transition-colors duration-200',
                      subtask.completed
                        ? 'text-content-tertiary line-through decoration-content-tertiary/50'
                        : 'text-content-secondary',
                    )}
                  >
                    {subtask.title}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
