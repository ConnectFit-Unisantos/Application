import { useEffect, useRef, useState } from 'react';

import { realtime } from '../services/realtime';

/** Assina um evento em tempo real enquanto o componente estiver montado. */
export function useRealtimeEvent<T = any>(event: string, handler: (payload: T) => void) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => realtime.on(event, (p) => ref.current(p as T)), [event]);
}

/** true quando o socket está conectado. */
export function useRealtimeStatus() {
  const [conectado, setConectado] = useState(realtime.isConnected());
  useEffect(() => realtime.onStatus(setConectado), []);
  return conectado;
}
