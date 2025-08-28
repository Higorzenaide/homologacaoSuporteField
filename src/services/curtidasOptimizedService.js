import { supabase } from '../lib/supabase';

// Cache global para curtidas
const curtidasCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Estrutura do cache: userId -> { curtidas: Set<treinamentoId>, timestamp: number }

/**
 * Buscar todas as curtidas do usuário de uma vez
 * @param {string} usuarioId - ID do usuário
 * @returns {Promise<Set<number>>} Set com IDs dos treinamentos curtidos
 */
export const getUserCurtidas = async (usuarioId) => {
  if (!usuarioId) return new Set();

  // Verificar cache
  const cached = curtidasCache.get(usuarioId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log('🎯 CACHE HIT: Curtidas do usuário servidas do cache');
    return cached.curtidas;
  }

  try {
    console.log('🚀 CACHE MISS: Buscando curtidas do usuário no banco');
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('treinamento_curtidas')
      .select('treinamento_id')
      .eq('usuario_id', usuarioId);

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar curtidas do usuário:', error);
      return new Set();
    }

    const curtidas = new Set((data || []).map(item => item.treinamento_id));
    
    // Salvar no cache
    curtidasCache.set(usuarioId, {
      curtidas,
      timestamp: Date.now()
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Curtidas carregadas: ${curtidas.size} em ${duration}ms`);

    return curtidas;
  } catch (error) {
    console.error('Erro ao buscar curtidas do usuário:', error);
    return new Set();
  }
};

/**
 * Verificar se usuário curtiu um treinamento específico
 * @param {number} treinamentoId - ID do treinamento
 * @param {string} usuarioId - ID do usuário
 * @returns {Promise<boolean>} True se curtiu
 */
export const verificarCurtidaOptimized = async (treinamentoId, usuarioId) => {
  if (!usuarioId || !treinamentoId) return false;

  const curtidas = await getUserCurtidas(usuarioId);
  return curtidas.has(parseInt(treinamentoId));
};

/**
 * Curtir/descurtir treinamento de forma otimizada
 * @param {number} treinamentoId - ID do treinamento
 * @param {string} usuarioId - ID do usuário
 * @returns {Promise<Object>} Resultado da operação
 */
export const toggleCurtidaOptimized = async (treinamentoId, usuarioId) => {
  if (!usuarioId || !treinamentoId) {
    return { error: 'Parâmetros inválidos' };
  }

  try {
    const treinamentoIdInt = parseInt(treinamentoId);
    const curtidas = await getUserCurtidas(usuarioId);
    const jaCurtiu = curtidas.has(treinamentoIdInt);

    if (jaCurtiu) {
      // Remover curtida
      const { error } = await supabase
        .from('treinamento_curtidas')
        .delete()
        .eq('treinamento_id', treinamentoIdInt)
        .eq('usuario_id', usuarioId);

      if (error) {
        console.error('Erro ao remover curtida:', error);
        return { error: error.message };
      }

      // Atualizar cache local
      curtidas.delete(treinamentoIdInt);
      
      console.log('👎 Curtida removida:', { treinamentoId: treinamentoIdInt, usuarioId });
      return { data: { curtido: false } };
    } else {
      // Adicionar curtida
      const { error } = await supabase
        .from('treinamento_curtidas')
        .insert([{
          treinamento_id: treinamentoIdInt,
          usuario_id: usuarioId
        }]);

      if (error) {
        console.error('Erro ao adicionar curtida:', error);
        return { error: error.message };
      }

      // Atualizar cache local
      curtidas.add(treinamentoIdInt);
      
      console.log('👍 Curtida adicionada:', { treinamentoId: treinamentoIdInt, usuarioId });
      return { data: { curtido: true } };
    }
  } catch (error) {
    console.error('Erro ao fazer toggle da curtida:', error);
    return { error: 'Erro interno do servidor' };
  }
};

/**
 * Buscar curtidas de múltiplos treinamentos de uma vez
 * @param {number[]} treinamentoIds - Array de IDs dos treinamentos
 * @param {string} usuarioId - ID do usuário
 * @returns {Promise<Object>} Objeto com status das curtidas por treinamento
 */
export const getBulkCurtidas = async (treinamentoIds, usuarioId) => {
  if (!usuarioId || !treinamentoIds?.length) {
    return {};
  }

  const curtidas = await getUserCurtidas(usuarioId);
  const result = {};

  treinamentoIds.forEach(id => {
    result[id] = curtidas.has(parseInt(id));
  });

  return result;
};

/**
 * Pré-carregar curtidas do usuário
 * @param {string} usuarioId - ID do usuário
 */
export const preloadUserCurtidas = async (usuarioId) => {
  if (!usuarioId) return;
  
  console.log('🚀 Pré-carregando curtidas do usuário...');
  await getUserCurtidas(usuarioId);
};

/**
 * Invalidar cache de curtidas do usuário
 * @param {string} usuarioId - ID do usuário
 */
export const invalidateUserCurtidas = (usuarioId) => {
  if (usuarioId && curtidasCache.has(usuarioId)) {
    curtidasCache.delete(usuarioId);
    console.log('🗑️ Cache de curtidas invalidado para usuário');
  }
};

/**
 * Limpar todo o cache de curtidas
 */
export const clearCurtidasCache = () => {
  curtidasCache.clear();
  console.log('🧹 Cache de curtidas totalmente limpo');
};

/**
 * Obter estatísticas do cache de curtidas
 */
export const getCurtidasCacheStats = () => {
  let totalCurtidas = 0;
  let expiredEntries = 0;
  const now = Date.now();

  curtidasCache.forEach(entry => {
    totalCurtidas += entry.curtidas.size;
    if ((now - entry.timestamp) > CACHE_TTL) {
      expiredEntries++;
    }
  });

  return {
    totalUsers: curtidasCache.size,
    totalCurtidas,
    expiredEntries,
    cacheSize: `${Math.round(JSON.stringify([...curtidasCache.entries()]).length / 1024)}KB`
  };
};

export default {
  getUserCurtidas,
  verificarCurtidaOptimized,
  toggleCurtidaOptimized,
  getBulkCurtidas,
  preloadUserCurtidas,
  invalidateUserCurtidas,
  clearCurtidasCache,
  getCurtidasCacheStats
};
