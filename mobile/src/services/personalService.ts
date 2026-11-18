import { api } from './api';
import { API_CONFIG } from '../configs/api.config';
import { Trainer } from '../types';

export const personalService = {
  async listPersonals(): Promise<Trainer[]> {
    // endpoint público: /api/auth/personals
    const res = await api.get<{ personals: any[] }>(API_CONFIG.ENDPOINTS.PERSONALS);
    const personals = Array.isArray(res?.personals) ? res.personals : [];

    // Garante o formato esperado pela UI
    return personals.map((p) => {
      const preco = Number(p.preco);
      return {
        id: String(p.id ?? ''),
        nome: p.nome ?? '',
        localizacao: p.localizacao ?? '',
        uf: p.uf ?? '',
        cidade: p.cidade ?? '',
        especialidades: Array.isArray(p.especialidades) ? p.especialidades : [],
        avaliacao: Number(p.avaliacao) || 0,
        avaliacoes: Number(p.avaliacoes) || 0,
        preco: Number.isFinite(preco) ? preco : 0,
        certificado: Boolean(p.certificado),
        foto: p.foto,
        bio: p.bio,
        disponibilidade: Array.isArray(p.disponibilidade)
          ? p.disponibilidade
          : typeof p.disponibilidade === 'string'
            ? p.disponibilidade.split(',').map((d: string) => d.trim()).filter(Boolean)
            : [],
      };
    });
  },
};
