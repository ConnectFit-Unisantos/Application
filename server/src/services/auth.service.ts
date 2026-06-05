import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { User } from '../models/User';

export type TokenPayload = {
  sub: string; // userId
  tipo: 'aluno' | 'personal';
};

function signToken(payload: TokenPayload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');

  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';

  // Tipagem do jsonwebtoken pode variar; para evitar conflito de tipos no TS,
  // passamos expiresIn como qualquer.
  return jwt.sign(payload as any, secret as any, { expiresIn: expiresIn as any });
}

export async function registerAluno(input: {
  nome: string;
  email: string;
  senha: string;
}) {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    const e = new Error('Email já cadastrado');
    (e as any).statusCode = 409;
    throw e;
  }

  const senhaHash = await bcrypt.hash(input.senha, 10);

  const user = await User.create({
    nome: input.nome,
    email: input.email,
    senhaHash,
    tipo: 'aluno'
  });

  const token = signToken({ sub: String(user._id), tipo: user.tipo });

  return {
    token,
    user: {
      id: String(user._id),
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
      criadoEm: user.criadoEm,

      formacao: user.formacao,
      servicos: user.servicos,
      especializacao: user.especializacao,
      precoHora: user.precoHora,
      disponibilidade: user.disponibilidade,
      bio: user.bio,
      certificacoes: user.certificacoes,
    },
  };
}


export async function login(input: { email: string; senha: string }) {
  const user = await User.findOne({ email: input.email });
  if (!user) {
    const e = new Error('Credenciais inválidas');
    (e as any).statusCode = 401;
    throw e;
  }

  const ok = await bcrypt.compare(input.senha, user.senhaHash);
  if (!ok) {
    const e = new Error('Credenciais inválidas');
    (e as any).statusCode = 401;
    throw e;
  }

  const token = signToken({ sub: String(user._id), tipo: user.tipo });

  return {
    token,
    user: {
      id: String(user._id),
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
      criadoEm: user.criadoEm,

      formacao: user.formacao,
      servicos: user.servicos,
      especializacao: user.especializacao,
      precoHora: user.precoHora,
      disponibilidade: user.disponibilidade,
      bio: user.bio,
      certificacoes: user.certificacoes,
    },
  };
}


