import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { authRoutes } from './routes/auth.routes';
import { errorHandler } from './middlewares/errorHandler';
import { connectDb } from './services/db';

const app = express();

connectDb().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to connect DB', err);
  process.exit(1);
});


app.use(cors({ origin: process.env.CORS_ORIGIN ?? true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api/auth', authRoutes);

app.use(errorHandler);

const port = Number(process.env.PORT ?? 3333);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`connectfit-server running on http://localhost:${port}`);
});

export default app;

