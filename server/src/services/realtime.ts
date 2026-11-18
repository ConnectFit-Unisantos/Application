import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { getEnv } from '../config/env';
import { User } from '../models/User';

/**
 * Tempo real (Socket.IO).
 * Cada socket autenticado entra na sala `user:<id>`; o backend emite eventos
 * só para os participantes envolvidos (nunca broadcast geral).
 *
 * Eventos emitidos:
 *  - mensagem:nova          { conversaId, mensagem }
 *  - conversa:atualizada    Conversa (visão do destinatário)
 *  - agendamento:atualizado Aula (visão do destinatário)
 */
let io: Server | null = null;

export function initRealtime(server: HttpServer, corsOrigin: string[] | boolean) {
  io = new Server(server, {
    cors: { origin: corsOrigin, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const raw = socket.handshake.auth?.token ?? socket.handshake.headers.authorization;
      const token = typeof raw === 'string' ? raw.replace(/^Bearer\s+/i, '') : '';
      if (!token) return next(new Error('Não autorizado'));

      const payload = jwt.verify(token, getEnv().JWT_SECRET) as jwt.JwtPayload;
      const userId = typeof payload.sub === 'string' ? payload.sub : '';
      if (!mongoose.isValidObjectId(userId)) return next(new Error('Não autorizado'));

      const exists = await User.exists({ _id: userId });
      if (!exists) return next(new Error('Não autorizado'));

      socket.data.userId = userId;
      return next();
    } catch {
      return next(new Error('Não autorizado'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.userId}`);
  });

  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}
