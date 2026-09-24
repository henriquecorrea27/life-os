'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, buildQuery } from '@/lib/api';
import type { TaskDTO } from '@/lib/types';
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/validations/task';

export interface TaskFilters {
  view?: string;
  categoryId?: string | null;
  q?: string | null;
  includeCompleted?: boolean;
}

export const taskKeys = {
  all: ['tasks'] as const,
  list: (filters: TaskFilters) => ['tasks', filters] as const,
};

export function useTasks(filters: TaskFilters = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    enabled: options.enabled ?? true,
    queryFn: () =>
      apiFetch<TaskDTO[]>(
        `/api/tasks${buildQuery({
          view: filters.view,
          categoryId: filters.categoryId,
          q: filters.q,
          includeCompleted: filters.includeCompleted,
        })}`,
      ),
  });
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: taskKeys.all });
  queryClient.invalidateQueries({ queryKey: ['stats'] });
  queryClient.invalidateQueries({ queryKey: ['review'] });
  queryClient.invalidateQueries({ queryKey: ['categories'] });
  // Só as consultas de DIA do diário: elas mostram "concluído nesse dia" e mudam
  // quando uma tarefa muda. As listas de entradas não — quem as invalida é o
  // save do próprio diário.
  queryClient.invalidateQueries({ queryKey: ['journal', 'day'] });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      apiFetch<TaskDTO>('/api/tasks', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateTaskInput & { id: string }) =>
      apiFetch<TaskDTO>(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    // Marcar concluída precisa parecer instantâneo: aplicamos o novo estado em todas
    // as listas em cache antes da resposta e revertemos se o servidor recusar.
    // As subtarefas entram no patch com a ordem do próprio array — é a mesma regra
    // que o servidor aplica ao gravar, então marcar uma subtarefa na lista também
    // responde na hora. As que ainda não têm id ficam de fora (nascem no servidor).
    onMutate: async ({ id, subtasks, ...input }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const snapshot = queryClient.getQueriesData<TaskDTO[]>({ queryKey: taskKeys.all });

      queryClient.setQueriesData<TaskDTO[]>({ queryKey: taskKeys.all }, (tasks) =>
        tasks?.map((task) =>
          task.id === id
            ? {
                ...task,
                ...input,
                ...(subtasks && subtasks.every((subtask) => subtask.id)
                  ? {
                      subtasks: subtasks.map((subtask, index) => ({
                        id: subtask.id as string,
                        title: subtask.title,
                        completed: subtask.completed,
                        order: index,
                      })),
                    }
                  : {}),
                completedAt:
                  input.completed === true
                    ? new Date().toISOString()
                    : input.completed === false
                      ? null
                      : task.completedAt,
              }
            : task,
        ),
      );

      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => invalidateAll(queryClient),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ id: string }>(`/api/tasks/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const snapshot = queryClient.getQueriesData<TaskDTO[]>({ queryKey: taskKeys.all });
      queryClient.setQueriesData<TaskDTO[]>({ queryKey: taskKeys.all }, (tasks) =>
        tasks?.filter((task) => task.id !== id),
      );
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => invalidateAll(queryClient),
  });
}

/** "Não fiz hoje": registra a falha do dia e joga a tarefa para amanhã. */
export function useMissTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<TaskDTO>(`/api/tasks/${id}/miss`, { method: 'POST' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const snapshot = queryClient.getQueriesData<TaskDTO[]>({ queryKey: taskKeys.all });
      // Sai da vista de hoje na hora; o servidor confirma a nova data logo atrás.
      queryClient.setQueriesData<TaskDTO[]>({ queryKey: taskKeys.all }, (tasks) =>
        tasks?.filter((task) => task.id !== id),
      );
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => invalidateAll(queryClient),
  });
}

export function useUnmissTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<TaskDTO>(`/api/tasks/${id}/miss`, { method: 'DELETE' }),
    onSettled: () => invalidateAll(queryClient),
  });
}

export function useCloseDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ missed: number; completedToday: number }>('/api/tasks/close-day', {
        method: 'POST',
      }),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useReorderTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiFetch<{ ok: boolean }>('/api/tasks/reorder', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
