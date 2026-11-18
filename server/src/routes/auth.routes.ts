import { Router } from 'express';

import { registerAlunoSchema, loginSchema } from '../validators/auth.validators';
import { registerAluno, login, me } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

export const authRoutes = Router();

authRoutes.post('/register', registerAlunoSchema, registerAluno);
authRoutes.post('/login', loginSchema, login);

// Dados atuais do usuário logado — o app usa para validar a sessão
authRoutes.get('/me', requireAuth, me);
