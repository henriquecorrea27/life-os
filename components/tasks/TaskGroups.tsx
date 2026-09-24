'use client';

import { capitalize, dueState, formatDueLabel, formatLong } from '@/lib/dates';
import type { TaskDTO } from '@/lib/types';
import { TaskList } from './TaskList';

interface GroupedProps {
  tasks: TaskDTO[];
  onToggle: (task: TaskDTO, completed: boolean) => void;
  onEdit: (task: TaskDTO) => void;
  onDelete: (task: TaskDTO) => void;
  onToggleFocus?: (task: TaskDTO) => void;
  onMiss?: (task: TaskDTO) => void;
  onToggleSubtask?: (task: TaskDTO, subtaskId: string) => void;
  mode: 'due' | 'date';
}

interface Group {
  key: string;
  label: string;
  hint?: string;
  tasks: TaskDTO[];
  tone?: 'danger' | 'accent';
}

/** Agrupa por urgência (Atrasadas / Hoje / Em breve / Sem data) ou por dia. */
function buildGroups(tasks: TaskDTO[], mode: GroupedProps['mode']): Group[] {
  if (mode === 'date') {
    const map = new Map<string, TaskDTO[]>();
    for (const task of tasks) {
      const key = task.dueDate ?? 'sem-data';
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return [...map.entries()]
      .sort(([a], [b]) => (a === 'sem-data' ? 1 : b === 'sem-data' ? -1 : a.localeCompare(b)))
      .map(([key, groupTasks]) => ({
        key,
        label: key === 'sem-data' ? 'Sem data' : capitalize(formatDueLabel(key)),
        hint: key === 'sem-data' ? undefined : formatLong(key),
        tasks: groupTasks,
      }));
  }

  const overdue: TaskDTO[] = [];
  const today: TaskDTO[] = [];
  const upcoming: TaskDTO[] = [];
  const someday: TaskDTO[] = [];

  for (const task of tasks) {
    const state = dueState(task.dueDate);
    if (state === 'overdue') overdue.push(task);
    else if (state === 'today') today.push(task);
    else if (state === 'future') upcoming.push(task);
    else someday.push(task);
  }

  return [
    { key: 'overdue', label: 'Atrasadas', tasks: overdue, tone: 'danger' as const },
    { key: 'today', label: 'Hoje', tasks: today, tone: 'accent' as const },
    { key: 'upcoming', label: 'Em breve', tasks: upcoming },
    { key: 'someday', label: 'Sem data', tasks: someday },
  ].filter((group) => group.tasks.length > 0);
}

export function TaskGroups({ tasks, mode, ...handlers }: GroupedProps) {
  const groups = buildGroups(tasks, mode);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.key}>
          <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
            <h2
              className="text-meta font-medium"
              style={{
                color:
                  group.tone === 'danger'
                    ? '#EF4444'
                    : group.tone === 'accent'
                      ? 'var(--accent)'
                      : 'var(--text-secondary)',
              }}
            >
              {group.label}
            </h2>
            <span className="text-micro tabular-nums text-content-tertiary">
              {group.tasks.length}
            </span>
          </div>
          <TaskList tasks={group.tasks} {...handlers} />
        </section>
      ))}
    </div>
  );
}
