import { Platform } from 'react-native';

/**
 * Resolução do host da API:
 *
 * - Android Emulator  → 10.0.2.2  (redireciona para o localhost do host)
 * - iOS Simulator     → localhost
 * - Dispositivo físico → substitua pela IP local da máquina (ex.: 192.168.1.100)
 */
const HOST =
  Platform.OS === 'android'
    ? '10.0.2.2'   // emulador Android
    : 'localhost';  // simulador iOS

const PORT = 3333;

export const API_CONFIG = {
  BASE_URL: `http://${HOST}:${PORT}`,

  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    HEALTH: '/health',
  },
} as const;
