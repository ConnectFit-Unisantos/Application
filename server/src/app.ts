import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';

import { authRoutes } from './routes/auth.routes';
import { personalRoutes } from './routes/personal.routes';
import { agendamentoRoutes } from './routes/agendamento.routes';
import { chatRoutes } from './routes/chat.routes';
import { errorHandler } from './middlewares/errorHandler';
import { connectDb } from './services/db';
import { getEnv } from './config/env';
import { initRealtime } from './services/realtime';


const app = express();

const env = getEnv();

connectDb()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('[db] Conectado ao MongoDB');
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[db] Falha ao conectar no MongoDB:', err?.message ?? err);
    process.exit(1);
  });


// O app mobile (nativo) não envia Origin, então CORS só afeta navegador (Expo Web).
// Sem CORS_ORIGIN definido, qualquer origem é aceita (útil em desenvolvimento).
const corsOrigin = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : true;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/auth', personalRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/chat', chatRoutes);


app.use(errorHandler);

const port = env.PORT;
// env.PORT já valida se existe e é numérico positivo

// HTTP + Socket.IO no mesmo servidor/porta (funciona também através do ngrok)
const server = http.createServer(app);
initRealtime(server, corsOrigin);

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] API rodando em http://localhost:${port} (tempo real ativo)`);
});


export default app;
