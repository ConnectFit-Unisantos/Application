import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { authRoutes } from './routes/auth.routes';
import { personalRoutes } from './routes/personal.routes';
import { errorHandler } from './middlewares/errorHandler';
import { connectDb } from './services/db';
import { getEnv } from './config/env';


const app = express();

const env = getEnv();

connectDb().catch(() => {
  process.exit(1);
});


const corsOrigin = env.CORS_ORIGIN ? env.CORS_ORIGIN : true;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/auth', personalRoutes);


app.use(errorHandler);

const port = env.PORT;
// env.PORT já valida se existe e é numérico positivo

app.listen(port, () => {});


export default app;

