'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-2xl border border-border/70 bg-surface p-4 shadow-card',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-content-secondary">
        <Icon size={14} style={accent ? { color: accent } : undefined} />
        <span className="text-micro font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-[28px] font-semibold leading-none tabular-nums text-content-primary">
        {value}
      </p>
      {hint ? <p className="text-micro text-content-tertiary">{hint}</p> : null}
    </div>
  );
}
