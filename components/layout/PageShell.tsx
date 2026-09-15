'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

export function PageShell({
  title,
  subtitle,
  action,
  children,
  width = 'md',
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  width?: 'md' | 'lg';
}) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'mx-auto w-full px-5 pb-16 pt-7 sm:px-8 md:pt-12',
        width === 'lg' ? 'max-w-5xl' : 'max-w-3xl',
      )}
    >
      <header className="mb-7 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-page font-semibold text-content-primary">{title}</h1>
          {subtitle ? (
            <p className="mt-1.5 text-body text-content-secondary">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          <span className="md:hidden">
            <ThemeToggle size="sm" />
          </span>
        </div>
      </header>

      {children}
    </motion.main>
  );
}
