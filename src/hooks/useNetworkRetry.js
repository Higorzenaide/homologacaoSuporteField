import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar retry automático de operações de rede
 * com backoff exponencial e tratamento de erros
 */
export const useNetworkRetry = () => {
  const [isRetrying, setIsRetrying] = useState(false);

  const executeWithRetry = useCallback(async (
    operation,
    options = {}
  ) => {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      onRetry = null,
      onError = null
    } = options;

    let attempts = 0;
    let lastError = null;

    while (attempts < maxAttempts) {
      try {
        setIsRetrying(attempts > 0);
        const result = await operation();
        setIsRetrying(false);
        return result;
      } catch (error) {
        attempts++;
        lastError = error;
        
        // Verificar se é um erro de rede
        const isNetworkError = 
          error.message?.includes('NetworkError') ||
          error.message?.includes('fetch') ||
          error.message?.includes('Failed to fetch') ||
          error.code === 'NETWORK_ERROR' ||
          !navigator.onLine;

        if (!isNetworkError || attempts >= maxAttempts) {
          setIsRetrying(false);
          if (onError) {
            onError(error, attempts);
          }
          throw error;
        }

        // Calcular delay com backoff exponencial
        const delay = Math.min(
          baseDelay * Math.pow(2, attempts - 1),
          maxDelay
        );

        console.warn(`Tentativa ${attempts} falhou, tentando novamente em ${delay}ms:`, error);
        
        if (onRetry) {
          onRetry(error, attempts, delay);
        }

        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    setIsRetrying(false);
    throw lastError;
  }, []);

  return {
    executeWithRetry,
    isRetrying
  };
};

export default useNetworkRetry;
