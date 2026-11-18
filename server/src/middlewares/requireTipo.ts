import type { Response, NextFunction } from 'express';

import type { AuthRequest } from './auth.middleware';

/** Restringe a rota a um tipo de conta. Usar depois de requireAuth. */
export function requireTipo(tipo: 'aluno' | 'personal') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.tipo !== tipo) {
      const msg =
        tipo === 'personal'
          ? 'Apenas personal trainers podem acessar este recurso'
          : 'Apenas alunos podem acessar este recurso';
      return res.status(403).json({ message: msg });
    }
    return next();
  };
}
