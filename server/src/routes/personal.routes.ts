import { Router } from 'express';

import { listPersonals, activatePersonal } from '../controllers/personal.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { personalActivateSchema } from '../validators/auth.validators';

export const personalRoutes = Router();

// Listagem pública (Home busca)
personalRoutes.get('/personals', (req, res, next) => listPersonals(req as any, res as any, next));


// Ativação de personal (precisa estar logado)
personalRoutes.post(
  '/personal/activate',
  requireAuth,
  personalActivateSchema,
  activatePersonal,
);






