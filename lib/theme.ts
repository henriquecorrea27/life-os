/**
 * Chave compartilhada entre o script inline do layout (servidor) e o
 * ThemeProvider (cliente). Fica num módulo neutro de propósito: importar uma
 * constante de um arquivo 'use client' dentro de um Server Component a
 * transforma numa referência de função-cliente e quebra o script inline.
 */
export const THEME_STORAGE_KEY = 'life-os-theme';

export type Theme = 'light' | 'dark';
