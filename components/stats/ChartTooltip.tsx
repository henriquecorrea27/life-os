'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/** Tooltip flutuante compartilhado pelos gráficos — segue o cursor dentro do card. */
export function ChartTooltip({
  x,
  y,
  children,
}: {
  x: number | string;
  y: number | string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-xl border border-border bg-surface px-2.5 py-1.5 shadow-float"
      style={{ left: x, top: y }}
    >
      {children}
    </motion.div>
  );
}
