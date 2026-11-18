import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { parsePreco } from '../utils/text';

const emailField = z
  .string({ required_error: 'E-mail é obrigatório' })
  .trim()
  .toLowerCase()
  .email('Informe um e-mail válido (ex: nome@email.com)');

const registerBodySchema = z.object({
  nome: z
    .string({ required_error: 'Nome é obrigatório' })
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: emailField,
  senha: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const loginBodySchema = z.object({
  email: emailField,
  senha: z.string({ required_error: 'Senha é obrigatória' }).min(1, 'Senha é obrigatória'),
});

export const registerAlunoSchema = (req: Request, _res: Response, next: NextFunction) => {
  try {
    req.body = registerBodySchema.parse(req.body);
    return next();
  } catch (err) {
    return next(err);
  }
};

export const loginSchema = (req: Request, _res: Response, next: NextFunction) => {
  try {
    req.body = loginBodySchema.parse(req.body);
    return next();
  } catch (err) {
    return next(err);
  }
};

const tagList = (campo: string) =>
  z
    .array(z.string().trim().min(1), {
      invalid_type_error: `${campo} deve ser uma lista`,
    })
    .min(1, `Informe pelo menos um item em ${campo}`);

const personalActivateBodySchema = z.object({
  formacao: tagList('Formação'),
  servicos: tagList('Serviços'),
  especializacao: tagList('Especialização'),
  certificacoes: tagList('Certificações'),

  // Preço: aceita "120", "120,50", "R$ 120" — salvo normalizado como "120" / "120.5"
  precoHora: z
    .union([z.string(), z.number()], { required_error: 'Preço/hora é obrigatório' })
    .transform((v) => parsePreco(v))
    .refine((n) => Number.isFinite(n) && n > 0, 'Preço/hora deve ser um número maior que zero')
    .transform((n) => String(Math.round(n * 100) / 100)),

  disponibilidade: z.string().trim().optional().default(''),
  bio: z.string({ required_error: 'Bio é obrigatória' }).trim().min(1, 'Bio é obrigatória'),

  // Localização obrigatória: sem ela o personal não aparece corretamente nos filtros
  uf: z
    .string({ required_error: 'Estado é obrigatório' })
    .trim()
    .toUpperCase()
    .length(2, 'Estado (UF) inválido'),
  cidade: z.string({ required_error: 'Cidade é obrigatória' }).trim().min(1, 'Cidade é obrigatória'),
});

export type PersonalActivateInput = z.infer<typeof personalActivateBodySchema>;

export const personalActivateSchema = (req: Request, _res: Response, next: NextFunction) => {
  try {
    req.body = personalActivateBodySchema.parse(req.body);
    return next();
  } catch (err) {
    return next(err);
  }
};
