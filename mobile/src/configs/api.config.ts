import { Platform } from 'react-native';

/**
 * Resolução do host da API
 *
 * Prioridade:
 *  1. EXPO_PUBLIC_API_HOST no .env  → sempre usado se definido (ideal para dispositivo físico)
 *  2. 10.0.2.2                      → emulador Android (redireciona para localhost do host)
 *  3. localhost                      → simulador iOS
 *
 * Para dispositivo físico: copie .env.example → .env e defina o IP do seu computador.
 * Para descobrir seu IP: rode `ipconfig` (Windows) ou `ifconfig` (Mac/Linux).
 */
const HOST = (() => {
  if (process.env.EXPO_PUBLIC_API_HOST) {
    return process.env.EXPO_PUBLIC_API_HOST;
  }
  if (Platform.OS === 'android') return '10.0.2.2';
  return 'localhost';
})();

const PORT = process.env.EXPO_PUBLIC_API_PORT ?? '3333';

export const API_CONFIG = {
  BASE_URL: `http://${HOST}:${PORT}`,

  ENDPOINTS: {
    LOGIN:    '/api/auth/login',
    REGISTER: '/api/auth/register',
    HEALTH:   '/health',
  },
} as const;
