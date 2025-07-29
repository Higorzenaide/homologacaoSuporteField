import { supabase } from '../lib/supabase.js';

// Serviço para gerenciar curtidas e comentários dos treinamentos

// ==================== CURTIDAS ====================

/**
 * Curtir ou descurtir um treinamento
 * @param {number} treinamentoId - ID do treinamento
 * @param {number} usuarioId - ID do usuário
 * @returns {Promise<Object>} Resultado da operação
 */
export const toggleCurtidaTreinamento = async (treinamentoId, usuarioId) => {
  try {
    const { data, error } = await supabase.rpc('toggle_curtida_treinamento', {
      p_treinamento_id: treinamentoId,
      p_usuario_id: usuarioId
    });

    if (error) {
      console.error('Erro ao curtir/descurtir treinamento:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro no toggleCurtidaTreinamento:', error);
    throw error;
  }
};

/**
 * Obter curtidas de um treinamento
 * @param {number} treinamentoId - ID do treinamento
 * @returns {Promise<Array>} Lista de curtidas
 */
export const getCurtidasTreinamento = async (treinamentoId) => {
  try {
    const { data, error } = await supabase
      .from('treinamento_curtidas')
      .select(`
        id,
        created_at,
        usuario_id,
        usuarios!inner (
          id,
          nome,
          email
        )
      `)
      .eq('treinamento_id', treinamentoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar curtidas:', error);
      throw error;
    }

    return data.map(curtida => ({
      id: curtida.id,
      usuario_id: curtida.usuario_id,
      nome_usuario: curtida.usuarios.nome,
      email_usuario: curtida.usuarios.email,
      created_at: curtida.created_at
    }));
  } catch (error) {
    console.error('Erro no getCurtidasTreinamento:', error);
    throw error;
  }
};

/**
 * Verificar se usuário curtiu um treinamento
 * @param {number} treinamentoId - ID do treinamento
 * @param {number} usuarioId - ID do usuário
 * @returns {Promise<boolean>} True se curtiu, false caso contrário
 */
export const verificarCurtida = async (treinamentoId, usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('treinamento_curtidas')
      .select('id')
      .eq('treinamento_id', treinamentoId)
      .eq('usuario_id', usuarioId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Erro ao verificar curtida:', error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Erro no verificarCurtida:', error);
    return false;
  }
};

// ==================== COMENTÁRIOS ====================

/**
 * Adicionar comentário a um treinamento
 * @param {number} treinamentoId - ID do treinamento
 * @param {number} usuarioId - ID do usuário
 * @param {string} comentario - Texto do comentário
 * @returns {Promise<Object>} Comentário criado
 */
export const adicionarComentario = async (treinamentoId, usuarioId, comentario) => {
  try {
    const { data, error } = await supabase
      .from('treinamento_comentarios')
      .insert({
        treinamento_id: treinamentoId,
        usuario_id: usuarioId,
        comentario: comentario.trim()
      })
      .select(`
        id,
        comentario,
        created_at,
        updated_at,
        usuario_id,
        usuarios!inner (
          id,
          nome,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Erro ao adicionar comentário:', error);
      throw error;
    }

    return {
      id: data.id,
      comentario: data.comentario,
      usuario_id: data.usuario_id,
      nome_usuario: data.usuarios.nome,
      email_usuario: data.usuarios.email,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Erro no adicionarComentario:', error);
    throw error;
  }
};

/**
 * Obter comentários de um treinamento
 * @param {number} treinamentoId - ID do treinamento
 * @returns {Promise<Array>} Lista de comentários
 */
export const getComentariosTreinamento = async (treinamentoId) => {
  try {
    const { data, error } = await supabase
      .from('treinamento_comentarios')
      .select(`
        id,
        comentario,
        created_at,
        updated_at,
        usuario_id,
        usuarios!inner (
          id,
          nome,
          email
        )
      `)
      .eq('treinamento_id', treinamentoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar comentários:', error);
      throw error;
    }

    return data.map(comentario => ({
      id: comentario.id,
      comentario: comentario.comentario,
      usuario_id: comentario.usuario_id,
      nome_usuario: comentario.usuarios.nome,
      email_usuario: comentario.usuarios.email,
      created_at: comentario.created_at,
      updated_at: comentario.updated_at
    }));
  } catch (error) {
    console.error('Erro no getComentariosTreinamento:', error);
    throw error;
  }
};

/**
 * Editar comentário
 * @param {number} comentarioId - ID do comentário
 * @param {number} usuarioId - ID do usuário (para verificação de permissão)
 * @param {string} novoComentario - Novo texto do comentário
 * @returns {Promise<Object>} Comentário editado
 */
export const editarComentario = async (comentarioId, usuarioId, novoComentario) => {
  try {
    const { data, error } = await supabase
      .from('treinamento_comentarios')
      .update({
        comentario: novoComentario.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', comentarioId)
      .eq('usuario_id', usuarioId) // Só permite editar próprios comentários
      .select(`
        id,
        comentario,
        created_at,
        updated_at,
        usuario_id,
        usuarios!inner (
          id,
          nome,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Erro ao editar comentário:', error);
      throw error;
    }

    return {
      id: data.id,
      comentario: data.comentario,
      usuario_id: data.usuario_id,
      nome_usuario: data.usuarios.nome,
      email_usuario: data.usuarios.email,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Erro no editarComentario:', error);
    throw error;
  }
};

/**
 * Excluir comentário
 * @param {number} comentarioId - ID do comentário
 * @param {number} usuarioId - ID do usuário (para verificação de permissão)
 * @returns {Promise<boolean>} True se excluído com sucesso
 */
export const excluirComentario = async (comentarioId, usuarioId) => {
  try {
    const { error } = await supabase
      .from('treinamento_comentarios')
      .delete()
      .eq('id', comentarioId)
      .eq('usuario_id', usuarioId); // Só permite excluir próprios comentários

    if (error) {
      console.error('Erro ao excluir comentário:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Erro no excluirComentario:', error);
    throw error;
  }
};

// ==================== ESTATÍSTICAS ====================

/**
 * Obter estatísticas completas de um treinamento
 * @param {number} treinamentoId - ID do treinamento
 * @returns {Promise<Object>} Estatísticas do treinamento
 */
export const getEstatisticasTreinamento = async (treinamentoId) => {
  try {
    const [curtidas, comentarios] = await Promise.all([
      getCurtidasTreinamento(treinamentoId),
      getComentariosTreinamento(treinamentoId)
    ]);

    return {
      total_curtidas: curtidas.length,
      total_comentarios: comentarios.length,
      usuarios_curtidas: curtidas,
      comentarios_recentes: comentarios.slice(0, 5) // Últimos 5 comentários
    };
  } catch (error) {
    console.error('Erro no getEstatisticasTreinamento:', error);
    throw error;
  }
};

/**
 * Obter treinamentos com estatísticas completas
 * @returns {Promise<Array>} Lista de treinamentos com estatísticas
 */
export const getTreinamentosComEstatisticas = async () => {
  try {
    const { data, error } = await supabase
      .from('treinamentos_com_estatisticas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar treinamentos com estatísticas:', error);
      throw error;
    }

    return data.map(treinamento => ({
      ...treinamento,
      // Garantir que os campos JSON sejam arrays válidos
      usuarios_curtidas: Array.isArray(treinamento.usuarios_curtidas) 
        ? treinamento.usuarios_curtidas 
        : [],
      comentarios_recentes: Array.isArray(treinamento.comentarios_recentes) 
        ? treinamento.comentarios_recentes 
        : [],
      // Converter datas
      created_at: new Date(treinamento.created_at),
      dataUpload: treinamento.data_upload ? new Date(treinamento.data_upload) : null
    }));
  } catch (error) {
    console.error('Erro no getTreinamentosComEstatisticas:', error);
    throw error;
  }
};

// ==================== UPLOAD DE LOGO ====================

/**
 * Upload de logo para treinamento
 * @param {File} file - Arquivo da logo
 * @param {number} treinamentoId - ID do treinamento
 * @returns {Promise<string>} URL da logo
 */
export const uploadLogoTreinamento = async (file, treinamentoId) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `logos/treinamento_${treinamentoId}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('arquivos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erro no upload da logo:', error);
      throw error;
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('arquivos')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Erro no uploadLogoTreinamento:', error);
    throw error;
  }
};

/**
 * Remover logo de treinamento
 * @param {string} logoUrl - URL da logo a ser removida
 * @returns {Promise<boolean>} True se removida com sucesso
 */
export const removerLogoTreinamento = async (logoUrl) => {
  try {
    if (!logoUrl) return true;

    // Extrair o path do arquivo da URL
    const urlParts = logoUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `logos/${fileName}`;

    const { error } = await supabase.storage
      .from('arquivos')
      .remove([filePath]);

    if (error) {
      console.error('Erro ao remover logo:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Erro no removerLogoTreinamento:', error);
    throw error;
  }
};

