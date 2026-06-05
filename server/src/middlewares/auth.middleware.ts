import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { getEnv } from '../config/env';

export type AuthRequest = Request & {
  user?: {
    userId: string;
    tipo: 'aluno' | 'personal';
  };
};

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Não autorizado' });
    }

    const token = authHeader.slice('Bearer '.length);

    const { JWT_SECRET } = getEnv();

    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
      sub?: string;
      tipo?: 'aluno' | 'personal';
    };

    const userId = payload.sub;
    const tipo = payload.tipo;

    if (!userId || !tipo) {
      return res.status(401).json({ message: 'Não autorizado' });
    }

    req.user = { userId, tipo };
    return next();
  } catch {
    return res.status(401).json({ message: 'Não autorizado' });
  }
}

