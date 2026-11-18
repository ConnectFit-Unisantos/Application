import jwt from 'jsonwebtoken';

import type { UserDocument } from '../models/User';

export type TokenPayload = {
  sub: string; // userId
  tipo: 'aluno' | 'personal';
};

export function signToken(payload: TokenPayload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');

  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';

  // Tipagem do jsonwebtoken pode variar; passamos expiresIn como any.
  return jwt.sign(payload as any, secret as any, { expiresIn: expiresIn as any });
}

/** Formato único de usuário devolvido pela API (sem senhaHash). */
export function toPublicUser(user: Pick<
  UserDocument,
  | '_id'
  | 'nome'
  | 'email'
  | 'tipo'
  | 'criadoEm'
  | 'formacao'
  | 'servicos'
  | 'especializacao'
  | 'precoHora'
  | 'disponibilidade'
  | 'bio'
  | 'certificacoes'
  | 'uf'
  | 'cidade'
>) {
  return {
    id: String(user._id),
    nome: user.nome,
    email: user.email,
    tipo: user.tipo as 'aluno' | 'personal',
    criadoEm: user.criadoEm,

    formacao: user.formacao ?? [],
    servicos: user.servicos ?? [],
    especializacao: user.especializacao ?? [],
    precoHora: user.precoHora ?? '',
    disponibilidade: user.disponibilidade ?? '',
    bio: user.bio ?? '',
    certificacoes: user.certificacoes ?? [],
    uf: user.uf ?? '',
    cidade: user.cidade ?? '',
  };
}

export function httpError(statusCode: number, message: string) {
  const e = new Error(message) as Error & { statusCode: number };
  e.statusCode = statusCode;
  return e;
}
