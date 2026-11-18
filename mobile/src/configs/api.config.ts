import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Ordem de leitura das variáveis:
 * 1) mobile/.env  (EXPO_PUBLIC_* são embutidas pelo Expo no bundle)
 * 2) app.json → expo.extra
 * 3) padrão local (emulador Android usa 10.0.2.2; iOS/web usa localhost)
 */
const FROM_DOTENV: Record<string, string | undefined> = {
  // Precisa ser acesso literal para o Expo substituir no build
  EXPO_PUBLIC_API_HOST: process.env.EXPO_PUBLIC_API_HOST,
  EXPO_PUBLIC_API_PORT: process.env.EXPO_PUBLIC_API_PORT,
};

function getEnvVar(key: 'EXPO_PUBLIC_API_HOST' | 'EXPO_PUBLIC_API_PORT'): string | undefined {
  const fromDotenv = FROM_DOTENV[key];
  if (fromDotenv && fromDotenv.trim()) return fromDotenv.trim();

  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const fromExtra = extra[key];
  if (typeof fromExtra === 'string' && fromExtra.trim()) return fromExtra.trim();

  return undefined;
}

const HOST =
  getEnvVar('EXPO_PUBLIC_API_HOST') ?? (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

const PORT = getEnvVar('EXPO_PUBLIC_API_PORT') ?? '3333';

function buildBaseUrl(host: string, port: string) {
  const clean = host.replace(/\/+$/, '');
  // Host com protocolo (ex: https://xxx.ngrok-free.dev) é usado como está
  if (/^https?:\/\//i.test(clean)) return clean;
  // Porta 443 => https sem porta explícita
  if (port === '443') return `https://${clean}`;
  return `http://${clean}:${port}`;
}

export const API_CONFIG = {
  BASE_URL: buildBaseUrl(HOST, PORT),

  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    PERSONALS: '/api/auth/personals',
    PERSONAL_ACTIVATE: '/api/auth/personal/activate',
    HEALTH: '/health',

    // Agendamento
    AGENDAMENTOS: '/api/agendamentos',
    MINHA_DISPONIBILIDADE: '/api/agendamentos/disponibilidade',
    DISPONIBILIDADE_PERSONAL: (personalId: string) =>
      `/api/agendamentos/personal/${encodeURIComponent(personalId)}/disponibilidade`,

    // Chat
    CONVERSAS: '/api/chat/conversas',
    NAO_LIDAS: '/api/chat/nao-lidas',
  },
} as const;
