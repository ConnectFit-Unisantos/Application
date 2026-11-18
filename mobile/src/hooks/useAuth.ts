import { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import type { ApiError } from '../services/api';
import { LoginInput, RegisterInput } from '../types';

/**
 * Hook de autenticação para uso nas telas.
 * Encapsula loading/erro do submit e expõe handleLogin / handleRegister.
 * `fieldErrors` traz os erros por campo devolvidos pelo backend.
 */
export function useAuth() {
  const context = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleError(err: unknown, fallback: string) {
    const apiErr = err as ApiError;
    setError(err instanceof Error && err.message ? err.message : fallback);
    setFieldErrors(apiErr?.fields ?? {});
  }

  async function handleLogin(input: LoginInput, persist = false) {
    try {
      setIsSubmitting(true);
      setError(null);
      setFieldErrors({});
      return await context.login(input, persist);
    } catch (err: unknown) {
      handleError(err, 'Erro ao fazer login. Tente novamente.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(input: RegisterInput) {
    try {
      setIsSubmitting(true);
      setError(null);
      setFieldErrors({});
      return await context.register(input);
    } catch (err: unknown) {
      handleError(err, 'Erro ao criar conta. Tente novamente.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }

  function clearError() {
    setError(null);
    setFieldErrors({});
  }

  return {
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    isSubmitting,
    error,
    fieldErrors,
    handleLogin,
    handleRegister,
    activatePersonal: context.activatePersonal,
    logout: context.logout,
    refreshSession: context.refreshSession,
    validateSession: context.validateSession,
    clearError,
  };
}
