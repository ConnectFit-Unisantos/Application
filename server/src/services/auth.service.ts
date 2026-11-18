import bcrypt from 'bcryptjs';

import { User } from '../models/User';
import { httpError, signToken, toPublicUser } from '../utils/user';

export async function registerAluno(input: { nome: string; email: string; senha: string }) {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw httpError(409, 'Email já cadastrado');
  }

  const senhaHash = await bcrypt.hash(input.senha, 10);

  const user = await User.create({
    nome: input.nome,
    email: input.email,
    senhaHash,
    tipo: 'aluno',
  });

  const token = signToken({ sub: String(user._id), tipo: user.tipo as 'aluno' | 'personal' });

  return { token, user: toPublicUser(user) };
}

export async function login(input: { email: string; senha: string }) {
  const user = await User.findOne({ email: input.email });
  if (!user) {
    throw httpError(401, 'Credenciais inválidas');
  }

  const ok = await bcrypt.compare(input.senha, user.senhaHash);
  if (!ok) {
    throw httpError(401, 'Credenciais inválidas');
  }

  const token = signToken({ sub: String(user._id), tipo: user.tipo as 'aluno' | 'personal' });

  return { token, user: toPublicUser(user) };
}

/** Dados atualizados do usuário logado (usado pelo app para validar a sessão). */
export async function me(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw httpError(401, 'Usuário não encontrado. Faça login novamente.');
  }
  return { user: toPublicUser(user) };
}
