import { io, Socket } from 'socket.io-client';

import { API_CONFIG } from '../configs/api.config';

/**
 * Conexão em tempo real (Socket.IO) com o backend.
 * - Conecta quando há sessão (AuthContext) e desconecta no logout.
 * - Telas assinam eventos com `realtime.on(...)` / hook `useRealtimeEvent`.
 *
 * Eventos: 'mensagem:nova', 'conversa:atualizada', 'agendamento:atualizado'.
 */
type Handler = (payload: any) => void;

let socket: Socket | null = null;
let tokenAtual: string | null = null;
const handlers = new Map<string, Set<Handler>>();
const statusListeners = new Set<(conectado: boolean) => void>();

function notificarStatus(conectado: boolean) {
  statusListeners.forEach((fn) => fn(conectado));
}

export const realtime = {
  connect(token: string) {
    if (socket && tokenAtual === token) return;
    realtime.disconnect();

    tokenAtual = token;
    socket = io(API_CONFIG.BASE_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    socket.onAny((event: string, payload: unknown) => {
      handlers.get(event)?.forEach((h) => {
        try {
          h(payload);
        } catch (e) {
          console.log('[realtime] handler error', e);
        }
      });
    });
    socket.on('connect', () => notificarStatus(true));
    socket.on('disconnect', () => notificarStatus(false));
    socket.on('connect_error', () => notificarStatus(false));
  },

  disconnect() {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
    socket = null;
    tokenAtual = null;
    notificarStatus(false);
  },

  isConnected() {
    return !!socket?.connected;
  },

  /** Assina um evento. Retorna função para cancelar a assinatura. */
  on(event: string, handler: Handler) {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event)!.add(handler);
    return () => {
      handlers.get(event)?.delete(handler);
    };
  },

  onStatus(fn: (conectado: boolean) => void) {
    statusListeners.add(fn);
    return () => {
      statusListeners.delete(fn);
    };
  },
};
