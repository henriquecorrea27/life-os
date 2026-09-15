'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const BASE_FIELD =
  'w-full rounded-xl border border-border bg-surface px-3.5 text-body text-content-primary transition-all duration-200 ease-soft placeholder:text-content-tertiary focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent-soft disabled:opacity-50';

export function Label({
  children,
  htmlFor,
  hint,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-2', className)}>
      <label htmlFor={htmlFor} className="text-meta font-medium text-content-secondary">
        {children}
      </label>
      {hint ? <span className="text-micro text-content-tertiary">{hint}</span> : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <Label htmlFor={inputId} hint={hint}>
          {label}
        </Label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(BASE_FIELD, 'h-11', error && 'border-[#EF4444]/60 focus:ring-[#EF4444]/10', className)}
        {...props}
      />
      {error ? <p className="text-micro text-[#EF4444]">{error}</p> : null}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, hint, error, id, ...props },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <Label htmlFor={textareaId} hint={hint}>
          {label}
        </Label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        aria-invalid={error ? true : undefined}
        className={cn(
          BASE_FIELD,
          'resize-none py-3 leading-relaxed scroll-area',
          error && 'border-[#EF4444]/60 focus:ring-[#EF4444]/10',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-micro text-[#EF4444]">{error}</p> : null}
    </div>
  );
});
