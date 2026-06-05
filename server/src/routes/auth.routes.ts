import { Router } from 'express';
import {
  registerAlunoSchema,
  loginSchema,
  personalActivateSchema,
} from '../validators/auth.validators';
import { registerAluno, login } from '../controllers/auth.controller';
import { activatePersonal } from '../controllers/personal.controller';
import { requireAuth } from '../middlewares/auth.middleware';

export const authRoutes = Router();

authRoutes.post('/register', registerAlunoSchema, registerAluno);
authRoutes.post('/login', loginSchema, login);

authRoutes.post(
  '/personal/activate',
  requireAuth,
  personalActivateSchema,
  activatePersonal,
);




