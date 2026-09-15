'use client';

import type { ReactNode } from 'react';
import { cn, readableTint, withAlpha } from '@/lib/utils';

export function Badge({
  children,
  color,
  className,
  dot = true,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
  dot?: boolean;
}) {
  const tinted = Boolean(color);

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-lg px-2 py-0.5 text-micro font-medium',
        !tinted && 'bg-surface-secondary text-content-secondary',
        className,
      )}
      style={
        tinted
          ? { backgroundColor: withAlpha(color as string, 0.14), color: readableTint(color as string) }
          : undefined
      }
    >
      {tinted && dot ? (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      ) : null}
      <span className="truncate">{children}</span>
    </span>
  );
}
