import { supabase } from '../lib/supabase';

// Buscar comentários de uma notícia
export const getComentariosNoticia = async (noticiaId) => {
  try {
    const { data, error } = await supabase
      .from('comentarios_noticias')
      .select(`
        *,
        usuarios (
          id,
          nome
        )
      `)
      .eq('noticia_id', noticiaId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    return { data: [], error: error.message };
  }
};

// Criar novo comentário
export const criarComentarioNoticia = async (noticiaId, comentario, usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('comentarios_noticias')
      .insert({
        noticia_id: noticiaId,
        usuario_id: usuarioId,
        comentario: comentario.trim()
      })
      .select(`
        *,
        usuarios (
          id,
          nome
        )
      `)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    return { data: null, error: error.message };
  }
};

// Editar comentário
export const editarComentarioNoticia = async (comentarioId, novoComentario, usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('comentarios_noticias')
      .update({
        comentario: novoComentario.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', comentarioId)
      .eq('usuario_id', usuarioId) // Garantir que só o autor pode editar
      .select(`
        *,
        usuarios (
          id,
          nome
        )
      `)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Erro ao editar comentário:', error);
    return { data: null, error: error.message };
  }
};

// Deletar comentário
export const deletarComentarioNoticia = async (comentarioId, usuarioId) => {
  try {
    const { error } = await supabase
      .from('comentarios_noticias')
      .delete()
      .eq('id', comentarioId)
      .eq('usuario_id', usuarioId); // Garantir que só o autor pode deletar

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Erro ao deletar comentário:', error);
    return { error: error.message };
  }
};

// Contar comentários de uma notícia
export const contarComentariosNoticia = async (noticiaId) => {
  try {
    const { count, error } = await supabase
      .from('comentarios_noticias')
      .select('*', { count: 'exact', head: true })
      .eq('noticia_id', noticiaId);

    if (error) throw error;

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Erro ao contar comentários:', error);
    return { count: 0, error: error.message };
  }
};

// Buscar comentários recentes (para dashboard)
export const getComentariosRecentesNoticias = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('comentarios_noticias')
      .select(`
        *,
        usuarios (
          id,
          nome
        ),
        noticias (
          id,
          titulo
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erro ao buscar comentários recentes:', error);
    return { data: [], error: error.message };
  }
};

// Buscar estatísticas de comentários por notícia
export const getEstatisticasComentariosNoticias = async () => {
  try {
    const { data, error } = await supabase
      .from('comentarios_noticias')
      .select(`
        noticia_id,
        noticias (
          titulo
        )
      `);

    if (error) throw error;

    // Agrupar por notícia e contar
    const estatisticas = data.reduce((acc, comentario) => {
      const noticiaId = comentario.noticia_id;
      if (!acc[noticiaId]) {
        acc[noticiaId] = {
          noticia_id: noticiaId,
          titulo: comentario.noticias?.titulo || 'Notícia não encontrada',
          total_comentarios: 0
        };
      }
      acc[noticiaId].total_comentarios++;
      return acc;
    }, {});

    return { 
      data: Object.values(estatisticas).sort((a, b) => b.total_comentarios - a.total_comentarios), 
      error: null 
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return { data: [], error: error.message };
  }
};

