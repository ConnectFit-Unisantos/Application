import { api } from './api';
import { storage } from '../utils/storage';
import { API_CONFIG } from '../configs/api.config';
import { AuthResponse, LoginInput, RegisterInput, User } from '../types';

export const authService = {
  /**
   * Realiza login e persiste token + usuário localmente.
   * Resposta do backend: { token: string, user: { id, nome, email, tipo, criadoEm } }
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.LOGIN,
      input,
    );
    await storage.saveToken(response.token);
    await storage.saveUser(response.user);
    return response;
  },

  /**
   * Cadastra novo aluno e persiste sessão.
   * Resposta do backend: { token: string, user: { id, nome, email, tipo, criadoEm } }
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.REGISTER,
      input,
    );
    await storage.saveToken(response.token);
    await storage.saveUser(response.user);
    return response;
  },

  /** Remove sessão local. */
  async logout(): Promise<void> {
    await storage.clearAll();
  },

  async getStoredToken(): Promise<string | null> {
    return storage.getToken();
  },

  async getStoredUser(): Promise<User | null> {
    return storage.getUser();
  },
};
