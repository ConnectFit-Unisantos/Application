import { Router } from 'express';
import { registerAlunoSchema, loginSchema } from '../validators/auth.validators';
import { registerAluno, login } from '../controllers/auth.controller';

export const authRoutes = Router();

authRoutes.post('/register', registerAlunoSchema, registerAluno);
authRoutes.post('/login', loginSchema, login);

