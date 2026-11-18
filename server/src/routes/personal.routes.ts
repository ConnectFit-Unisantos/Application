import { Router } from 'express';

import { listPersonals, activatePersonal } from '../controllers/personal.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { personalActivateSchema } from '../validators/auth.validators';

export const personalRoutes = Router();

// Listagem pública (Home busca)
personalRoutes.get('/personals', listPersonals);

// Ativação de personal (precisa estar logado) — rota registrada só aqui
personalRoutes.post('/personal/activate', requireAuth, personalActivateSchema, activatePersonal);
