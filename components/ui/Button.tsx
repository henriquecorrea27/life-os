'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover shadow-card dark:text-[#111114] disabled:hover:bg-accent',
  secondary:
    'bg-surface text-content-primary border border-border hover:bg-surface-secondary shadow-card',
  ghost: 'text-content-secondary hover:bg-surface-secondary hover:text-content-primary',
  subtle: 'bg-surface-secondary text-content-primary hover:brightness-95 dark:hover:brightness-110',
  danger: 'bg-surface text-[#EF4444] border border-border hover:bg-[#EF4444]/10',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-meta gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-body gap-2 rounded-xl',
  lg: 'h-12 px-5 text-body gap-2 rounded-2xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', loading, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center font-medium transition-all duration-200 ease-soft',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : null}
      {children}
    </button>
  );
});
