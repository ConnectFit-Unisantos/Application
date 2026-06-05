import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { authService } from '../services/authService';
import { AuthResponse, LoginInput, RegisterInput, User } from '../types';

// ─── Contrato do contexto ─────────────────────────────────────────────────────

interface AuthContextData {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<AuthResponse>;
  register: (input: RegisterInput) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}


// ─── Criação ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Restaura sessão persistida no AsyncStorage ao abrir o app. */
  useEffect(() => {
    async function restoreSession() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          authService.getStoredToken(),
          authService.getStoredUser(),
        ]);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (e) {
        console.log('[AuthContext] restoreSession failed:', e);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function login(input: LoginInput): Promise<AuthResponse> {
    const response = await authService.login(input);
    setToken(response.token);
    setUser(response.user);
    return response;
  }

  async function register(input: RegisterInput): Promise<AuthResponse> {
    const response = await authService.register(input);
    setToken(response.token);
    setUser(response.user);
    return response;
  }

  async function logout(): Promise<void> {
    await authService.logout();
    setToken(null);
    setUser(null);
  }

  async function refreshSession() {
    // Recarrega AsyncStorage e atualiza o estado em memória
    try {
      const [storedToken, storedUser] = await Promise.all([
        authService.getStoredToken(),
        authService.getStoredUser(),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      } else {
        setToken(null);
        setUser(null);
      }
    } catch (e) {
      console.log('[AuthContext] refreshSession failed:', e);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        refreshSession,
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
