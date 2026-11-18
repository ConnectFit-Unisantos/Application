import { TZ_OFFSET_MIN } from '../config/agenda';

export const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;
export const HORARIO_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** "2026-11-20" válido de verdade (rejeita 2026-02-30). */
export function isDataValida(data: string): boolean {
  if (!DATA_RE.test(data)) return false;
  const d = new Date(`${data}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === data;
}

/** Data de hoje (YYYY-MM-DD) no fuso do app. */
export function hojeStr(now: Date = new Date()): string {
  return new Date(now.getTime() + TZ_OFFSET_MIN * 60_000).toISOString().slice(0, 10);
}

export function addDias(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** 0 = domingo ... 6 = sábado */
export function diaSemana(data: string): number {
  return new Date(`${data}T00:00:00Z`).getUTCDay();
}

/** Instante (UTC) em que começa uma aula marcada para data + horário no fuso do app. */
export function inicioDaAula(data: string, horario: string): Date {
  const [h, m] = horario.split(':').map(Number);
  const base = Date.parse(`${data}T00:00:00Z`);
  return new Date(base + (h * 60 + m - TZ_OFFSET_MIN) * 60_000);
}
