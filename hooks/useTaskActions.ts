'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/providers/ToastProvider';
import type { TaskFormValues } from '@/components/tasks/TaskForm';
import type { TaskDTO } from '@/lib/types';
import {
  useCreateTask,
  useDeleteTask,
  useMissTask,
  useReorderTasks,
  useUnmissTask,
  useUpdateTask,
} from './useTasks';

export function useTaskActions() {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const reorderTasks = useReorderTasks();
  const missTask = useMissTask();
  const unmissTask = useUnmissTask();
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

  // Marcar subtarefa direto na lista: o PATCH substitui o array inteiro, então
  // reenviamos todas com só uma virada.
  const toggleSubtask = useCallback(
    (task: TaskDTO, subtaskId: string) => {
      updateTask.mutate(
        {
          id: task.id,
          subtasks: task.subtasks.map((subtask) => ({
            id: subtask.id,
            title: subtask.title,
            completed: subtask.id === subtaskId ? !subtask.completed : subtask.completed,
          })),
        },
        {
          onError: (error) =>
            toast({
              message: 'Não consegui atualizar a subtarefa',
              description: error instanceof Error ? error.message : undefined,
              tone: 'error',
            }),
        },
      );
    },
    [updateTask, toast],
  );

  // "Não fiz hoje": some da lista de hoje, conta na taxa de conclusão e volta
  // para amanhã. O desfazer traz de volta e apaga a falha registrada.
  const miss = useCallback(
    (task: TaskDTO) => {
      missTask.mutate(task.id, {
        onSuccess: () =>
          toast({
            message: 'Marcada como não feita hoje',
            description: `${task.title} — voltou para amanhã`,
            action: {
              label: 'Desfazer',
              onClick: () => unmissTask.mutate(task.id),
            },
          }),
        onError: (error) =>
          toast({
            message: 'Não consegui registrar',
            description: error instanceof Error ? error.message : undefined,
            tone: 'error',
          }),
      });
    },
    [missTask, unmissTask, toast],
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
    miss,
    toggleSubtask,
    save,
    reorder,
    saving: createTask.isPending || updateTask.isPending,
  };
}
