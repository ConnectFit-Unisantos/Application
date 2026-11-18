import { api } from './api';
import { storage } from '../utils/storage';
import { API_CONFIG } from '../configs/api.config';
import {
  AuthResponse,
  LoginInput,
  PersonalActivateInput,
  RegisterInput,
  User,
} from '../types';

export const authService = {
  /**
   * Login. `persist` = "Manter conectado":
   * true grava a sessão no aparelho; false mantém só enquanto o app estiver aberto.
   */
  async login(input: LoginInput, persist: boolean): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(API_CONFIG.ENDPOINTS.LOGIN, input);
    await storage.saveSession(response.token, response.user, persist);
    return response;
  },

  /** Cadastro de aluno — a sessão fica salva no aparelho. */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(API_CONFIG.ENDPOINTS.REGISTER, input);
    await storage.saveSession(response.token, response.user, true);
    return response;
  },

  /** Busca o usuário atual no backend (lança erro 401 se ele não existir mais). */
  async fetchMe(): Promise<User> {
    const response = await api.get<{ user: User }>(API_CONFIG.ENDPOINTS.ME, true);
    await storage.updateSession({ user: response.user });
    return response.user;
  },

  /** Vira personal. O backend devolve token novo (tipo 'personal') + usuário atualizado. */
  async activatePersonal(input: PersonalActivateInput): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.PERSONAL_ACTIVATE,
      input,
      true,
    );
    await storage.updateSession({ token: response.token, user: response.user });
    return response;
  },

  /** Remove sessão local. */
  async logout(): Promise<void> {
    await storage.clearAll();
  },

  async restoreSession(): Promise<{ token: string; user: User } | null> {
    return storage.loadPersistedSession();
  },

  async getStoredToken(): Promise<string | null> {
    return storage.getToken();
  },

  async getStoredUser(): Promise<User | null> {
    return storage.getUser();
  },
};
