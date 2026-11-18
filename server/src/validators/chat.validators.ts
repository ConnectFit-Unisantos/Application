import { z } from 'zod';

import { MAX_MENSAGEM } from '../models/Mensagem';

export const abrirConversaSchema = z
  .object({
    personalId: z.string().trim().min(1).optional(),
    alunoId: z.string().trim().min(1).optional(),
  })
  .refine((v) => !!v.personalId || !!v.alunoId, 'Informe com quem deseja conversar');

export const enviarMensagemSchema = z.object({
  texto: z
    .string({ required_error: 'Mensagem vazia' })
    .trim()
    .min(1, 'Mensagem vazia')
    .max(MAX_MENSAGEM, `A mensagem deve ter no máximo ${MAX_MENSAGEM} caracteres`),
});
