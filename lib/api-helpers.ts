import { NextResponse } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export async function readBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ data: T; error: null } | { data: null; error: ReturnType<typeof fail> }> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return { data: null, error: fail('Corpo da requisição inválido') };
  }

  try {
    return { data: schema.parse(payload), error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        data: null,
        error: fail(error.issues[0]?.message ?? 'Dados inválidos', 422, error.flatten()),
      };
    }
    return { data: null, error: fail('Dados inválidos', 422) };
  }
}

export const TASK_INCLUDE = {
  category: true,
  subtasks: { orderBy: { order: 'asc' } },
} as const;
