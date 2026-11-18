import type { AuthRequest } from '../middlewares/auth.middleware';
import * as chatService from '../services/chat.service';
import { asyncHandler } from '../utils/asyncHandler';
import { httpError } from '../utils/user';

function auth(req: AuthRequest) {
  if (!req.user) throw httpError(401, 'Não autorizado');
  return req.user;
}

/** GET /api/chat/conversas */
export const listarConversas = asyncHandler<AuthRequest>(async (req, res) => {
  res.status(200).json({ conversas: await chatService.listarConversas(auth(req).userId) });
});

/** POST /api/chat/conversas { personalId } (aluno) | { alunoId } (personal) */
export const abrirConversa = asyncHandler<AuthRequest>(async (req, res) => {
  const { userId, tipo } = auth(req);
  const conversa = await chatService.abrirConversa(userId, tipo, req.body);
  res.status(200).json({ conversa });
});

/** GET /api/chat/conversas/:id */
export const obterConversa = asyncHandler<AuthRequest>(async (req, res) => {
  res.status(200).json({ conversa: await chatService.obterConversa(req.params.id, auth(req).userId) });
});

/** GET /api/chat/conversas/:id/mensagens?antes=ISO&limite=50 */
export const listarMensagens = asyncHandler<AuthRequest>(async (req, res) => {
  const result = await chatService.listarMensagens(req.params.id, auth(req).userId, {
    antes: typeof req.query.antes === 'string' ? req.query.antes : undefined,
    limite: Number(req.query.limite) || undefined,
  });
  res.status(200).json(result);
});

/** POST /api/chat/conversas/:id/mensagens { texto } */
export const enviarMensagem = asyncHandler<AuthRequest>(async (req, res) => {
  const mensagem = await chatService.enviarMensagem(req.params.id, auth(req).userId, req.body.texto);
  res.status(201).json({ mensagem });
});

/** POST /api/chat/conversas/:id/lida */
export const marcarLida = asyncHandler<AuthRequest>(async (req, res) => {
  await chatService.marcarComoLida(req.params.id, auth(req).userId);
  res.status(204).end();
});

/** GET /api/chat/nao-lidas */
export const naoLidas = asyncHandler<AuthRequest>(async (req, res) => {
  res.status(200).json({ total: await chatService.totalNaoLidas(auth(req).userId) });
});
