import { api } from './api';
import { API_CONFIG } from '../configs/api.config';
import { Conversa, Mensagem } from '../types';

const E = API_CONFIG.ENDPOINTS;
const conversaUrl = (id: string) => `${E.CONVERSAS}/${encodeURIComponent(id)}`;

export const chatService = {
  async listarConversas() {
    const res = await api.get<{ conversas: Conversa[] }>(E.CONVERSAS, true);
    return res.conversas ?? [];
  },

  /** Aluno abre (ou retoma) conversa com um personal. */
  async abrirComPersonal(personalId: string) {
    const res = await api.post<{ conversa: Conversa }>(E.CONVERSAS, { personalId }, true);
    return res.conversa;
  },

  /** Personal abre (ou retoma) conversa com um aluno que agendou com ele. */
  async abrirComAluno(alunoId: string) {
    const res = await api.post<{ conversa: Conversa }>(E.CONVERSAS, { alunoId }, true);
    return res.conversa;
  },

  async obter(id: string) {
    const res = await api.get<{ conversa: Conversa }>(conversaUrl(id), true);
    return res.conversa;
  },

  /** Mensagens em ordem cronológica. `antes` = ISO da mais antiga já carregada (paginação). */
  mensagens(id: string, antes?: string) {
    const qs = antes ? `?antes=${encodeURIComponent(antes)}` : '';
    return api.get<{ mensagens: Mensagem[]; temMais: boolean }>(`${conversaUrl(id)}/mensagens${qs}`, true);
  },

  async enviar(id: string, texto: string) {
    const res = await api.post<{ mensagem: Mensagem }>(`${conversaUrl(id)}/mensagens`, { texto }, true);
    return res.mensagem;
  },

  async marcarLida(id: string) {
    await api.post<unknown>(`${conversaUrl(id)}/lida`, {}, true);
  },

  async naoLidas() {
    const res = await api.get<{ total: number }>(E.NAO_LIDAS, true);
    return res.total ?? 0;
  },
};
