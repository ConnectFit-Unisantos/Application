import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getEnvVar(key: string): string | undefined {
  // Em Expo, variáveis EXPO_PUBLIC_* viram parte do bundler e ficam disponíveis aqui.
  const ex = (Constants.expoConfig ?? {}) as any;
  // Tentativa 1: api.config via extra (quando definido em app.json)
  const fromExtra = ex?.extra?.[key];
  if (typeof fromExtra === 'string' && fromExtra.length > 0) return fromExtra;

  // Tentativa 2: fallback para runtime (em alguns setups elas não aparecem em expoConfig)
  const runtime = (Constants as any)?.runtimeVersion;
  void runtime;

  return undefined;
}

const HOST = (() => {
  const host = getEnvVar('EXPO_PUBLIC_API_HOST');
  if (host) {
    const raw = String(host);
    if (/^https?:\/\//i.test(raw)) return raw;
    return raw;
  }

  if (Platform.OS === 'android') return '10.0.2.2';
  return 'localhost';
})();

const PORT = getEnvVar('EXPO_PUBLIC_API_PORT') ?? '3333';


function buildBaseUrl(host: string, port: string) {
  // Se o HOST já vier com protocolo (https://... ou http://...), usar como está
  if (/^https?:\/\//i.test(host)) return host;
  // Caso contrário, montar URL padrão
  return `http://${host}:${port}`;
}

export const API_CONFIG = {
  BASE_URL: buildBaseUrl(HOST, PORT),

  ENDPOINTS: {
    LOGIN:    '/api/auth/login',
    REGISTER: '/api/auth/register',
    HEALTH:   '/health',
  },
} as const;
