import { Router } from 'express';

import * as ctrl from '../controllers/agendamento.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireTipo } from '../middlewares/requireTipo';
import {
  criarAgendamentoSchema,
  disponibilidadeSchema,
  motivoSchema,
} from '../validators/agendamento.validators';
import { validateBody } from '../validators/validate';

export const agendamentoRoutes = Router();

// Pública: horários livres de um personal (Home/Detalhe podem consultar sem login)
agendamentoRoutes.get('/personal/:personalId/disponibilidade', ctrl.disponibilidadePublica);

// Agenda do próprio personal
agendamentoRoutes.get('/disponibilidade', requireAuth, requireTipo('personal'), ctrl.minhaDisponibilidade);
agendamentoRoutes.put(
  '/disponibilidade',
  requireAuth,
  requireTipo('personal'),
  validateBody(disponibilidadeSchema),
  ctrl.salvarDisponibilidade,
);

// Agendamentos
agendamentoRoutes.post('/', requireAuth, requireTipo('aluno'), validateBody(criarAgendamentoSchema), ctrl.criar);
agendamentoRoutes.get('/', requireAuth, ctrl.listar);
agendamentoRoutes.get('/:id', requireAuth, ctrl.obter);
agendamentoRoutes.patch('/:id/confirmar', requireAuth, requireTipo('personal'), ctrl.confirmar);
agendamentoRoutes.patch(
  '/:id/recusar',
  requireAuth,
  requireTipo('personal'),
  validateBody(motivoSchema),
  ctrl.recusar,
);
agendamentoRoutes.patch('/:id/cancelar', requireAuth, validateBody(motivoSchema), ctrl.cancelar);
