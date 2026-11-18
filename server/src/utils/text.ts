/** Chave para comparar textos ignorando maiúsculas, acentos e espaços extras. */
export function textKey(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Padroniza uma tag (especialidade, serviço...):
 * "  hIPERTROFIA  " -> "Hipertrofia"
 */
export function normalizeTag(text: string): string {
  const clean = text.trim().replace(/\s+/g, ' ').toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/** Normaliza e remove duplicadas (comparação sem caixa/acentos). */
export function normalizeTags(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const tag = normalizeTag(item);
    const key = textKey(tag);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

/**
 * Converte o preço digitado em número.
 * Aceita "120", "120,50", "R$ 120.50", "1.200,00".
 * Retorna NaN se não for um número válido.
 */
export function parsePreco(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw !== 'string') return NaN;

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
