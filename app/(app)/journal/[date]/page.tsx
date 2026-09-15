import { notFound } from 'next/navigation';
import { JournalEditor } from '@/components/journal/JournalEditor';
import { PageShell } from '@/components/layout/PageShell';
import { capitalize, formatLong, isValidDateKey, todayKey } from '@/lib/dates';

export default async function JournalDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidDateKey(date)) notFound();

  const isToday = date === todayKey();

  return (
    <PageShell
      title={isToday ? 'Hoje' : capitalize(formatLong(date))}
      subtitle={isToday ? capitalize(formatLong(date)) : 'Entrada do diário'}
    >
      <JournalEditor date={date} />
    </PageShell>
  );
}
