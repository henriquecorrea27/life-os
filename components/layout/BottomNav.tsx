'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isActivePath, NAV_ITEMS } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function BottomNav({ onNewTask }: { onNewTask: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <motion.button
        type="button"
        onClick={onNewTask}
        whileTap={{ scale: 0.92 }}
        aria-label="Nova tarefa"
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-5 z-40 grid h-14 w-14 place-items-center rounded-2xl bg-accent text-white shadow-float transition-colors hover:bg-accent-hover dark:text-[#111114] md:hidden"
      >
        <Plus size={22} />
      </motion.button>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-surface/85 backdrop-blur-xl md:hidden">
        <ul className="flex items-stretch pb-[env(safe-area-inset-bottom)]">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href, item.exact);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                    active ? 'text-accent' : 'text-content-tertiary',
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="bottom-nav-active"
                      transition={{ type: 'spring', stiffness: 460, damping: 38 }}
                      className="absolute inset-x-4 top-0 h-[2px] rounded-full bg-accent"
                    />
                  ) : null}
                  <item.icon size={19} strokeWidth={active ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
