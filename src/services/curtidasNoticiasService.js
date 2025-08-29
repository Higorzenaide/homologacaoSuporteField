import { supabase } from '../lib/supabase';

// Verificar se o usuário curtiu uma notícia
export const verificarCurtidaNoticia = async (noticiaId, usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('curtidas_noticias')
      .select('*')
      .eq('noticia_id', noticiaId)
      .eq('usuario_id', usuarioId)
      .limit(1);

    if (error) {
      console.error('Erro ao verificar curtida:', error);
      return { error: error.message, curtido: false };
    }

    return { curtido: data && data.length > 0, error: null };
  } catch (error) {
    console.error('Erro ao verificar curtida:', error);
    return { error: error.message, curtido: false };
  }
};

// Alternar curtida (curtir/descurtir)
export const toggleCurtidaNoticia = async (noticiaId, usuarioId) => {
  try {
    // Primeiro verificar se já existe
    const { data: existingCurtidas } = await supabase
      .from('curtidas_noticias')
      .select('*')
      .eq('noticia_id', noticiaId)
      .eq('usuario_id', usuarioId)
      .limit(1);

    const existingCurtida = existingCurtidas && existingCurtidas.length > 0 ? existingCurtidas[0] : null;
    let curtido;
    
    if (existingCurtida) {
      // Se existe, remover (descurtir)
      const { error } = await supabase
        .from('curtidas_noticias')
        .delete()
        .eq('noticia_id', noticiaId)
        .eq('usuario_id', usuarioId);

      if (error) throw error;
      curtido = false;
    } else {
      // Se não existe, adicionar (curtir)
      const { error } = await supabase
        .from('curtidas_noticias')
        .insert({
          noticia_id: noticiaId,
          usuario_id: usuarioId
        });

      if (error) throw error;
      curtido = true;
    }

    // Contar total de curtidas
    const { count } = await supabase
      .from('curtidas_noticias')
      .select('*', { count: 'exact', head: true })
      .eq('noticia_id', noticiaId);

    return {
      data: {
        curtido,
        total_curtidas: count || 0
      },
      error: null
    };
  } catch (error) {
    console.error('Erro ao alternar curtida:', error);
    return { error: error.message, data: null };
  }
};

// Contar curtidas de uma notícia
export const contarCurtidasNoticia = async (noticiaId) => {
  try {
    const { count, error } = await supabase
      .from('curtidas_noticias')
      .select('*', { count: 'exact', head: true })
      .eq('noticia_id', noticiaId);

    if (error) throw error;

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Erro ao contar curtidas:', error);
    return { count: 0, error: error.message };
  }
};

// Obter usuários que curtiram uma notícia
export const getUsuariosCurtiramNoticia = async (noticiaId, limit = 5) => {
  try {
    const { data, error } = await supabase
      .from('curtidas_noticias')
      .select(`
        usuario_id,
        created_at,
        usuarios (
          id,
          nome
        )
      `)
      .eq('noticia_id', noticiaId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erro ao buscar usuários que curtiram:', error);
    return { data: [], error: error.message };
  }
};

// Obter estatísticas de curtidas por notícia
export const getEstatisticasCurtidasNoticias = async () => {
  try {
    const { data, error } = await supabase
      .from('curtidas_noticias')
      .select(`
        noticia_id,
        noticias (
          titulo
        )
      `);

    if (error) throw error;

    // Agrupar por notícia e contar
    const estatisticas = data.reduce((acc, curtida) => {
      const noticiaId = curtida.noticia_id;
      if (!acc[noticiaId]) {
        acc[noticiaId] = {
          noticia_id: noticiaId,
          titulo: curtida.noticias?.titulo || 'Notícia não encontrada',
          total_curtidas: 0
        };
      }
      acc[noticiaId].total_curtidas++;
      return acc;
    }, {});

    return { 
      data: Object.values(estatisticas).sort((a, b) => b.total_curtidas - a.total_curtidas), 
      error: null 
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return { data: [], error: error.message };
  }
};

