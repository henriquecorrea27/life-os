'use client';

import { Modal } from '@/components/ui/Modal';

/**
 * Lista dos atalhos que existem de fato. Se um atalho for adicionado ou removido
 * no código, esta lista precisa acompanhar — uma ajuda que mente é pior que
 * nenhuma ajuda.
 */
const GROUPS: { title: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: 'Em qualquer tela',
    items: [
      { keys: ['⌘', 'K'], label: 'Buscar tarefas e diário (Ctrl+K no Windows)' },
      { keys: ['N'], label: 'Focar o campo de adicionar tarefa' },
      { keys: ['⇧', 'N'], label: 'Abrir o formulário completo de nova tarefa' },
      { keys: ['?'], label: 'Abrir esta ajuda' },
      { keys: ['Esc'], label: 'Fechar o que estiver aberto' },
    ],
  },
  {
    title: 'Na busca (⌘K)',
    items: [
      { keys: ['↑', '↓'], label: 'Navegar pelos resultados' },
      { keys: ['↵'], label: 'Abrir o resultado selecionado' },
    ],
  },
  {
    title: 'No formulário de tarefa',
    items: [{ keys: ['⌘', '↵'], label: 'Salvar sem tirar a mão do teclado' }],
  },
];

function Key({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md border border-border bg-surface-secondary px-1.5 text-micro font-medium text-content-secondary">
      {children}
    </kbd>
  );
}

export function ShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Atalhos de teclado"
      description="Atalhos sem ⌘ ficam desligados enquanto você digita num campo de texto."
    >
      <div className="flex flex-col gap-5">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="mb-2 text-micro font-medium uppercase tracking-wide text-content-tertiary">
              {group.title}
            </h3>
            <ul className="flex flex-col">
              {group.items.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between gap-4 border-b border-border/50 py-2 last:border-0"
                >
                  <span className="min-w-0 text-meta text-content-secondary">{item.label}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    {item.keys.map((key) => (
                      <Key key={key}>{key}</Key>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
