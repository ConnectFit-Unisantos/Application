import { Router } from 'express';

import * as ctrl from '../controllers/chat.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { abrirConversaSchema, enviarMensagemSchema } from '../validators/chat.validators';
import { validateBody } from '../validators/validate';

export const chatRoutes = Router();

// Todas as rotas do chat exigem login; o acesso a cada conversa
// é restrito aos dois participantes (verificado no service).
chatRoutes.use(requireAuth);

chatRoutes.get('/nao-lidas', ctrl.naoLidas);
chatRoutes.get('/conversas', ctrl.listarConversas);
chatRoutes.post('/conversas', validateBody(abrirConversaSchema), ctrl.abrirConversa);
chatRoutes.get('/conversas/:id', ctrl.obterConversa);
chatRoutes.get('/conversas/:id/mensagens', ctrl.listarMensagens);
chatRoutes.post('/conversas/:id/mensagens', validateBody(enviarMensagemSchema), ctrl.enviarMensagem);
chatRoutes.post('/conversas/:id/lida', ctrl.marcarLida);
