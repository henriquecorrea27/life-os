import { BarChart3, BookOpen, CheckCircle2, Sun } from 'lucide-react';

export const NAV_ITEMS = [
  { href: '/', label: 'Hoje', icon: Sun, exact: true },
  { href: '/tasks', label: 'Tarefas', icon: CheckCircle2, exact: false },
  { href: '/journal', label: 'Diário', icon: BookOpen, exact: false },
  { href: '/stats', label: 'Estatísticas', icon: BarChart3, exact: false },
] as const;

export function isActivePath(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
