/** Remove acentos, espaços extras e caixa — para comparações tolerantes. */
export function normalizeStr(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** "hIPERTROFIA " -> "Hipertrofia" */
export function formatTag(text: string): string {
  const clean = text.trim().replace(/\s+/g, ' ').toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Converte preço digitado em número. Aceita "120", "120,50", "R$ 120".
 * Retorna NaN se inválido.
 */
export function parsePreco(raw: string): number {
  let s = raw.replace(/[^\d.,]/g, '');
  if (!s) return NaN;
  if (s.includes(',')) {
    // formato brasileiro: ponto = milhar, vírgula = decimal ("1.200,50")
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // "1.200" = mil e duzentos (ponto como separador de milhar)
    s = s.replace(/\./g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/** 120 -> "R$ 120" · 120.5 -> "R$ 120,50" · inválido -> "R$ --" */
export function formatPreco(value: number | undefined | null): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return 'R$ --';
  if (Number.isInteger(value)) return `R$ ${value}`;
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

// ─── Datas ───────────────────────────────────────────────────────────────────

export const DIAS_SEMANA_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const DIAS_SEMANA_LONGOS = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado',
];
export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
export const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Date local -> "YYYY-MM-DD" */
export function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "YYYY-MM-DD" -> Date local (meio-dia, evita problemas de fuso) */
export function fromDateStr(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function hojeStr(): string {
  return toDateStr(new Date());
}

export function addDiasStr(str: string, dias: number): string {
  const d = fromDateStr(str);
  d.setDate(d.getDate() + dias);
  return toDateStr(d);
}

/** "Sex, 20 Nov" — com "Hoje"/"Amanhã" quando for o caso */
export function formatDataCurta(str: string, relativo = true): string {
  if (relativo) {
    const hoje = hojeStr();
    if (str === hoje) return 'Hoje';
    if (str === addDiasStr(hoje, 1)) return 'Amanhã';
    if (str === addDiasStr(hoje, -1)) return 'Ontem';
  }
  const d = fromDateStr(str);
  return `${DIAS_SEMANA_CURTOS[d.getDay()]}, ${d.getDate()} ${MESES_CURTOS[d.getMonth()]}`;
}

/** "Sexta-feira, 20 de novembro de 2026" */
export function formatDataLonga(str: string): string {
  const d = fromDateStr(str);
  return `${DIAS_SEMANA_LONGOS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

/** "18:00" + 60 -> "18:00 – 19:00" */
export function formatIntervalo(horario: string, duracaoMin: number): string {
  const [h, m] = horario.split(':').map(Number);
  const fim = h * 60 + m + duracaoMin;
  return `${horario} – ${pad(Math.floor(fim / 60) % 24)}:${pad(fim % 60)}`;
}

/** ISO -> "14:05" */
export function formatHora(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** ISO -> "18/11/2026 às 14:05" */
export function formatDataHora(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} às ${formatHora(iso)}`;
}

/** Para listas de conversa: "14:05" (hoje), "Ontem", "18/11" */
export function formatQuando(iso: string): string {
  const str = toDateStr(new Date(iso));
  const hoje = hojeStr();
  if (str === hoje) return formatHora(iso);
  if (str === addDiasStr(hoje, -1)) return 'Ontem';
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/** Separador de dia no chat: "Hoje", "Ontem", "18/11/2026" */
export function formatDiaChat(iso: string): string {
  const str = toDateStr(new Date(iso));
  const hoje = hojeStr();
  if (str === hoje) return 'Hoje';
  if (str === addDiasStr(hoje, -1)) return 'Ontem';
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  const a = partes[0][0] ?? '';
  const b = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (a + b).toUpperCase();
}
