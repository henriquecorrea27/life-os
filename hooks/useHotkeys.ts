'use client';

import { useEffect } from 'react';

type Handler = (event: KeyboardEvent) => void;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
}

/**
 * combo aceita "mod+k", "shift+n", "n" ou "escape" — mod é Cmd no Mac e Ctrl no resto.
 * Atalhos sem modificador são ignorados enquanto o foco está num campo de texto,
 * para não roubar a digitação do quick-add.
 */
export function useHotkey(combo: string, handler: Handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const parts = combo.toLowerCase().split('+');
    const key = parts[parts.length - 1];
    const needsMod = parts.includes('mod');
    const needsShift = parts.includes('shift');
    const needsAlt = parts.includes('alt');

    const listener = (event: KeyboardEvent) => {
      const pressedMod = event.metaKey || event.ctrlKey;
      if (needsMod !== pressedMod) return;
      if (needsShift !== event.shiftKey) return;
      if (needsAlt !== event.altKey) return;
      if (event.key.toLowerCase() !== key) return;
      if (!needsMod && key !== 'escape' && isEditableTarget(event.target)) return;

      handler(event);
    };

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [combo, handler, enabled]);
}
