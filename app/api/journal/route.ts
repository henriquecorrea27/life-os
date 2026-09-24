import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { ok, readBody } from '@/lib/api-helpers';
import { dateKeyToStored, isValidDateKey } from '@/lib/dates';
import { journalToDTO } from '@/lib/serialize';
import { journalEntrySchema } from '@/lib/validations/journal';
import { buildSearchText, normalizeSearch } from '@/lib/utils';
import { scheduleBackup } from '@/lib/backup';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const query = searchParams.get('q')?.trim();
  const limit = Number(searchParams.get('limit') ?? 0);

  const where: Prisma.JournalEntryWhereInput = {};

  if (from && isValidDateKey(from)) {
    where.date = { ...(where.date as object), gte: dateKeyToStored(from) };
  }
  if (to && isValidDateKey(to)) {
    where.date = { ...(where.date as object), lte: dateKeyToStored(to) };
  }
  if (query) {
    where.searchText = { contains: normalizeSearch(query) };
  }

  const entries = await prisma.journalEntry.findMany({
    where,
    orderBy: { date: 'desc' },
    take: limit > 0 ? limit : undefined,
  });

  return ok(entries.map(journalToDTO));
}

export async function POST(request: Request) {
  const { data, error } = await readBody(request, journalEntrySchema);
  if (error) return error;

  const date = dateKeyToStored(data.date);
  const payload = {
    mood: data.mood,
    summary: data.summary ?? null,
    gratitude: data.gratitude ?? null,
    improve: data.improve ?? null,
    freeText: data.freeText ?? null,
    searchText: buildSearchText(data.summary, data.gratitude, data.improve, data.freeText),
  };

  const entry = await prisma.journalEntry.upsert({
    where: { date },
    update: payload,
    create: { date, ...payload },
  });

  scheduleBackup();
  return ok(journalToDTO(entry), 201);
}
