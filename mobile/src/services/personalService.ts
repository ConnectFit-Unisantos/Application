import { api } from './api';

export const personalService = {
  async listPersonals() {
    // endpoint público: /api/auth/personals
    const res = await api.get<{ personals: any[] }>('/api/auth/personals');
    const personals = res.personals ?? [];

    // Garante compatibilidade com a UI (TrainerCard espera campos como foto/bio etc.)
    return personals.map((p) => ({
      id: String(p.id ?? ''),
      nome: p.nome ?? '',
      localizacao: p.localizacao ?? '',
      especialidades: Array.isArray(p.especialidades) ? p.especialidades : [],
      avaliacao: Number(p.avaliacao ?? 0),
      avaliacoes: Number(p.avaliacoes ?? 0),
      preco: Number(p.preco ?? 0),
      certificado: Boolean(p.certificado),
      foto: p.foto,
      bio: p.bio,
    }));
  },
};





