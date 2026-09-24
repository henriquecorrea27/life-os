'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { TaskDTO } from '@/lib/types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: TaskDTO[];
  onToggle: (task: TaskDTO, completed: boolean) => void;
  onEdit: (task: TaskDTO) => void;
  onDelete: (task: TaskDTO) => void;
  onToggleFocus?: (task: TaskDTO) => void;
  onMiss?: (task: TaskDTO) => void;
  onToggleSubtask?: (task: TaskDTO, subtaskId: string) => void;
  onReorder?: (ids: string[]) => void;
  showCategory?: boolean;
}

function SortableTask({
  task,
  ...handlers
}: { task: TaskDTO } & Omit<TaskListProps, 'tasks' | 'onReorder'>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? 'relative z-10' : undefined}
    >
      <TaskItem
        task={task}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        {...handlers}
      />
    </div>
  );
}

export function TaskList({ tasks, onReorder, ...handlers }: TaskListProps) {
  const [items, setItems] = useState(tasks);

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!onReorder) {
    return (
      <div role="list" className="flex flex-col gap-0.5">
        <AnimatePresence initial={false}>
          {items.map((task) => (
            <TaskItem key={task.id} task={task} {...handlers} />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((task) => task.id === active.id);
    const newIndex = items.findIndex((task) => task.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    onReorder(next.map((task) => task.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div role="list" className="flex flex-col gap-0.5">
          <AnimatePresence initial={false}>
            {items.map((task) => (
              <SortableTask key={task.id} task={task} {...handlers} />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
}
