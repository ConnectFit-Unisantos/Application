import { API_CONFIG } from '../configs/api.config';
import { storage } from '../utils/storage';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestConfig {
  method?: HttpMethod;
  body?: unknown;
  authenticated?: boolean;
}

async function request<T>(
  endpoint: string,
  config: RequestConfig = {},
): Promise<T> {
  const { method = 'GET', body, authenticated = false } = config;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authenticated) {
    const token = await storage.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Tenta parsear como JSON; se falhar, usa text para evitar erro silencioso
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as Record<string, unknown>).message === 'string'
        ? (data as Record<string, string>).message
        : 'Erro inesperado. Tente novamente.';

    const error = new Error(message) as Error & { statusCode: number };
    error.statusCode = response.status;
    throw error;
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string, authenticated = false) =>
    request<T>(endpoint, { method: 'GET', authenticated }),

  post: <T>(endpoint: string, body: unknown, authenticated = false) =>
    request<T>(endpoint, { method: 'POST', body, authenticated }),

  put: <T>(endpoint: string, body: unknown, authenticated = false) =>
    request<T>(endpoint, { method: 'PUT', body, authenticated }),

  delete: <T>(endpoint: string, authenticated = false) =>
    request<T>(endpoint, { method: 'DELETE', authenticated }),
};
