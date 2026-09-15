'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ProgressRing({
  value,
  total,
  size = 56,
  stroke = 5,
  color,
  label,
  className,
}: {
  value: number;
  total: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  className?: string;
}) {
  const safeTotal = Math.max(total, 1);
  const ratio = Math.min(value / safeTotal, 1);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-border"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={color ?? 'var(--accent)'}
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - ratio) }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-meta font-semibold tabular-nums text-content-primary">
          {label ?? `${Math.round(ratio * 100)}%`}
        </span>
      </div>
    </div>
  );
}

export function ProgressBar({
  value,
  total,
  color,
  className,
}: {
  value: number;
  total: number;
  color?: string;
  className?: string;
}) {
  const ratio = Math.min(value / Math.max(total, 1), 1);

  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary', className)}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color ?? 'var(--accent)' }}
        initial={false}
        animate={{ width: `${ratio * 100}%` }}
        transition={{ type: 'spring', stiffness: 160, damping: 24 }}
      />
    </div>
  );
}
