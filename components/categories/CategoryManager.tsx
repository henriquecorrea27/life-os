'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/useCategories';
import { CATEGORY_PALETTE } from '@/lib/constants';
import type { CategoryDTO } from '@/lib/types';
import { cn, pluralize, readableTint, withAlpha } from '@/lib/utils';
import { useToast } from '@/components/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORY_PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Usar a cor ${color}`}
          aria-pressed={value === color}
          onClick={() => onChange(color)}
          className="grid h-7 w-7 place-items-center rounded-full transition-transform hover:scale-110"
          style={{ backgroundColor: withAlpha(color, value === color ? 1 : 0.5) }}
        >
          {value === color ? <Check size={13} className="text-white" strokeWidth={3} /> : null}
        </button>
      ))}
    </div>
  );
}

function CategoryRow({ category }: { category: CategoryDTO }) {
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const { toast } = useToast();

  useEffect(() => {
    setName(category.name);
    setColor(category.color);
  }, [category.name, category.color]);

  const dirty = name.trim() !== category.name || color !== category.color;

  function save() {
    if (!name.trim() || !dirty) return;
    updateCategory.mutate(
      { id: category.id, name: name.trim(), color },
      {
        onError: (error) =>
          toast({
            message: 'Não consegui salvar a categoria',
            description: error instanceof Error ? error.message : undefined,
            tone: 'error',
          }),
      },
    );
  }

  return (
    <div className="rounded-xl border border-border/70">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <button
          type="button"
          aria-label={`Mudar a cor de ${category.name}`}
          onClick={() => setExpanded((current) => !current)}
          className="h-4 w-4 shrink-0 rounded-full transition-transform hover:scale-110"
          style={{ backgroundColor: color }}
        />

        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
          aria-label={`Nome da categoria ${category.name}`}
          className="min-w-0 flex-1 bg-transparent text-meta font-medium text-content-primary outline-none"
        />

        <span className="shrink-0 text-micro tabular-nums text-content-tertiary">
          {category.taskCount ?? 0} {pluralize(category.taskCount ?? 0, 'tarefa', 'tarefas')}
        </span>

        {confirming ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => {
                deleteCategory.mutate(category.id, {
                  onSuccess: () =>
                    toast({
                      message: 'Categoria excluída',
                      description: 'As tarefas dela ficaram sem categoria.',
                    }),
                });
              }}
              className="rounded-lg px-2 py-1 text-micro font-medium text-[#EF4444] transition-colors hover:bg-[#EF4444]/10"
            >
              Excluir
            </button>
            <IconButton size="sm" aria-label="Cancelar" onClick={() => setConfirming(false)}>
              <X size={13} />
            </IconButton>
          </div>
        ) : (
          <IconButton
            size="sm"
            aria-label={`Excluir categoria ${category.name}`}
            onClick={() => setConfirming(true)}
            className="shrink-0 hover:text-[#EF4444]"
          >
            <Trash2 size={13} />
          </IconButton>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 border-t border-border/60 px-3 py-2.5">
              <ColorPicker
                value={color}
                onChange={(next) => {
                  setColor(next);
                  updateCategory.mutate({ id: category.id, color: next });
                }}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function CategoryManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: categories } = useCategories();
  const createCategory = useCreateCategory();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_PALETTE[0]);

  useEffect(() => {
    if (!open) {
      setName('');
      setColor(CATEGORY_PALETTE[(categories?.length ?? 0) % CATEGORY_PALETTE.length]);
    }
  }, [open, categories?.length]);

  function create() {
    if (!name.trim()) return;
    createCategory.mutate(
      { name: name.trim(), color, icon: null },
      {
        onSuccess: () => {
          setName('');
          setColor(CATEGORY_PALETTE[((categories?.length ?? 0) + 1) % CATEGORY_PALETTE.length]);
        },
        onError: (error) =>
          toast({
            message: 'Não consegui criar a categoria',
            description: error instanceof Error ? error.message : undefined,
            tone: 'error',
          }),
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Categorias"
      description="Clique no ponto colorido para trocar a cor. Excluir uma categoria não apaga as tarefas dela."
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          {(categories ?? []).map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-border p-3">
          <div className="flex items-center gap-2.5">
            <span
              className="h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  create();
                }
              }}
              placeholder="Nova categoria…"
              aria-label="Nome da nova categoria"
              className="min-w-0 flex-1 bg-transparent text-meta text-content-primary outline-none placeholder:text-content-tertiary"
            />
            <button
              type="button"
              onClick={create}
              disabled={!name.trim() || createCategory.isPending}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-micro font-medium transition-colors',
                name.trim()
                  ? 'bg-accent-soft text-accent hover:bg-accent-soft'
                  : 'text-content-tertiary',
              )}
              style={name.trim() ? { color: readableTint('#6366F1', 80) } : undefined}
            >
              <Plus size={12} />
              Criar
            </button>
          </div>

          <div className="mt-3 border-t border-border/60 pt-2.5">
            <ColorPicker value={color} onChange={setColor} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
