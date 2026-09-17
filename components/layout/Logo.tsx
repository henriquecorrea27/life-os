'use client';

import { useId } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';

/**
 * Ícone de marca do Life OS (baseado em /logo/logo-icon.svg e logo-icon-dark.svg).
 * Desenhado inline com as duas variantes de cor para trocar de tema sem flash:
 * a versão dark usa um gradiente mais claro e troca o check branco por um tom
 * que combina com o fundo escuro do app, mantendo o contraste correto.
 */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  const { theme } = useTheme();
  const gradientId = useId();
  const dark = theme === 'dark';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      role="img"
      aria-label="Life OS"
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={dark ? '#818CF8' : '#6366F1'} />
          <stop offset="1" stopColor={dark ? '#6366F1' : '#4F46E5'} />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill={`url(#${gradientId})`} />
      <path
        d="M17 33 L27 43 L47 20"
        stroke={dark ? '#0F0F11' : '#FFFFFF'}
        strokeWidth={5.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="47" cy="45" r="5" fill={dark ? '#0F0F11' : '#FFFFFF'} fillOpacity={0.95} />
    </svg>
  );
}
