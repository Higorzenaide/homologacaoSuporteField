import { useState, useEffect, useCallback, useRef } from 'react';

// Cache global em memória
const globalCache = new Map();
const cacheExpiry = new Map();
const subscribersMap = new Map();

// Configurações de TTL (Time To Live) em millisegundos
const DEFAULT_TTL = {
  // Dados que mudam raramente
  users: 10 * 60 * 1000, // 10 minutos
  categories: 30 * 60 * 1000, // 30 minutos
  stats: 5 * 60 * 1000, // 5 minutos
  
  // Dados que mudam com frequência moderada
  treinamentos: 2 * 60 * 1000, // 2 minutos
  noticias: 2 * 60 * 1000, // 2 minutos
  
  // Dados que mudam frequentemente
  notifications: 30 * 1000, // 30 segundos
  comments: 1 * 60 * 1000, // 1 minuto
  
  // Dados quase estáticos
  feedbacks: 5 * 60 * 1000, // 5 minutos
  analytics: 10 * 60 * 1000, // 10 minutos
};

// Função para gerar chave de cache
const generateCacheKey = (key, params = {}) => {
  const paramString = Object.keys(params)
    .sort()
    .map(k => `${k}:${params[k]}`)
    .join('|');
  return paramString ? `${key}:${paramString}` : key;
};

// Função para verificar se o cache está expirado
const isExpired = (key) => {
  const expiry = cacheExpiry.get(key);
  return !expiry || Date.now() > expiry;
};

// Função para notificar assinantes sobre mudanças
const notifySubscribers = (key, data) => {
  const subscribers = subscribersMap.get(key) || new Set();
  subscribers.forEach(callback => {
    try {
      callback(data);
    } catch (error) {
      console.error('Erro ao notificar subscriber:', error);
    }
  });
};

// Hook principal de cache
export const useCache = (key, fetcher, options = {}) => {
  const {
    ttl = DEFAULT_TTL[key] || 5 * 60 * 1000, // TTL padrão de 5 minutos
    params = {},
    enabled = true,
    staleWhileRevalidate = true,
    onError = null
  } = options;

  const cacheKey = generateCacheKey(key, params);
  const [data, setData] = useState(() => {
    // Inicializar com dados do cache se disponíveis e válidos
    if (globalCache.has(cacheKey) && !isExpired(cacheKey)) {
      return globalCache.get(cacheKey);
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(0);
  
  // Ref para evitar chamadas múltiplas simultâneas
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup ao desmontar
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Função para buscar dados
  const fetchData = useCallback(async (force = false) => {
    if (!enabled || fetchingRef.current) return;
    
    // Verificar se os dados em cache ainda são válidos
    if (!force && globalCache.has(cacheKey) && !isExpired(cacheKey)) {
      const cachedData = globalCache.get(cacheKey);
      if (mountedRef.current) {
        setData(cachedData);
        setError(null);
      }
      return cachedData;
    }

    fetchingRef.current = true;
    
    try {
      // Se staleWhileRevalidate e temos dados em cache, usar enquanto busca novos
      if (staleWhileRevalidate && globalCache.has(cacheKey) && !isLoading) {
        const staleData = globalCache.get(cacheKey);
        if (mountedRef.current && !data) {
          setData(staleData);
        }
      } else {
        if (mountedRef.current) {
          setIsLoading(true);
        }
      }

      const result = await fetcher(params);
      const timestamp = Date.now();
      
      if (mountedRef.current) {
        setData(result);
        setError(null);
        setIsLoading(false);
        setLastFetch(timestamp);
      }

      // Salvar no cache com TTL
      globalCache.set(cacheKey, result);
      cacheExpiry.set(cacheKey, timestamp + ttl);
      
      // Notificar outros componentes que usam a mesma chave
      notifySubscribers(cacheKey, result);
      
      return result;
    } catch (err) {
      console.error(`Erro ao buscar ${key}:`, err);
      
      if (mountedRef.current) {
        setError(err);
        setIsLoading(false);
      }
      
      if (onError) {
        onError(err);
      }
      
      // Em caso de erro, se temos dados em cache, manter eles por mais tempo
      if (globalCache.has(cacheKey)) {
        const extendedTtl = Date.now() + (ttl * 2); // Estender por 2x o TTL
        cacheExpiry.set(cacheKey, extendedTtl);
      }
      
      throw err;
    } finally {
      fetchingRef.current = false;
    }
  }, [cacheKey, enabled, fetcher, params, ttl, staleWhileRevalidate, onError, isLoading, data]);

  // Função para revalidar (buscar novos dados)
  const revalidate = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Função para invalidar cache
  const invalidate = useCallback(() => {
    globalCache.delete(cacheKey);
    cacheExpiry.delete(cacheKey);
    
    if (mountedRef.current) {
      setData(null);
      setError(null);
      setLastFetch(0);
    }
  }, [cacheKey]);

  // Função para atualizar dados no cache (mutation otimista)
  const mutate = useCallback((newData) => {
    if (typeof newData === 'function') {
      const currentData = globalCache.get(cacheKey) || data;
      newData = newData(currentData);
    }
    
    globalCache.set(cacheKey, newData);
    cacheExpiry.set(cacheKey, Date.now() + ttl);
    
    if (mountedRef.current) {
      setData(newData);
    }
    
    notifySubscribers(cacheKey, newData);
    return newData;
  }, [cacheKey, data, ttl]);

  // Subscrever a mudanças no cache
  useEffect(() => {
    const callback = (newData) => {
      if (mountedRef.current) {
        setData(newData);
        setError(null);
      }
    };

    if (!subscribersMap.has(cacheKey)) {
      subscribersMap.set(cacheKey, new Set());
    }
    subscribersMap.get(cacheKey).add(callback);

    return () => {
      const subscribers = subscribersMap.get(cacheKey);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          subscribersMap.delete(cacheKey);
        }
      }
    };
  }, [cacheKey]);

  // Buscar dados na montagem do componente
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled]);

  return {
    data,
    isLoading,
    error,
    revalidate,
    invalidate,
    mutate,
    lastFetch,
    isStale: isExpired(cacheKey),
    isCached: globalCache.has(cacheKey)
  };
};

// Hook para cache de lista com paginação
export const useCachedList = (key, fetcher, options = {}) => {
  const {
    pageSize = 20,
    initialPage = 1,
    ...cacheOptions
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [allItems, setAllItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const pageKey = `${key}_page_${currentPage}`;
  
  const { data, isLoading, error, revalidate } = useCache(
    pageKey,
    async () => {
      const result = await fetcher({ 
        page: currentPage, 
        pageSize,
        ...cacheOptions.params 
      });
      return result;
    },
    cacheOptions
  );

  useEffect(() => {
    if (data) {
      if (currentPage === 1) {
        setAllItems(data.items || data);
      } else {
        setAllItems(prev => [...prev, ...(data.items || data)]);
      }
      setHasMore((data.items || data).length === pageSize);
    }
  }, [data, currentPage, pageSize]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [isLoading, hasMore]);

  const refresh = useCallback(() => {
    setCurrentPage(1);
    setAllItems([]);
    setHasMore(true);
    return revalidate();
  }, [revalidate]);

  return {
    items: allItems,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    currentPage
  };
};

// Função para limpar todo o cache
export const clearAllCache = () => {
  globalCache.clear();
  cacheExpiry.clear();
  subscribersMap.clear();
};

// Função para limpar cache expirado
export const clearExpiredCache = () => {
  const now = Date.now();
  const expiredKeys = [];
  
  for (const [key, expiry] of cacheExpiry.entries()) {
    if (now > expiry) {
      expiredKeys.push(key);
    }
  }
  
  expiredKeys.forEach(key => {
    globalCache.delete(key);
    cacheExpiry.delete(key);
  });
  
  return expiredKeys.length;
};

// Limpeza automática a cada 5 minutos
setInterval(() => {
  const cleared = clearExpiredCache();
  if (cleared > 0) {
    console.log(`🧹 Cache: ${cleared} entradas expiradas removidas`);
  }
}, 5 * 60 * 1000);

export default useCache;
