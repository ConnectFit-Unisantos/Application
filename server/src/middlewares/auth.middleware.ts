import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { getEnv } from '../config/env';
import { User } from '../models/User';

export type AuthRequest = Request & {
  user?: {
    userId: string;
    tipo: 'aluno' | 'personal';
  };
};

/**
 * Valida o JWT **e** confirma que o usuário ainda existe no banco.
 * Se o usuário foi apagado, o token deixa de valer (401).
 * O `tipo` vem do banco (fonte da verdade), não do token.
 */
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Não autorizado' });
  }

  const token = authHeader.slice('Bearer '.length);

  let userId: string | undefined;
  try {
    const { JWT_SECRET } = getEnv();
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    userId = typeof payload.sub === 'string' ? payload.sub : undefined;
  } catch {
    return res.status(401).json({ message: 'Sessão inválida ou expirada' });
  }

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({ message: 'Sessão inválida ou expirada' });
  }

  try {
    const user = await User.findById(userId).select('tipo').lean();
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado. Faça login novamente.' });
    }

    req.user = { userId, tipo: user.tipo as 'aluno' | 'personal' };
    return next();
  } catch (err) {
    return next(err);
  }
}
