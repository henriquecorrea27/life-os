'use client';

import { motion } from 'framer-motion';
import { MOODS, MOOD_META, type Mood } from '@/lib/constants';
import { cn, readableTint, withAlpha } from '@/lib/utils';
import { MoodIcon } from './MoodIcon';

export function MoodPicker({
  value,
  onChange,
  size = 'md',
  className,
}: {
  value: Mood | null;
  onChange: (mood: Mood) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const iconSize = size === 'lg' ? 34 : size === 'md' ? 28 : 22;

  return (
    <div
      role="radiogroup"
      aria-label="Como foi seu dia?"
      className={cn('flex items-stretch gap-1.5', className)}
    >
      {MOODS.map((mood) => {
        const selected = value === mood;
        const meta = MOOD_META[mood];

        return (
          <motion.button
            key={mood}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={meta.label}
            onClick={() => onChange(mood)}
            whileTap={{ scale: 0.94 }}
            animate={{ scale: selected ? 1 : 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            className={cn(
              'group flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl border py-3 transition-colors duration-200',
              size === 'sm' && 'py-2',
              selected
                ? 'border-transparent'
                : 'border-transparent bg-surface-secondary/60 hover:bg-surface-secondary',
            )}
            style={
              selected
                ? {
                    backgroundColor: withAlpha(meta.color, 0.18),
                    boxShadow: `inset 0 0 0 1.5px ${withAlpha(meta.color, 0.4)}`,
                  }
                : undefined
            }
          >
            <MoodIcon mood={mood} size={iconSize} active={selected} />
            <span
              className={cn(
                'text-micro font-medium transition-colors',
                size === 'sm' && 'sr-only',
                selected ? '' : 'text-content-tertiary group-hover:text-content-secondary',
              )}
              style={selected ? { color: readableTint(meta.color) } : undefined}
            >
              {meta.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
