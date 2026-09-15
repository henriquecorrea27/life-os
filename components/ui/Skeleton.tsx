'use client';

import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        'relative overflow-hidden rounded-xl bg-surface-secondary',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.6s_infinite] after:bg-gradient-to-r after:from-transparent after:via-black/[0.035] after:to-transparent dark:after:via-white/[0.05]',
        className,
      )}
    />
  );
}

export function TaskListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5">
          <Skeleton className="h-[19px] w-[19px] rounded-full" />
          <Skeleton className="h-3.5" style={{ width: `${45 + ((index * 17) % 35)}%` }} />
        </div>
      ))}
    </div>
  );
}
