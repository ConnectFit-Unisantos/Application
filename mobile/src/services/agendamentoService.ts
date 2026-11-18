import { api } from './api';
import { API_CONFIG } from '../configs/api.config';
import { Aula, DisponibilidadePersonal, DiaAgenda, MinhaDisponibilidade } from '../types';

const E = API_CONFIG.ENDPOINTS;

export type EscopoAulas = 'proximas' | 'historico' | 'todas';

export const agendamentoService = {
  /** Horários livres de um personal entre duas datas (YYYY-MM-DD). Pública. */
  getDisponibilidade(personalId: string, inicio: string, fim: string) {
    const qs = `?inicio=${encodeURIComponent(inicio)}&fim=${encodeURIComponent(fim)}`;
    return api.get<DisponibilidadePersonal>(`${E.DISPONIBILIDADE_PERSONAL(personalId)}${qs}`);
  },

  async criar(input: { personalId: string; data: string; horario: string; observacao?: string }) {
    const res = await api.post<{ aula: Aula }>(E.AGENDAMENTOS, input, true);
    return res.aula;
  },

  async listar(escopo: EscopoAulas = 'todas') {
    const res = await api.get<{ aulas: Aula[] }>(`${E.AGENDAMENTOS}?escopo=${escopo}`, true);
    return res.aulas ?? [];
  },

  async obter(id: string) {
    const res = await api.get<{ aula: Aula }>(`${E.AGENDAMENTOS}/${encodeURIComponent(id)}`, true);
    return res.aula;
  },

  async confirmar(id: string) {
    const res = await api.patch<{ aula: Aula }>(`${E.AGENDAMENTOS}/${encodeURIComponent(id)}/confirmar`, {}, true);
    return res.aula;
  },

  async recusar(id: string, motivo = '') {
    const res = await api.patch<{ aula: Aula }>(
      `${E.AGENDAMENTOS}/${encodeURIComponent(id)}/recusar`,
      { motivo },
      true,
    );
    return res.aula;
  },

  async cancelar(id: string, motivo = '') {
    const res = await api.patch<{ aula: Aula }>(
      `${E.AGENDAMENTOS}/${encodeURIComponent(id)}/cancelar`,
      { motivo },
      true,
    );
    return res.aula;
  },

  // ─── Agenda do personal ────────────────────────────────────────────────────

  getMinhaDisponibilidade() {
    return api.get<MinhaDisponibilidade>(E.MINHA_DISPONIBILIDADE, true);
  },

  salvarDisponibilidade(input: { semana: DiaAgenda[]; datasBloqueadas: string[] }) {
    return api.put<MinhaDisponibilidade>(E.MINHA_DISPONIBILIDADE, input, true);
  },
};
