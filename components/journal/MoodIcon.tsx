'use client';

import { MOOD_META, type Mood } from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * Set de rostos desenhado para o app — não usamos emoji do sistema porque eles
 * mudam de forma entre plataformas e quebram o tom visual. A geometria é sempre
 * a mesma (círculo + dois olhos + uma curva); só a curva da boca e a inclinação
 * das sobrancelhas mudam entre os cinco níveis.
 */

const MOUTH: Record<Mood, string> = {
  VERY_BAD: 'M8.5 16.4c1.1-2.1 2.2-3.1 3.5-3.1s2.4 1 3.5 3.1',
  BAD: 'M8.6 15.6c1-1.2 2.1-1.8 3.4-1.8s2.4.6 3.4 1.8',
  NEUTRAL: 'M8.6 14.9h6.8',
  GOOD: 'M8.6 14.1c1 1.2 2.1 1.8 3.4 1.8s2.4-.6 3.4-1.8',
  VERY_GOOD: 'M8.2 13.6c1.1 2.1 2.3 3.1 3.8 3.1s2.7-1 3.8-3.1',
};

const BROW: Record<Mood, string | null> = {
  VERY_BAD: 'M8.1 8.2l2.5 1M15.9 8.2l-2.5 1',
  BAD: 'M8.3 8.6l2.2.6M15.7 8.6l-2.2.6',
  NEUTRAL: null,
  GOOD: null,
  VERY_GOOD: 'M8.4 8.1l2.2-.7M15.6 8.1l-2.2-.7',
};

export function MoodIcon({
  mood,
  size = 24,
  active = true,
  className,
  strokeWidth = 1.6,
}: {
  mood: Mood;
  size?: number;
  active?: boolean;
  className?: string;
  strokeWidth?: number;
}) {
  const color = active ? MOOD_META[mood].color : 'currentColor';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label={MOOD_META[mood].label}
      className={cn('shrink-0', !active && 'text-content-tertiary', className)}
    >
      <circle
        cx="12"
        cy="12"
        r="9.25"
        stroke={color}
        strokeWidth={strokeWidth}
        fill={active ? color : 'none'}
        fillOpacity={active ? 0.16 : 0}
      />
      <circle cx="9.3" cy="11" r="1.05" fill={color} />
      <circle cx="14.7" cy="11" r="1.05" fill={color} />
      {BROW[mood] ? (
        <path
          d={BROW[mood] as string}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      ) : null}
      <path
        d={MOUTH[mood]}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
