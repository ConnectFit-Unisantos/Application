import { Types } from 'mongoose';

import { Conversa } from '../models/Conversa';
import { Mensagem } from '../models/Mensagem';
import { User } from '../models/User';
import { httpError } from '../utils/user';
import { existeAulaEntre } from './agendamento.service';
import { emitToUser } from './realtime';

type PessoaPop = { _id: Types.ObjectId; nome: string; tipo: string };

type ConversaPop = {
  _id: Types.ObjectId;
  aluno: PessoaPop;
  personal: PessoaPop;
  ultimaMensagem?: { texto?: string | null; remetente?: Types.ObjectId | null; criadaEm?: Date | null } | null;
  ultimaAtividade?: Date | null;
  naoLidasAluno?: number | null;
  naoLidasPersonal?: number | null;
};

type MensagemLean = {
  _id: Types.ObjectId;
  conversa: Types.ObjectId;
  remetente: Types.ObjectId;
  texto: string;
  criadaEm: Date;
};

// ─── DTOs ────────────────────────────────────────────────────────────────────

function papelNa(conversa: ConversaPop, userId: string): 'aluno' | 'personal' | null {
  if (String(conversa.aluno?._id) === userId) return 'aluno';
  if (String(conversa.personal?._id) === userId) return 'personal';
  return null;
}

export function toConversaDTO(c: ConversaPop, viewerId: string) {
  const papel = papelNa(c, viewerId);
  const outro = papel === 'aluno' ? c.personal : c.aluno;
  const ultima = c.ultimaMensagem?.criadaEm
    ? {
        texto: c.ultimaMensagem.texto ?? '',
        remetenteId: c.ultimaMensagem.remetente ? String(c.ultimaMensagem.remetente) : '',
        criadaEm: c.ultimaMensagem.criadaEm,
      }
    : null;

  return {
    id: String(c._id),
    meuPapel: papel,
    outro: {
      id: String(outro._id),
      nome: outro.nome,
      tipo: papel === 'aluno' ? 'personal' : 'aluno',
    },
    ultimaMensagem: ultima,
    ultimaAtividade: c.ultimaAtividade ?? null,
    naoLidas: (papel === 'aluno' ? c.naoLidasAluno : c.naoLidasPersonal) ?? 0,
  };
}

export function toMensagemDTO(m: MensagemLean) {
  return {
    id: String(m._id),
    conversaId: String(m.conversa),
    remetenteId: String(m.remetente),
    texto: m.texto,
    criadaEm: m.criadaEm,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function carregarConversa(id: string | Types.ObjectId) {
  const c = await Conversa.findById(id)
    .populate('aluno', 'nome tipo')
    .populate('personal', 'nome tipo')
    .lean();
  return c as unknown as ConversaPop | null;
}

/** Garante que o usuário participa da conversa; caso contrário, 404 (não revela que existe). */
async function conversaDoParticipante(conversaId: string, userId: string) {
  if (!Types.ObjectId.isValid(conversaId)) throw httpError(404, 'Conversa não encontrada');
  const c = await carregarConversa(conversaId);
  if (!c || !c.aluno || !c.personal) throw httpError(404, 'Conversa não encontrada');
  const papel = papelNa(c, userId);
  if (!papel) throw httpError(404, 'Conversa não encontrada');
  return { conversa: c, papel };
}

// ─── Casos de uso ────────────────────────────────────────────────────────────

export async function listarConversas(userId: string) {
  const uid = new Types.ObjectId(userId);
  const conversas = await Conversa.find({ $or: [{ aluno: uid }, { personal: uid }] })
    .sort({ ultimaAtividade: -1 })
    .limit(200)
    .populate('aluno', 'nome tipo')
    .populate('personal', 'nome tipo')
    .lean();

  return (conversas as unknown as ConversaPop[])
    .filter((c) => c.aluno && c.personal) // ignora conversas com usuário apagado
    .map((c) => toConversaDTO(c, userId));
}

/**
 * Abre (ou reaproveita) a conversa entre aluno e personal.
 * - Aluno inicia com qualquer personal.
 * - Personal só inicia com um aluno que já agendou com ele.
 */
export async function abrirConversa(
  userId: string,
  tipo: 'aluno' | 'personal',
  input: { personalId?: string; alunoId?: string },
) {
  let alunoId: string;
  let personalId: string;

  if (tipo === 'aluno') {
    if (!input.personalId) throw httpError(400, 'Informe o personal');
    alunoId = userId;
    personalId = input.personalId;
  } else {
    if (!input.alunoId) throw httpError(400, 'Informe o aluno');
    alunoId = input.alunoId;
    personalId = userId;
  }

  if (!Types.ObjectId.isValid(alunoId) || !Types.ObjectId.isValid(personalId)) {
    throw httpError(404, 'Usuário não encontrado');
  }
  if (alunoId === personalId) throw httpError(400, 'Você não pode conversar consigo mesmo');

  const [aluno, personal] = await Promise.all([
    User.findById(alunoId).select('tipo').lean(),
    User.findById(personalId).select('tipo').lean(),
  ]);
  if (!personal || personal.tipo !== 'personal') throw httpError(404, 'Personal não encontrado');
  if (!aluno) throw httpError(404, 'Aluno não encontrado');

  const existente = await Conversa.findOne({ aluno: alunoId, personal: personalId }).select('_id').lean();

  if (!existente && tipo === 'personal' && !(await existeAulaEntre(alunoId, personalId))) {
    throw httpError(403, 'Você só pode iniciar conversa com alunos que agendaram aulas com você');
  }

  let id = existente?._id;
  if (!id) {
    try {
      const nova = await Conversa.create({ aluno: alunoId, personal: personalId, ultimaAtividade: new Date() });
      id = nova._id;
    } catch (err) {
      // Duas requisições simultâneas: a outra criou primeiro
      if ((err as { code?: number })?.code !== 11000) throw err;
      const c = await Conversa.findOne({ aluno: alunoId, personal: personalId }).select('_id').lean();
      id = c?._id;
    }
  }

  const conversa = await carregarConversa(id!);
  if (!conversa) throw httpError(500, 'Erro ao abrir conversa');
  return toConversaDTO(conversa, userId);
}

export async function obterConversa(conversaId: string, userId: string) {
  const { conversa } = await conversaDoParticipante(conversaId, userId);
  return toConversaDTO(conversa, userId);
}

export async function listarMensagens(
  conversaId: string,
  userId: string,
  opts: { antes?: string; limite?: number },
) {
  const { conversa, papel } = await conversaDoParticipante(conversaId, userId);

  const limite = Math.min(Math.max(Number(opts.limite) || 50, 1), 100);
  const filtro: Record<string, unknown> = { conversa: conversa._id };
  if (opts.antes) {
    const d = new Date(opts.antes);
    if (!Number.isNaN(d.getTime())) filtro.criadaEm = { $lt: d };
  }

  // Busca as mais recentes e devolve em ordem cronológica
  const msgs = (await Mensagem.find(filtro).sort({ criadaEm: -1 }).limit(limite + 1).lean()) as unknown as MensagemLean[];
  const temMais = msgs.length > limite;
  const pagina = msgs.slice(0, limite).reverse();

  // Abrir a conversa marca como lida para quem está lendo
  if (!opts.antes) await marcarComoLida(conversaId, userId, papel);

  return { mensagens: pagina.map(toMensagemDTO), temMais };
}

export async function marcarComoLida(conversaId: string, userId: string, papelConhecido?: 'aluno' | 'personal') {
  const papel = papelConhecido ?? (await conversaDoParticipante(conversaId, userId)).papel;
  const campo = papel === 'aluno' ? 'naoLidasAluno' : 'naoLidasPersonal';

  const antes = await Conversa.findOneAndUpdate(
    { _id: conversaId, [campo]: { $gt: 0 } },
    { $set: { [campo]: 0 } },
  );

  if (antes) {
    const c = await carregarConversa(conversaId);
    if (c) emitToUser(userId, 'conversa:atualizada', toConversaDTO(c, userId));
  }
}

export async function enviarMensagem(conversaId: string, userId: string, texto: string) {
  const { conversa, papel } = await conversaDoParticipante(conversaId, userId);
  const destinatarioId = String(papel === 'aluno' ? conversa.personal._id : conversa.aluno._id);

  const criada = await Mensagem.create({ conversa: conversa._id, remetente: userId, texto });
  const mensagem = toMensagemDTO(criada.toObject() as unknown as MensagemLean);

  const campoDestinatario = papel === 'aluno' ? 'naoLidasPersonal' : 'naoLidasAluno';
  await Conversa.updateOne(
    { _id: conversa._id },
    {
      $set: {
        ultimaMensagem: { texto, remetente: new Types.ObjectId(userId), criadaEm: mensagem.criadaEm },
        ultimaAtividade: mensagem.criadaEm,
      },
      $inc: { [campoDestinatario]: 1 },
    },
  );

  // Tempo real: mensagem + conversa atualizada para os dois participantes
  const atualizada = await carregarConversa(conversa._id);
  for (const uid of [userId, destinatarioId]) {
    emitToUser(uid, 'mensagem:nova', { conversaId: String(conversa._id), mensagem });
    if (atualizada) emitToUser(uid, 'conversa:atualizada', toConversaDTO(atualizada, uid));
  }

  return mensagem;
}

export async function totalNaoLidas(userId: string) {
  const uid = new Types.ObjectId(userId);
  const [r] = await Conversa.aggregate<{ total: number }>([
    { $match: { $or: [{ aluno: uid }, { personal: uid }] } },
    {
      $group: {
        _id: null,
        total: { $sum: { $cond: [{ $eq: ['$aluno', uid] }, '$naoLidasAluno', '$naoLidasPersonal'] } },
      },
    },
  ]);
  return r?.total ?? 0;
}
