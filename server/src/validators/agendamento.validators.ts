import { z } from 'zod';

import { HORARIOS_POSSIVEIS } from '../config/agenda';
import { HORARIO_RE, isDataValida } from '../utils/datas';

const dataField = z
  .string({ required_error: 'Data é obrigatória' })
  .trim()
  .refine(isDataValida, 'Data inválida (use AAAA-MM-DD)');

const horarioField = z
  .string({ required_error: 'Horário é obrigatório' })
  .trim()
  .regex(HORARIO_RE, 'Horário inválido (use HH:MM)');

export const criarAgendamentoSchema = z.object({
  personalId: z.string({ required_error: 'Personal é obrigatório' }).trim().min(1, 'Personal é obrigatório'),
  data: dataField,
  horario: horarioField,
  observacao: z.string().trim().max(500, 'Observação deve ter no máximo 500 caracteres').optional().default(''),
});

export const motivoSchema = z.object({
  motivo: z.string().trim().max(300, 'Motivo deve ter no máximo 300 caracteres').optional().default(''),
});

export const disponibilidadeSchema = z.object({
  semana: z
    .array(
      z.object({
        diaSemana: z.number().int().min(0).max(6),
        horarios: z
          .array(
            horarioField.refine(
              (h) => HORARIOS_POSSIVEIS.includes(h),
              'Horário fora da faixa permitida',
            ),
          )
          .max(24),
      }),
    )
    .max(7),
  datasBloqueadas: z.array(dataField).max(120).optional().default([]),
});
