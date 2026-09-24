'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, buildQuery } from '@/lib/api';
import type { DayContextTask, JournalEntryDTO } from '@/lib/types';
import type { JournalEntryInput } from '@/lib/validations/journal';

export interface JournalDayResponse {
  date: string;
  entry: JournalEntryDTO | null;
  completedTasks: DayContextTask[];
}

export const journalKeys = {
  all: ['journal'] as const,
  list: (params: Record<string, string | number | undefined>) =>
    ['journal', 'list', params] as const,
  day: (date: string) => ['journal', 'day', date] as const,
};

export function useJournalEntries(
  params: { from?: string; to?: string; q?: string; limit?: number } = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: journalKeys.list(params),
    enabled: options.enabled ?? true,
    queryFn: () => apiFetch<JournalEntryDTO[]>(`/api/journal${buildQuery(params)}`),
  });
}

export function useJournalDay(date: string) {
  return useQuery({
    queryKey: journalKeys.day(date),
    queryFn: () => apiFetch<JournalDayResponse>(`/api/journal/${date}`),
    enabled: Boolean(date),
  });
}

export function useSaveJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, ...input }: JournalEntryInput) =>
      apiFetch<JournalEntryDTO>(`/api/journal/${date}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: journalKeys.all });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.setQueryData<JournalDayResponse>(journalKeys.day(entry.date), (current) =>
        current ? { ...current, entry } : current,
      );
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (date: string) =>
      apiFetch<{ date: string }>(`/api/journal/${date}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.all });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
