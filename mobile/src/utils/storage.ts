import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

const KEYS = {
  TOKEN: '@connectfit:token',
  USER: '@connectfit:user',
} as const;

/**
 * Sessão em memória + persistência opcional ("Manter conectado").
 *
 * - A sessão ativa sempre fica em memória (usada pelas requisições).
 * - Só é gravada no AsyncStorage se `persist = true`.
 *   Sem "Manter conectado", fechar o app encerra a sessão.
 */
let memToken: string | null = null;
let memUser: User | null = null;
let persisted = false;

export const storage = {
  /** Inicia uma sessão nova (login/cadastro). */
  async saveSession(token: string, user: User, persist: boolean): Promise<void> {
    memToken = token;
    memUser = user;
    persisted = persist;

    if (persist) {
      await AsyncStorage.multiSet([
        [KEYS.TOKEN, token],
        [KEYS.USER, JSON.stringify(user)],
      ]);
    } else {
      await AsyncStorage.multiRemove(Object.values(KEYS));
    }
  },

  /** Atualiza token e/ou usuário da sessão atual, respeitando a escolha de persistência. */
  async updateSession(data: { token?: string; user?: User }): Promise<void> {
    if (data.token) memToken = data.token;
    if (data.user) memUser = data.user;

    if (!persisted) return;

    const pairs: [string, string][] = [];
    if (data.token) pairs.push([KEYS.TOKEN, data.token]);
    if (data.user) pairs.push([KEYS.USER, JSON.stringify(data.user)]);
    if (pairs.length) await AsyncStorage.multiSet(pairs);
  },

  /** Restaura a sessão gravada no aparelho (ao abrir o app). */
  async loadPersistedSession(): Promise<{ token: string; user: User } | null> {
    const [[, token], [, rawUser]] = await AsyncStorage.multiGet([KEYS.TOKEN, KEYS.USER]);
    if (!token || !rawUser) return null;

    try {
      const user = JSON.parse(rawUser) as User;
      memToken = token;
      memUser = user;
      persisted = true;
      return { token, user };
    } catch {
      await AsyncStorage.multiRemove(Object.values(KEYS));
      return null;
    }
  },

  async getToken(): Promise<string | null> {
    return memToken;
  },

  async getUser(): Promise<User | null> {
    return memUser;
  },

  async clearAll(): Promise<void> {
    memToken = null;
    memUser = null;
    persisted = false;
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};
