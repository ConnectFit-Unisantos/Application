// ─── Entidades ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  nome: string;
  email: string;
  tipo: 'aluno' | 'personal';
  criadoEm: string;
}

export interface Review {
  id: string;
  nome: string;
  nota: number;
  tempo: string;
  texto: string;
}

export interface Trainer {
  id: string;
  nome: string;
  localizacao: string;
  especialidades: string[];
  avaliacao: number;
  avaliacoes: number;
  preco: number;
  certificado: boolean;
  foto?: string;
  bio?: string;
  experiencia?: number;
  disponibilidade?: string[];
  avaliacoesRecentes?: Review[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginInput {
  email: string;
  senha: string;
}

export interface RegisterInput {
  nome: string;
  email: string;
  senha: string;
}
