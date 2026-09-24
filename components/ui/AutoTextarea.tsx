'use client';

import { useEffect, useRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Textarea que cresce com o conteúdo, até um teto.
 *
 * No diário o texto é escrito de uma vez no fim do dia: uma caixa de altura fixa
 * rolando por dentro esconde o que já foi escrito justamente enquanto se escreve.
 * O teto existe para o campo não empurrar o resto da página para fora da tela.
 */
export function AutoTextarea({
  value,
  className,
  minRows = 3,
  maxRows = 24,
  ...props
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> & {
  minRows?: number;
  maxRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Zerar antes de medir: scrollHeight nunca encolhe sozinho ao apagar texto.
    node.style.height = 'auto';

    const styles = window.getComputedStyle(node);
    const lineHeight = parseFloat(styles.lineHeight) || 24;
    const padding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);

    const min = lineHeight * minRows + padding;
    const max = lineHeight * maxRows + padding;

    node.style.height = `${Math.min(Math.max(node.scrollHeight, min), max)}px`;
    node.style.overflowY = node.scrollHeight > max ? 'auto' : 'hidden';
  }, [value, minRows, maxRows]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={minRows}
      className={cn('scroll-area resize-none', className)}
      {...props}
    />
  );
}
