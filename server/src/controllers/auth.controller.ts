import type { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export async function registerAluno(req: Request, res: Response, next: NextFunction) {
  try {
    const { nome, email, senha } = req.body as { nome: string; email: string; senha: string };
    const result = await authService.registerAluno({ nome, email, senha });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, senha } = req.body as { email: string; senha: string };
    const result = await authService.login({ email, senha });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

