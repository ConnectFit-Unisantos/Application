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

const personalActivateBodySchema = z.object({
  formacao: z.array(z.string().min(1)).default([]),
  servicos: z.array(z.string().min(1)).default([]),
  especializacao: z.array(z.string().min(1)).default([]),
  precoHora: z.string().optional().default(''),
  disponibilidade: z.string().optional().default(''),
  bio: z.string().optional().default(''),
  certificacoes: z.array(z.string().min(1)).default([]),

  // Localização (UF + Cidade) para ajudar no filtro da Home
  uf: z.string().optional().default(''),
  cidade: z.string().optional().default(''),
});


export const personalActivateSchema = (req: Request, _res: Response, next: NextFunction) => {
  req.body = personalActivateBodySchema.parse(req.body);
  return next();
};


