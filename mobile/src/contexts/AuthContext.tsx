import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { authService } from '../services/authService';
import type { ApiError } from '../services/api';
import { realtime } from '../services/realtime';
import {
  AuthResponse,
  LoginInput,
  PersonalActivateInput,
  RegisterInput,
  User,
} from '../types';

// ─── Contrato do contexto ─────────────────────────────────────────────────────

interface AuthContextData {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** `persist` = "Manter conectado" */
  login: (input: LoginInput, persist?: boolean) => Promise<AuthResponse>;
  register: (input: RegisterInput) => Promise<AuthResponse>;
  activatePersonal: (input: PersonalActivateInput) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  /** Recarrega a sessão a partir do armazenamento local. */
  refreshSession: () => Promise<void>;
  /**
   * Confirma no backend que o usuário ainda existe e atualiza os dados.
   * Retorna false (e faz logout) se a sessão não for mais válida.
   * Em falha de rede, mantém a sessão e retorna true.
   */
  validateSession: () => Promise<boolean>;
}

function isUnauthorized(err: unknown): boolean {
  return (err as ApiError)?.statusCode === 401;
}

// ─── Criação ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextData | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearState = useCallback(async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  }, []);

  // Conexão em tempo real (chat/agenda) acompanha a sessão
  useEffect(() => {
    if (token) realtime.connect(token);
    else realtime.disconnect();
  }, [token]);

  /** Restaura a sessão salva e confirma com o backend que ela ainda vale. */
  useEffect(() => {
    async function restoreSession() {
      try {
        const stored = await authService.restoreSession();
        if (!stored) return;

        setToken(stored.token);
        setUser(stored.user);

        try {
          const fresh = await authService.fetchMe();
          setUser(fresh);
        } catch (err) {
          if (isUnauthorized(err)) {
            // Usuário apagado ou token inválido/expirado
            await clearState();
          }
          // Falha de rede: mantém a sessão salva
        }
      } catch (e) {
        console.log('[AuthContext] restoreSession failed:', e);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, [clearState]);

  const login = useCallback(async (input: LoginInput, persist = false) => {
    const response = await authService.login(input, persist);
    setToken(response.token);
    setUser(response.user);
    return response;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const response = await authService.register(input);
    setToken(response.token);
    setUser(response.user);
    return response;
  }, []);

  const activatePersonal = useCallback(
    async (input: PersonalActivateInput) => {
      try {
        const response = await authService.activatePersonal(input);
        setToken(response.token);
        setUser(response.user);
        return response;
      } catch (err) {
        if (isUnauthorized(err)) await clearState();
        throw err;
      }
    },
    [clearState],
  );

  const logout = useCallback(async () => {
    await clearState();
  }, [clearState]);

  const refreshSession = useCallback(async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        authService.getStoredToken(),
        authService.getStoredUser(),
      ]);
      setToken(storedToken);
      setUser(storedToken ? storedUser : null);
    } catch (e) {
      console.log('[AuthContext] refreshSession failed:', e);
    }
  }, []);

  const validateSession = useCallback(async () => {
    const current = await authService.getStoredToken();
    if (!current) return false;

    try {
      const fresh = await authService.fetchMe();
      setUser(fresh);
      return true;
    } catch (err) {
      if (isUnauthorized(err)) {
        await clearState();
        return false;
      }
      return true;
    }
  }, [clearState]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        activatePersonal,
        logout,
        refreshSession,
        validateSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook público ─────────────────────────────────────────────────────────────

export function useAuthContext(): AuthContextData {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext deve ser usado dentro de <AuthProvider>');
  }
  return ctx;
}
