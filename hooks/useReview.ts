'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, buildQuery } from '@/lib/api';
import type { ReviewResponse } from '@/lib/types';

export function useReview(week?: string) {
  return useQuery({
    queryKey: ['review', week ?? 'current'],
    queryFn: () => apiFetch<ReviewResponse>(`/api/review${buildQuery({ week })}`),
  });
}
