import { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { LoginInput, RegisterInput } from '../types';

/**
 * Hook de autenticação para uso nas telas.
 * Encapsula o estado de loading/erro do submit e
 * expõe handleLogin / handleRegister prontos para uso.
 */
export function useAuth() {
  const context = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(input: LoginInput) {
    try {
      setIsSubmitting(true);
      setError(null);
      return await context.login(input);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erro ao fazer login. Tente novamente.';
      setError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(input: RegisterInput) {
    try {
      setIsSubmitting(true);
      setError(null);
      return await context.register(input);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erro ao criar conta. Tente novamente.';
      setError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }

  function clearError() {
    setError(null);
  }

  return {
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    isSubmitting,
    error,
    handleLogin,
    handleRegister,
    logout: context.logout,
    clearError,
  };
}
