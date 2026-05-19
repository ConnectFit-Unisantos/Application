import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const registerBodySchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6)
});

const loginBodySchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1)
});

export const registerAlunoSchema = (req: Request, _res: Response, next: NextFunction) => {
  req.body = registerBodySchema.parse(req.body);
  return next();
};

export const loginSchema = (req: Request, _res: Response, next: NextFunction) => {
  req.body = loginBodySchema.parse(req.body);
  return next();
};

