'use client';

import { MoonStar } from 'lucide-react';
import { useState } from 'react';
import { useCloseDay } from '@/hooks/useTasks';
import { pluralize } from '@/lib/utils';
import { useToast } from '@/components/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

/**
 * Fecha o balanço do dia: tudo que estava previsto e ficou aberto vira "não
 * feita" e volta para amanhã. Pede confirmação porque mexe em várias tarefas de
 * uma vez e não tem desfazer em lote — o desfazer é por tarefa.
 */
export function CloseDayButton({ pending }: { pending: number }) {
  const [confirming, setConfirming] = useState(false);
  const closeDay = useCloseDay();
  const { toast } = useToast();

  if (pending === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mx-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-meta font-medium text-content-tertiary transition-colors hover:bg-surface-secondary hover:text-content-secondary"
      >
        <MoonStar size={14} />
        Fechar o dia
      </button>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        size="sm"
        title="Fechar o dia?"
        description={`${pending} ${pluralize(pending, 'tarefa prevista continua', 'tarefas previstas continuam')} em aberto.`}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={closeDay.isPending}
              onClick={() =>
                closeDay.mutate(undefined, {
                  onSuccess: (result) => {
                    setConfirming(false);
                    toast({
                      message: 'Dia fechado',
                      description: `${result.completedToday} ${pluralize(result.completedToday, 'concluída', 'concluídas')} · ${result.missed} ${pluralize(result.missed, 'não feita', 'não feitas')}`,
                    });
                  },
                  onError: (error) =>
                    toast({
                      message: 'Não consegui fechar o dia',
                      description: error instanceof Error ? error.message : undefined,
                      tone: 'error',
                    }),
                })
              }
            >
              Fechar o dia
            </Button>
          </>
        }
      >
        <p className="text-body leading-relaxed text-content-secondary">
          Elas entram na sua taxa de conclusão como não feitas hoje e voltam para amanhã.
          Você pode desfazer tarefa por tarefa depois.
        </p>
      </Modal>
    </>
  );
}
