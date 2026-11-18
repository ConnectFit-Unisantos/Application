import { Types } from 'mongoose';

import {
  ANTECEDENCIA_MIN_MINUTOS,
  DURACAO_AULA_MIN,
  HORARIOS_PADRAO,
  HORARIOS_POSSIVEIS,
  MAX_DIAS_ANTECEDENCIA,
} from '../config/agenda';
import { Aula } from '../models/Aula';
import { User } from '../models/User';
import { addDias, diaSemana, hojeStr, inicioDaAula, isDataValida } from '../utils/datas';
import { textKey } from '../utils/text';
import { httpError } from '../utils/user';

export const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const CHAVES_DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const NOMES_COMPLETOS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

type FonteAgenda = {
  agendaConfigurada?: boolean | null;
  agenda?: ReadonlyArray<{ diaSemana?: number | null; horarios?: ReadonlyArray<string> | null }> | null;
  disponibilidade?: string | null;
};

/** Aceita "segunda", "segunda-feira", "seg", "seg." (rejeita palavras como "qualquer"). */
function parseDia(token: string): number {
  const k = textKey(token).replace(/[-\s]?feira$/, '').replace(/\.$/, '').trim();
  const full = NOMES_COMPLETOS.indexOf(k);
  return full >= 0 ? full : CHAVES_DIAS.indexOf(k);
}

/** "Segunda, Quarta e Sexta" / "Segunda a Sexta" -> [1,3,5] / [1,2,3,4,5] */
export function parseDiasTexto(texto: string): number[] {
  const dias = new Set<number>();
  for (const parte of texto.split(/[,;/]|\s+e\s+/i)) {
    const p = parte.trim();
    if (!p) continue;

    const faixa = p.match(/^(.+?)\s+(?:a|até|ate)\s+(.+)$/i);
    if (faixa) {
      const a = parseDia(faixa[1]);
      const b = parseDia(faixa[2]);
      if (a >= 0 && b >= 0) {
        for (let i = a; ; i = (i + 1) % 7) {
          dias.add(i);
          if (i === b) break;
        }
      }
      continue;
    }

    const d = parseDia(p);
    if (d >= 0) dias.add(d);
  }
  return [...dias].sort((x, y) => x - y);
}

/**
 * Horários por dia da semana (índice 0..6).
 * Se o personal ainda não configurou a agenda, usa os dias informados no
 * onboarding (campo `disponibilidade`) com os horários padrão.
 */
export function horariosSemanais(user: FonteAgenda): string[][] {
  const semana: string[][] = [[], [], [], [], [], [], []];

  if (user.agendaConfigurada) {
    for (const d of user.agenda ?? []) {
      const dia = Number(d.diaSemana);
      if (dia >= 0 && dia <= 6) semana[dia] = [...(d.horarios ?? [])].sort();
    }
    return semana;
  }

  for (const dia of parseDiasTexto(user.disponibilidade ?? '')) {
    semana[dia] = [...HORARIOS_PADRAO];
  }
  return semana;
}

export function diasAtendimentoTexto(semana: string[][]): string {
  return semana
    .map((h, i) => (h.length ? NOMES_DIAS[i] : null))
    .filter(Boolean)
    .join(', ');
}

export function diasAtendimentoLista(semana: string[][]): string[] {
  return semana.map((h, i) => (h.length ? NOMES_DIAS[i] : '')).filter(Boolean);
}

/** Verifica se um horário específico está liberado (sem olhar ocupação). */
export function horarioNaAgenda(
  user: FonteAgenda & { datasBloqueadas?: ReadonlyArray<string> | null },
  data: string,
  horario: string,
): { ok: true } | { ok: false; motivo: string } {
  const hoje = hojeStr();
  if (data < hoje) return { ok: false, motivo: 'Não é possível agendar em datas passadas' };
  if (data > addDias(hoje, MAX_DIAS_ANTECEDENCIA)) {
    return {
      ok: false,
      motivo: `Agendamentos só podem ser feitos com até ${MAX_DIAS_ANTECEDENCIA} dias de antecedência`,
    };
  }
  if ((user.datasBloqueadas ?? []).includes(data)) {
    return { ok: false, motivo: 'O personal não atende nesta data' };
  }
  const semana = horariosSemanais(user);
  if (!semana[diaSemana(data)].includes(horario)) {
    return { ok: false, motivo: 'Este horário não está disponível na agenda do personal' };
  }
  if (inicioDaAula(data, horario).getTime() <= Date.now() + ANTECEDENCIA_MIN_MINUTOS * 60_000) {
    return {
      ok: false,
      motivo: `Escolha um horário com pelo menos ${ANTECEDENCIA_MIN_MINUTOS} minutos de antecedência`,
    };
  }
  return { ok: true };
}

/** Disponibilidade pública de um personal para um intervalo de datas. */
export async function getDisponibilidadePersonal(
  personalId: string,
  inicio?: string,
  fim?: string,
) {
  if (!Types.ObjectId.isValid(personalId)) throw httpError(404, 'Personal não encontrado');

  const personal = await User.findById(personalId).lean();
  if (!personal || personal.tipo !== 'personal') throw httpError(404, 'Personal não encontrado');

  const hoje = hojeStr();
  const limite = addDias(hoje, MAX_DIAS_ANTECEDENCIA);

  let ini = inicio && isDataValida(inicio) ? inicio : hoje;
  if (ini < hoje) ini = hoje;
  let f = fim && isDataValida(fim) ? fim : addDias(ini, 41);
  if (f > limite) f = limite;
  if (f > addDias(ini, 62)) f = addDias(ini, 62);

  const semana = horariosSemanais(personal);
  const base = {
    personalId,
    inicio: ini,
    fim: f,
    duracaoMin: DURACAO_AULA_MIN,
    maxDias: MAX_DIAS_ANTECEDENCIA,
    configurada: semana.some((h) => h.length > 0),
  };

  if (ini > f) return { ...base, dias: [] };

  const ocupadas = await Aula.find({
    personal: personalId,
    ocupaHorario: true,
    data: { $gte: ini, $lte: f },
  })
    .select('data horario')
    .lean();

  const ocupado = new Set(ocupadas.map((a) => `${a.data} ${a.horario}`));
  const bloqueadas = new Set(personal.datasBloqueadas ?? []);
  const minimo = Date.now() + ANTECEDENCIA_MIN_MINUTOS * 60_000;

  const dias: Array<{
    data: string;
    bloqueado: boolean;
    horarios: Array<{ horario: string; disponivel: boolean }>;
  }> = [];

  for (let d = ini; d <= f; d = addDias(d, 1)) {
    if (bloqueadas.has(d)) {
      dias.push({ data: d, bloqueado: true, horarios: [] });
      continue;
    }
    const horarios = semana[diaSemana(d)]
      // horários que já passaram (ou sem antecedência mínima) nem aparecem
      .filter((h) => inicioDaAula(d, h).getTime() > minimo)
      .map((h) => ({ horario: h, disponivel: !ocupado.has(`${d} ${h}`) }));
    dias.push({ data: d, bloqueado: false, horarios });
  }

  return { ...base, dias };
}

/** Agenda do próprio personal (tela "Disponibilidade"). */
export async function getMinhaDisponibilidade(personalId: string) {
  const user = await User.findById(personalId).lean();
  if (!user) throw httpError(404, 'Usuário não encontrado');

  const semana = horariosSemanais(user);
  const hoje = hojeStr();

  return {
    configurada: !!user.agendaConfigurada,
    semana: semana.map((horarios, diaSemana) => ({ diaSemana, horarios })),
    datasBloqueadas: (user.datasBloqueadas ?? []).filter((d) => d >= hoje).sort(),
    horariosPossiveis: HORARIOS_POSSIVEIS,
    duracaoMin: DURACAO_AULA_MIN,
  };
}

export async function salvarMinhaDisponibilidade(
  personalId: string,
  input: { semana: Array<{ diaSemana: number; horarios: string[] }>; datasBloqueadas: string[] },
) {
  const user = await User.findById(personalId);
  if (!user) throw httpError(404, 'Usuário não encontrado');

  const porDia: string[][] = [[], [], [], [], [], [], []];
  for (const d of input.semana) {
    porDia[d.diaSemana] = [...new Set(d.horarios)].sort();
  }

  const hoje = hojeStr();
  user.set(
    'agenda',
    porDia
      .map((horarios, diaSemana) => ({ diaSemana, horarios }))
      .filter((d) => d.horarios.length > 0),
  );
  user.agendaConfigurada = true;
  user.datasBloqueadas = [...new Set(input.datasBloqueadas)].filter((d) => d >= hoje).sort();
  // Mantém o texto exibido no perfil público em sincronia
  user.disponibilidade = diasAtendimentoTexto(porDia);

  await user.save();
  return getMinhaDisponibilidade(personalId);
}
