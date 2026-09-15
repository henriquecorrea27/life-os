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

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
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
  queryClient.invalidateQueries({ queryKey: ['journal'] });
  queryClient.invalidateQueries({ queryKey: ['categories'] });
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
    // `subtasks` fica de fora do patch otimista: o formato enviado não carrega
    // `order`, e reconstruí-lo aqui só duplicaria a regra do servidor.
    onMutate: async ({ id, subtasks: _subtasks, ...input }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const snapshot = queryClient.getQueriesData<TaskDTO[]>({ queryKey: taskKeys.all });

      queryClient.setQueriesData<TaskDTO[]>({ queryKey: taskKeys.all }, (tasks) =>
        tasks?.map((task) =>
          task.id === id
            ? {
                ...task,
                ...input,
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
