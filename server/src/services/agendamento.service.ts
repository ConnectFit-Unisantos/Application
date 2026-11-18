import { Types } from 'mongoose';

import { CANCELAMENTO_MIN_HORAS, DURACAO_AULA_MIN } from '../config/agenda';
import { Aula, type StatusAula } from '../models/Aula';
import { User } from '../models/User';
import { inicioDaAula } from '../utils/datas';
import { parsePreco } from '../utils/text';
import { httpError } from '../utils/user';
import { horarioNaAgenda } from './disponibilidade.service';
import { emitToUser } from './realtime';

type Papel = 'aluno' | 'personal';

type PessoaPop = {
  _id: Types.ObjectId;
  nome: string;
  email: string;
  cidade?: string | null;
  uf?: string | null;
};

type AulaPop = {
  _id: Types.ObjectId;
  aluno: PessoaPop;
  personal: PessoaPop;
  data: string;
  horario: string;
  inicio: Date;
  fim: Date;
  duracaoMin?: number | null;
  status: StatusAula;
  preco?: number | null;
  observacao?: string | null;
  motivoCancelamento?: string | null;
  canceladoPor?: string | null;
  respondidoEm?: Date | null;
  canceladoEm?: Date | null;
  criadoEm?: Date | null;
};

const CAMPOS_ALUNO = 'nome email';
const CAMPOS_PERSONAL = 'nome email cidade uf';

// ─── Regras ──────────────────────────────────────────────────────────────────

function regras(aula: Pick<AulaPop, 'status' | 'inicio'>, papel: Papel) {
  const msAteInicio = new Date(aula.inicio).getTime() - Date.now();
  const futura = msAteInicio > 0;
  const prazoAluno = msAteInicio >= CANCELAMENTO_MIN_HORAS * 3_600_000;

  let podeCancelar = false;
  let motivoNaoCancela = '';

  if (!futura) {
    motivoNaoCancela = 'Esta aula já começou ou já passou';
  } else if (aula.status === 'pendente') {
    podeCancelar = papel === 'aluno';
    if (!podeCancelar) motivoNaoCancela = 'Use "Recusar" para responder a uma solicitação pendente';
  } else if (aula.status === 'confirmada') {
    podeCancelar = papel === 'personal' || prazoAluno;
    if (!podeCancelar) {
      motivoNaoCancela = `Aulas confirmadas só podem ser canceladas com pelo menos ${CANCELAMENTO_MIN_HORAS}h de antecedência`;
    }
  } else {
    motivoNaoCancela = 'Esta aula não pode mais ser cancelada';
  }

  return {
    podeCancelar,
    motivoNaoCancela,
    podeResponder: papel === 'personal' && aula.status === 'pendente' && futura,
  };
}

function pessoaDTO(p: PessoaPop) {
  return {
    id: String(p._id),
    nome: p.nome,
    email: p.email,
    localizacao: p.cidade && p.uf ? `${p.cidade} - ${p.uf}` : '',
  };
}

export function toAulaDTO(aula: AulaPop, viewerId: string) {
  const papel: Papel = String(aula.aluno._id) === viewerId ? 'aluno' : 'personal';
  const r = regras(aula, papel);

  return {
    id: String(aula._id),
    data: aula.data,
    horario: aula.horario,
    inicio: aula.inicio,
    fim: aula.fim,
    duracaoMin: aula.duracaoMin ?? DURACAO_AULA_MIN,
    status: aula.status,
    preco: aula.preco ?? 0,
    observacao: aula.observacao ?? '',
    motivoCancelamento: aula.motivoCancelamento ?? '',
    canceladoPor: aula.canceladoPor ?? '',
    criadoEm: aula.criadoEm ?? null,
    respondidoEm: aula.respondidoEm ?? null,
    canceladoEm: aula.canceladoEm ?? null,
    aluno: pessoaDTO(aula.aluno),
    personal: pessoaDTO(aula.personal),
    meuPapel: papel,
    podeCancelar: r.podeCancelar,
    motivoNaoCancela: r.motivoNaoCancela,
    podeResponder: r.podeResponder,
  };
}

export type AulaDTO = ReturnType<typeof toAulaDTO>;

async function carregar(id: string | Types.ObjectId): Promise<AulaPop | null> {
  const aula = await Aula.findById(id)
    .populate('aluno', CAMPOS_ALUNO)
    .populate('personal', CAMPOS_PERSONAL)
    .lean();
  return aula as unknown as AulaPop | null;
}

/** Envia a versão atualizada da aula para aluno e personal (tempo real). */
function notificar(aula: AulaPop) {
  emitToUser(String(aula.aluno._id), 'agendamento:atualizado', toAulaDTO(aula, String(aula.aluno._id)));
  emitToUser(
    String(aula.personal._id),
    'agendamento:atualizado',
    toAulaDTO(aula, String(aula.personal._id)),
  );
}

/**
 * Atualiza status pelo tempo:
 * - pendente que chegou no horário sem resposta -> cancelada (sistema)
 * - confirmada cujo horário terminou -> concluída
 */
export async function atualizarExpiradas(filtro: Record<string, unknown> = {}) {
  const agora = new Date();
  await Aula.updateMany(
    { ...filtro, status: 'pendente', inicio: { $lte: agora } },
    {
      $set: {
        status: 'cancelada',
        ocupaHorario: false,
        canceladoPor: 'sistema',
        motivoCancelamento: 'Solicitação não foi confirmada antes do horário da aula',
        canceladoEm: agora,
      },
    },
  );
  await Aula.updateMany(
    { ...filtro, status: 'confirmada', fim: { $lte: agora } },
    { $set: { status: 'concluida' } },
  );
}

function validarId(id: string) {
  if (!Types.ObjectId.isValid(id)) throw httpError(404, 'Aula não encontrada');
}

function participante(aula: AulaPop, userId: string): Papel | null {
  if (String(aula.aluno._id) === userId) return 'aluno';
  if (String(aula.personal._id) === userId) return 'personal';
  return null;
}

// ─── Casos de uso ────────────────────────────────────────────────────────────

export async function criarAgendamento(
  alunoId: string,
  input: { personalId: string; data: string; horario: string; observacao: string },
) {
  const aluno = await User.findById(alunoId).select('tipo').lean();
  if (!aluno) throw httpError(401, 'Usuário não encontrado. Faça login novamente.');
  if (aluno.tipo !== 'aluno') throw httpError(403, 'Apenas alunos podem agendar aulas');

  if (!Types.ObjectId.isValid(input.personalId)) throw httpError(404, 'Personal não encontrado');
  if (input.personalId === alunoId) throw httpError(400, 'Você não pode agendar uma aula consigo mesmo');

  const personal = await User.findById(input.personalId).lean();
  if (!personal || personal.tipo !== 'personal') throw httpError(404, 'Personal não encontrado');

  const check = horarioNaAgenda(personal, input.data, input.horario);
  if (!check.ok) throw httpError(400, check.motivo);

  const [ocupadoPersonal, ocupadoAluno] = await Promise.all([
    Aula.exists({ personal: input.personalId, data: input.data, horario: input.horario, ocupaHorario: true }),
    Aula.exists({ aluno: alunoId, data: input.data, horario: input.horario, ocupaHorario: true }),
  ]);
  if (ocupadoPersonal) throw httpError(409, 'Este horário acabou de ser reservado. Escolha outro horário.');
  if (ocupadoAluno) throw httpError(409, 'Você já tem uma aula marcada neste mesmo horário');

  const inicio = inicioDaAula(input.data, input.horario);
  const fim = new Date(inicio.getTime() + DURACAO_AULA_MIN * 60_000);
  const preco = parsePreco(personal.precoHora ?? '');

  let criada;
  try {
    criada = await Aula.create({
      aluno: alunoId,
      personal: input.personalId,
      data: input.data,
      horario: input.horario,
      inicio,
      fim,
      duracaoMin: DURACAO_AULA_MIN,
      status: 'pendente',
      ocupaHorario: true,
      preco: Number.isFinite(preco) ? preco : 0,
      observacao: input.observacao,
    });
  } catch (err) {
    // Corrida: outro agendamento entrou entre a checagem e o insert (índice único)
    if ((err as { code?: number })?.code === 11000) {
      throw httpError(409, 'Este horário acabou de ser reservado. Escolha outro horário.');
    }
    throw err;
  }

  const aula = await carregar(criada._id);
  if (!aula) throw httpError(500, 'Erro ao carregar o agendamento');
  notificar(aula);
  return toAulaDTO(aula, alunoId);
}

export async function listarAgendamentos(
  userId: string,
  papel: Papel,
  escopo: 'proximas' | 'historico' | 'todas',
) {
  const filtroDono = { [papel]: new Types.ObjectId(userId) };
  await atualizarExpiradas(filtroDono);

  const filtro: Record<string, unknown> = { ...filtroDono };
  if (escopo === 'proximas') filtro.status = { $in: ['pendente', 'confirmada'] };
  if (escopo === 'historico') filtro.status = { $in: ['concluida', 'cancelada', 'recusada'] };

  const aulas = await Aula.find(filtro)
    .sort({ inicio: escopo === 'historico' ? -1 : 1 })
    .limit(300)
    .populate('aluno', CAMPOS_ALUNO)
    .populate('personal', CAMPOS_PERSONAL)
    .lean();

  return (aulas as unknown as AulaPop[])
    .filter((a) => a.aluno && a.personal) // ignora aulas de usuários apagados
    .map((a) => toAulaDTO(a, userId));
}

export async function obterAgendamento(id: string, userId: string) {
  validarId(id);
  await atualizarExpiradas({ _id: new Types.ObjectId(id) });
  const aula = await carregar(id);
  if (!aula || !aula.aluno || !aula.personal || !participante(aula, userId)) {
    throw httpError(404, 'Aula não encontrada');
  }
  return toAulaDTO(aula, userId);
}

/** Explica por que uma transição não aconteceu. */
async function erroTransicao(id: string, userId: string): Promise<never> {
  const aula = await carregar(id);
  if (!aula || !aula.aluno || !aula.personal || !participante(aula, userId)) {
    throw httpError(404, 'Aula não encontrada');
  }
  if (new Date(aula.inicio).getTime() <= Date.now()) {
    throw httpError(409, 'Esta aula já começou ou já passou');
  }
  throw httpError(409, `Esta aula está "${aula.status}" e não pode ser alterada`);
}

export async function confirmarAgendamento(id: string, personalId: string) {
  validarId(id);
  await atualizarExpiradas({ _id: new Types.ObjectId(id) });

  const agora = new Date();
  const ok = await Aula.findOneAndUpdate(
    { _id: id, personal: personalId, status: 'pendente', inicio: { $gt: agora } },
    { $set: { status: 'confirmada', respondidoEm: agora } },
    { new: true },
  );
  if (!ok) return erroTransicao(id, personalId);

  const aula = (await carregar(id))!;
  notificar(aula);
  return toAulaDTO(aula, personalId);
}

export async function recusarAgendamento(id: string, personalId: string, motivo: string) {
  validarId(id);
  await atualizarExpiradas({ _id: new Types.ObjectId(id) });

  const agora = new Date();
  const ok = await Aula.findOneAndUpdate(
    { _id: id, personal: personalId, status: 'pendente', inicio: { $gt: agora } },
    {
      $set: {
        status: 'recusada',
        ocupaHorario: false, // libera o horário para outros alunos
        respondidoEm: agora,
        canceladoEm: agora,
        canceladoPor: 'personal',
        motivoCancelamento: motivo,
      },
    },
    { new: true },
  );
  if (!ok) return erroTransicao(id, personalId);

  const aula = (await carregar(id))!;
  notificar(aula);
  return toAulaDTO(aula, personalId);
}

export async function cancelarAgendamento(id: string, userId: string, motivo: string) {
  validarId(id);
  await atualizarExpiradas({ _id: new Types.ObjectId(id) });

  const aula = await carregar(id);
  const papel = aula && aula.aluno && aula.personal ? participante(aula, userId) : null;
  if (!aula || !papel) throw httpError(404, 'Aula não encontrada');

  const r = regras(aula, papel);
  if (!r.podeCancelar) throw httpError(409, r.motivoNaoCancela);

  const agora = new Date();
  const ok = await Aula.findOneAndUpdate(
    { _id: id, status: aula.status },
    {
      $set: {
        status: 'cancelada',
        ocupaHorario: false,
        canceladoEm: agora,
        canceladoPor: papel,
        motivoCancelamento: motivo,
      },
    },
    { new: true },
  );
  if (!ok) throw httpError(409, 'A aula foi alterada por outra pessoa. Atualize e tente novamente.');

  const atualizada = (await carregar(id))!;
  notificar(atualizada);
  return toAulaDTO(atualizada, userId);
}

/** Usado pelo chat: existe alguma aula entre os dois? */
export async function existeAulaEntre(alunoId: string, personalId: string) {
  return !!(await Aula.exists({ aluno: alunoId, personal: personalId }));
}
