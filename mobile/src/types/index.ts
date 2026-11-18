// ─── Entidades ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  nome: string;
  email: string;
  tipo: 'aluno' | 'personal';
  criadoEm: string;

  // Dados do personal (preenchidos quando tipo='personal')
  formacao: string[];
  servicos: string[];
  especializacao: string[];
  precoHora: string;
  disponibilidade: string;
  bio: string;
  certificacoes: string[];

  // Localização (personal)
  uf: string;
  cidade: string;
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
  uf?: string;
  cidade?: string;
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

export interface PersonalActivateInput {
  formacao: string[];
  servicos: string[];
  especializacao: string[];
  precoHora: string;
  disponibilidade: string;
  bio: string;
  certificacoes: string[];
  uf: string;
  cidade: string;
}

// ─── Agendamento ─────────────────────────────────────────────────────────────

export type StatusAula = 'pendente' | 'confirmada' | 'concluida' | 'cancelada' | 'recusada';

export interface PessoaResumo {
  id: string;
  nome: string;
  email: string;
  localizacao: string;
}

export interface Aula {
  id: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:MM
  inicio: string; // ISO
  fim: string; // ISO
  duracaoMin: number;
  status: StatusAula;
  preco: number;
  observacao: string;
  motivoCancelamento: string;
  canceladoPor: '' | 'aluno' | 'personal' | 'sistema';
  criadoEm: string | null;
  respondidoEm: string | null;
  canceladoEm: string | null;
  aluno: PessoaResumo;
  personal: PessoaResumo;
  meuPapel: 'aluno' | 'personal';
  podeCancelar: boolean;
  motivoNaoCancela: string;
  podeResponder: boolean;
}

export interface HorarioDisponivel {
  horario: string;
  disponivel: boolean;
}

export interface DiaDisponivel {
  data: string;
  bloqueado: boolean;
  horarios: HorarioDisponivel[];
}

export interface DisponibilidadePersonal {
  personalId: string;
  inicio: string;
  fim: string;
  duracaoMin: number;
  maxDias: number;
  configurada: boolean;
  dias: DiaDisponivel[];
}

export interface DiaAgenda {
  diaSemana: number; // 0 = domingo
  horarios: string[];
}

export interface MinhaDisponibilidade {
  configurada: boolean;
  semana: DiaAgenda[];
  datasBloqueadas: string[];
  horariosPossiveis: string[];
  duracaoMin: number;
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface Conversa {
  id: string;
  meuPapel: 'aluno' | 'personal';
  outro: { id: string; nome: string; tipo: 'aluno' | 'personal' };
  ultimaMensagem: { texto: string; remetenteId: string; criadaEm: string } | null;
  ultimaAtividade: string | null;
  naoLidas: number;
}

export interface Mensagem {
  id: string;
  conversaId: string;
  remetenteId: string;
  texto: string;
  criadaEm: string;
}
