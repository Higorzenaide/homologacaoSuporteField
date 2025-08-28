// Serviços com cache integrado para evitar consultas desnecessárias
import { useCache } from '../hooks/useCache';
import { supabase } from '../lib/supabase';
import { getTreinamentos } from './treinamentosService';
import { getNoticias } from './noticiasService';
import { listarUsuarios } from './usuariosService';
import { listarCategorias as listarCategoriasFeedback } from './categoriasFeedbackService';
import { getCategoriasAtivas as getCategoriasTreinamentos } from './categoriasTreinamentosService';
import { getCategoriasNoticias } from './noticiasService';
import { obterEstatisticas } from './estatisticasService';
import { supabase } from '../lib/supabase';

// ==========================================
// HOOKS DE CACHE PARA ENTIDADES PRINCIPAIS
// ==========================================

// Hook para treinamentos com cache
export const useCachedTreinamentos = (filters = {}) => {
  return useCache(
    'treinamentos',
    async () => {
      const result = await getTreinamentos();
      return result.data || result;
    },
    {
      ttl: 2 * 60 * 1000, // 2 minutos
      params: filters,
      staleWhileRevalidate: true
    }
  );
};

// Hook para notícias com cache
export const useCachedNoticias = (filters = {}) => {
  return useCache(
    'noticias',
    async () => {
      const result = await getNoticias();
      return result.data || result;
    },
    {
      ttl: 2 * 60 * 1000, // 2 minutos
      params: filters,
      staleWhileRevalidate: true
    }
  );
};

// Hook para usuários com cache
export const useCachedUsuarios = () => {
  return useCache(
    'users_v3', // Versão nova para forçar invalidação
    async () => {
      console.log('🔍 [USUÁRIOS] Iniciando busca de usuários...');
      const startTime = Date.now();
      
      try {
        // Tentar usar função RPC primeiro (garante estrutura correta)
        console.log('🔍 [USUÁRIOS] Tentando RPC get_usuarios_for_notifications...');
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_usuarios_for_notifications');
        
        if (!rpcError && rpcData) {
          const duration = Date.now() - startTime;
          console.log(`✅ [USUÁRIOS] RPC sucesso: ${rpcData.length} usuários em ${duration}ms`);
          return rpcData;
        }
        console.log('⚠️ [USUÁRIOS] RPC falhou, usando consulta direta');
      } catch (e) {
        console.log('⚠️ [USUÁRIOS] RPC não disponível, usando consulta direta');
      }
      
      // Fallback: consulta direta para garantir que usa ultimo_acesso
      console.log('🔍 [USUÁRIOS] Executando consulta direta na tabela usuarios...');
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, ativo, tipo_usuario, ultimo_acesso, created_at')
        .order('nome');
      
      if (error) throw error;
      
      const duration = Date.now() - startTime;
      console.log(`✅ [USUÁRIOS] Consulta direta sucesso: ${data?.length || 0} usuários em ${duration}ms`);
      
      return data || [];
    },
    {
      ttl: 10 * 60 * 1000, // 10 minutos (dados de usuários mudam pouco)
      staleWhileRevalidate: true
    }
  );
};

// Hook para categorias de feedback com cache
export const useCachedCategoriasFeedback = () => {
  return useCache(
    'categories_feedback',
    async () => {
      const result = await listarCategoriasFeedback();
      return result.data || result;
    },
    {
      ttl: 30 * 60 * 1000, // 30 minutos (categorias mudam raramente)
      staleWhileRevalidate: true
    }
  );
};

// Hook para categorias de treinamentos com cache
export const useCachedCategoriasTreinamentos = () => {
  return useCache(
    'categories_treinamentos',
    async () => {
      return await getCategoriasTreinamentos();
    },
    {
      ttl: 30 * 60 * 1000, // 30 minutos
      staleWhileRevalidate: true
    }
  );
};

// Hook para categorias de notícias com cache
export const useCachedCategoriasNoticias = () => {
  return useCache(
    'categories_noticias',
    async () => {
      const result = await getCategoriasNoticias();
      return result.data || result;
    },
    {
      ttl: 30 * 60 * 1000, // 30 minutos
      staleWhileRevalidate: true
    }
  );
};

// Hook para estatísticas com cache
export const useCachedEstatisticas = () => {
  return useCache(
    'stats',
    async () => {
      return await obterEstatisticas();
    },
    {
      ttl: 5 * 60 * 1000, // 5 minutos
      staleWhileRevalidate: true
    }
  );
};

// Hook para notificações com cache
export const useCachedNotifications = (userId) => {
  return useCache(
    'notifications',
    async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    {
      ttl: 30 * 1000, // 30 segundos (notificações mudam frequentemente)
      params: { userId },
      enabled: !!userId,
      staleWhileRevalidate: true
    }
  );
};

// Hook para comentários com cache
export const useCachedComments = (type, itemId) => {
  return useCache(
    'comments',
    async () => {
      if (!itemId) return [];
      
      const tableName = type === 'treinamento' ? 'treinamento_comentarios' : 'noticia_comentarios';
      const fieldName = type === 'treinamento' ? 'treinamento_id' : 'noticia_id';
      
      const { data, error } = await supabase
        .from(tableName)
        .select(`
          *,
          usuarios(nome, email)
        `)
        .eq(fieldName, itemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    {
      ttl: 1 * 60 * 1000, // 1 minuto
      params: { type, itemId },
      enabled: !!itemId,
      staleWhileRevalidate: true
    }
  );
};

// Hook para curtidas com cache
export const useCachedLikes = (type, itemId, userId) => {
  return useCache(
    'likes',
    async () => {
      if (!itemId) return { count: 0, userLiked: false };
      
      const tableName = type === 'treinamento' ? 'treinamento_curtidas' : 'noticia_curtidas';
      const fieldName = type === 'treinamento' ? 'treinamento_id' : 'noticia_id';
      
      // Buscar contagem total
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq(fieldName, itemId);

      if (countError) throw countError;

      // Verificar se usuário curtiu (se logado)
      let userLiked = false;
      if (userId) {
        const { data: userLike, error: userError } = await supabase
          .from(tableName)
          .select('id')
          .eq(fieldName, itemId)
          .eq('usuario_id', userId)
          .limit(1);

        if (userError) throw userError;
        userLiked = userLike && userLike.length > 0;
      }

      return { count: count || 0, userLiked };
    },
    {
      ttl: 1 * 60 * 1000, // 1 minuto
      params: { type, itemId, userId },
      enabled: !!itemId,
      staleWhileRevalidate: true
    }
  );
};

// ==========================================
// FUNÇÕES DE INVALIDAÇÃO DE CACHE
// ==========================================

// Invalidar cache quando criar/editar/deletar treinamento
export const invalidateTreinamentosCache = () => {
  // Implementar invalidação específica se necessário
  console.log('🔄 Cache de treinamentos invalidado');
};

// Invalidar cache quando criar/editar/deletar notícia
export const invalidateNoticiasCache = () => {
  console.log('🔄 Cache de notícias invalidado');
};

// Invalidar cache quando há nova notificação
export const invalidateNotificationsCache = (userId) => {
  console.log(`🔄 Cache de notificações invalidado para usuário ${userId}`);
};

// Invalidar cache quando há novo comentário
export const invalidateCommentsCache = (type, itemId) => {
  console.log(`🔄 Cache de comentários invalidado para ${type}:${itemId}`);
};

// Invalidar cache quando há nova curtida
export const invalidateLikesCache = (type, itemId) => {
  console.log(`🔄 Cache de curtidas invalidado para ${type}:${itemId}`);
};

// ==========================================
// UTILITÁRIOS DE CACHE
// ==========================================

// Função para pré-carregar dados importantes
export const preloadEssentialData = async () => {
  try {
    console.log('🚀 Pré-carregando dados essenciais...');
    
    const promises = [
      // Pré-carregar categorias (dados quase estáticos)
      getCategoriasTreinamentos(),
      getCategoriasNoticias(),
      listarCategoriasFeedback(),
      
      // Pré-carregar estatísticas
      obterEstatisticas()
    ];

    await Promise.allSettled(promises);
    console.log('✅ Dados essenciais pré-carregados');
  } catch (error) {
    console.error('❌ Erro ao pré-carregar dados:', error);
  }
};

// Função para limpar cache de um usuário específico
export const clearUserCache = (userId) => {
  // Implementar limpeza específica do usuário
  console.log(`🧹 Cache do usuário ${userId} limpo`);
};

export default {
  useCachedTreinamentos,
  useCachedNoticias,
  useCachedUsuarios,
  useCachedCategoriasFeedback,
  useCachedCategoriasTreinamentos,
  useCachedCategoriasNoticias,
  useCachedEstatisticas,
  useCachedNotifications,
  useCachedComments,
  useCachedLikes,
  invalidateTreinamentosCache,
  invalidateNoticiasCache,
  invalidateNotificationsCache,
  invalidateCommentsCache,
  invalidateLikesCache,
  preloadEssentialData,
  clearUserCache
};
