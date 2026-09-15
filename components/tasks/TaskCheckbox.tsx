'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { cn, withAlpha } from '@/lib/utils';

export function TaskCheckbox({
  checked,
  onChange,
  color,
  size = 20,
  label,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: string | null;
  size?: number;
  label: string;
  className?: string;
}) {
  const tint = color ?? 'var(--accent)';

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onChange(!checked);
      }}
      whileTap={{ scale: 0.82 }}
      transition={{ type: 'spring', stiffness: 600, damping: 18 }}
      className={cn('relative grid shrink-0 place-items-center rounded-full', className)}
      style={{ width: size, height: size }}
    >
      {/* anel base */}
      <span
        className="absolute inset-0 rounded-full border-[1.75px] transition-colors duration-200"
        style={{
          borderColor: checked ? tint : 'var(--border)',
          backgroundColor: checked ? tint : 'transparent',
        }}
      />

      {/* halo de "pop" que escapa do anel no instante da marcação */}
      <AnimatePresence>
        {checked ? (
          <motion.span
            key="halo"
            initial={{ scale: 0.6, opacity: 0.55 }}
            animate={{ scale: 1.9, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ backgroundColor: withAlpha(color ?? '#6366F1', 0.55) }}
          />
        ) : null}
      </AnimatePresence>

      {/* preenchimento com o check riscado à mão */}
      <AnimatePresence initial={false}>
        {checked ? (
          <motion.svg
            key="check"
            viewBox="0 0 20 20"
            fill="none"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 700, damping: 22 }}
            className="relative"
            style={{ width: size, height: size }}
          >
            <motion.path
              d="M5.5 10.4l3 3 6-6.4"
              stroke="#fff"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: 0.04 }}
            />
          </motion.svg>
        ) : (
          <motion.span
            key="hover-dot"
            initial={false}
            className="absolute inset-[5px] rounded-full opacity-0 transition-opacity duration-200 group-hover/task:opacity-100"
            style={{ backgroundColor: withAlpha(color ?? '#6366F1', 0.18) }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
