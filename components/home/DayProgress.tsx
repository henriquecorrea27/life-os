'use client';

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { pluralize } from '@/lib/utils';

export function DayProgress({
  completed,
  total,
  streak,
}: {
  completed: number;
  total: number;
  streak?: number;
}) {
  const remaining = Math.max(total - completed, 0);
  const allDone = total > 0 && remaining === 0;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-surface px-4 py-3.5 shadow-card">
      <ProgressRing value={completed} total={total} size={52} stroke={4.5} />

      <div className="min-w-0 flex-1">
        <p className="text-section font-medium text-content-primary">
          {total === 0
            ? 'Nada marcado para hoje'
            : allDone
              ? 'Dia concluído'
              : `${remaining} ${pluralize(remaining, 'tarefa restante', 'tarefas restantes')}`}
        </p>
        <p className="mt-0.5 text-meta tabular-nums text-content-secondary">
          {total === 0 ? 'Adicione algo abaixo para começar' : `${completed} de ${total} concluídas`}
        </p>
      </div>

      {streak && streak > 1 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-surface-secondary px-2.5 py-1.5"
          title={`${streak} dias seguidos concluindo tarefas`}
        >
          <Flame size={14} className="text-[#FB923C]" />
          <span className="text-meta font-semibold tabular-nums text-content-primary">{streak}</span>
        </motion.div>
      ) : null}
    </div>
  );
}
