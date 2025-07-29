import { supabase } from '../lib/supabase';

// Função auxiliar para processar IDs (suporta tanto INTEGER quanto UUID)
const processarId = (id) => {
  if (!id) return null;
  
  // Se é um número, retorna como está
  if (typeof id === 'number') return id;
  
  // Se é string, verifica se é um UUID ou número
  if (typeof id === 'string') {
    // Padrão UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (uuidPattern.test(id)) {
      // É UUID, retorna como string
      return id;
    } else {
      // Tenta converter para número
      const numId = parseInt(id);
      return isNaN(numId) ? id : numId;
    }
  }
  
  return id;
};

// Buscar comentários de um treinamento
export const getComentariosTreinamento = async (treinamentoId) => {
  try {
    console.log('Buscando comentários para treinamento:', treinamentoId);
    
    const { data: comentarios, error } = await supabase
      .from('treinamento_comentarios')
      .select('*')
      .eq('treinamento_id', treinamentoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar comentários:', error);
      return { error: error.message };
    }

    console.log('Comentários encontrados:', comentarios);

    // Buscar dados dos usuários separadamente
    if (comentarios && comentarios.length > 0) {
      const usuarioIds = [...new Set(comentarios.map(c => c.usuario_id))];
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome, email')
        .in('id', usuarioIds);

      // Combinar dados
      const comentariosComUsuarios = comentarios.map(comentario => ({
        ...comentario,
        usuarios: usuarios?.find(u => u.id === comentario.usuario_id) || { nome: 'Usuário', email: '' }
      }));

      return { data: comentariosComUsuarios };
    }

    return { data: comentarios || [] };
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    return { error: 'Erro interno do servidor' };
  }
};

// Criar novo comentário
export const criarComentario = async (treinamentoId, comentario, usuarioId) => {
  try {
    console.log('Criando comentário:', { treinamentoId, comentario, usuarioId });
    
    const { data, error } = await supabase
      .from('treinamento_comentarios')
      .insert([
        {
          treinamento_id: treinamentoId,
          usuario_id: usuarioId,
          comentario: comentario.trim()
        }
      ])
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao criar comentário:', error);
      return { error: error.message };
    }

    console.log('Comentário criado:', data);

    // Buscar dados do usuário separadamente
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .eq('id', usuarioId)
      .single();

    // Combinar dados
    const comentarioComUsuario = {
      ...data,
      usuarios: usuario || { nome: 'Usuário', email: '' }
    };

    return { data: comentarioComUsuario };
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    return { error: 'Erro interno do servidor' };
  }
};

// Editar comentário
export const editarComentario = async (comentarioId, novoComentario, usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('treinamento_comentarios')
      .update({ 
        comentario: novoComentario.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', comentarioId)
      .eq('usuario_id', usuarioId) // Garantir que só o autor pode editar
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao editar comentário:', error);
      return { error: error.message };
    }

    // Buscar dados do usuário separadamente
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .eq('id', usuarioId)
      .single();

    // Combinar dados
    const comentarioComUsuario = {
      ...data,
      usuarios: usuario || { nome: 'Usuário', email: '' }
    };

    return { data: comentarioComUsuario };
  } catch (error) {
    console.error('Erro ao editar comentário:', error);
    return { error: 'Erro interno do servidor' };
  }
};

// Deletar comentário
export const deletarComentario = async (comentarioId, usuarioId) => {
  try {
    const { error } = await supabase
      .from('treinamento_comentarios')
      .delete()
      .eq('id', comentarioId)
      .eq('usuario_id', usuarioId); // Garantir que só o autor pode deletar

    if (error) {
      console.error('Erro ao deletar comentário:', error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar comentário:', error);
    return { error: 'Erro interno do servidor' };
  }
};

// Contar comentários de um treinamento
export const contarComentarios = async (treinamentoId) => {
  try {
    const { count, error } = await supabase
      .from('treinamento_comentarios')
      .select('*', { count: 'exact', head: true })
      .eq('treinamento_id', treinamentoId);

    if (error) {
      console.error('Erro ao contar comentários:', error);
      return { error: error.message };
    }

    return { count: count || 0 };
  } catch (error) {
    console.error('Erro ao contar comentários:', error);
    return { error: 'Erro interno do servidor' };
  }
};

