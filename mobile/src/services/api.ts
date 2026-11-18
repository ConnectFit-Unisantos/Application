import { API_CONFIG } from '../configs/api.config';
import { storage } from '../utils/storage';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestConfig {
  method?: HttpMethod;
  body?: unknown;
  authenticated?: boolean;
}

export type ApiError = Error & {
  statusCode: number;
  /** Erros por campo vindos do backend (ex: { email: 'Informe um e-mail válido' }) */
  fields?: Record<string, string>;
};

async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { method = 'GET', body, authenticated = false } = config;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // Evita a página de aviso do ngrok free
    'ngrok-skip-browser-warning': 'true',
  };

  if (authenticated) {
    const token = await storage.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    const error = new Error(
      'Não foi possível conectar ao servidor. Verifique sua internet e se a API está rodando.',
    ) as ApiError;
    error.statusCode = 0;
    throw error;
  }

  // Lê o corpo uma única vez; tenta JSON, senão mantém texto
  const raw = await response.text();
  let data: unknown = raw;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!response.ok) {
    const obj = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>;
    const message =
      typeof obj.message === 'string' && obj.message
        ? obj.message
        : 'Erro inesperado. Tente novamente.';

    const error = new Error(message) as ApiError;
    error.statusCode = response.status;
    if (obj.fields && typeof obj.fields === 'object') {
      error.fields = obj.fields as Record<string, string>;
    }
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

  patch: <T>(endpoint: string, body: unknown, authenticated = false) =>
    request<T>(endpoint, { method: 'PATCH', body, authenticated }),

  delete: <T>(endpoint: string, authenticated = false) =>
    request<T>(endpoint, { method: 'DELETE', authenticated }),
};
