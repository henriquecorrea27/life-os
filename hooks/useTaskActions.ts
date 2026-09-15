'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/providers/ToastProvider';
import type { TaskFormValues } from '@/components/tasks/TaskForm';
import type { TaskDTO } from '@/lib/types';
import { useCreateTask, useDeleteTask, useReorderTasks, useUpdateTask } from './useTasks';

export function useTaskActions() {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const reorderTasks = useReorderTasks();
  const { toast } = useToast();

  const toggle = useCallback(
    (task: TaskDTO, completed: boolean) => {
      updateTask.mutate(
        { id: task.id, completed },
        {
          onError: (error) =>
            toast({
              message: 'Não consegui atualizar a tarefa',
              description: error instanceof Error ? error.message : undefined,
              tone: 'error',
            }),
        },
      );
    },
    [updateTask, toast],
  );

  const toggleFocus = useCallback(
    (task: TaskDTO) => {
      updateTask.mutate({ id: task.id, isFocus: !task.isFocus });
    },
    [updateTask],
  );

  // Exclusão é otimista e não bloqueia: some da lista e oferece "desfazer" no toast.
  const remove = useCallback(
    (task: TaskDTO) => {
      deleteTask.mutate(task.id, {
        onSuccess: () => {
          toast({
            message: 'Tarefa excluída',
            description: task.title,
            action: {
              label: 'Desfazer',
              onClick: () => {
                createTask.mutate({
                  title: task.title,
                  notes: task.notes,
                  priority: task.priority,
                  dueDate: task.dueDate,
                  categoryId: task.categoryId,
                  recurrence: task.recurrence,
                  isFocus: task.isFocus,
                  subtasks: task.subtasks.map((subtask) => subtask.title),
                });
              },
            },
          });
        },
        onError: (error) =>
          toast({
            message: 'Não consegui excluir a tarefa',
            description: error instanceof Error ? error.message : undefined,
            tone: 'error',
          }),
      });
    },
    [deleteTask, createTask, toast],
  );

  const save = useCallback(
    async (values: TaskFormValues, task: TaskDTO | null) => {
      try {
        if (task) {
          await updateTask.mutateAsync({ id: task.id, ...values });
        } else {
          await createTask.mutateAsync({
            ...values,
            subtasks: values.subtasks.map((subtask) => subtask.title),
          });
        }
        return true;
      } catch (error) {
        toast({
          message: task ? 'Não consegui salvar as alterações' : 'Não consegui criar a tarefa',
          description: error instanceof Error ? error.message : undefined,
          tone: 'error',
        });
        return false;
      }
    },
    [updateTask, createTask, toast],
  );

  const reorder = useCallback((ids: string[]) => reorderTasks.mutate(ids), [reorderTasks]);

  return {
    toggle,
    toggleFocus,
    remove,
    save,
    reorder,
    saving: createTask.isPending || updateTask.isPending,
  };
}
