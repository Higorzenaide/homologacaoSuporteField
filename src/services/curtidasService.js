import { supabase } from '../lib/supabase';

// Verificar se usuário curtiu um treinamento
export const verificarCurtida = async (treinamentoId, usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('treinamento_curtidas')
      .select('id')
      .eq('treinamento_id', treinamentoId)
      .eq('usuario_id', usuarioId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erro ao verificar curtida:', error);
      return { error: error.message };
    }

    return { curtido: !!data };
  } catch (error) {
    console.error('Erro ao verificar curtida:', error);
    return { error: 'Erro interno do servidor' };
  }
};

// Curtir/descurtir treinamento
export const toggleCurtida = async (treinamentoId, usuarioId) => {
  try {
    console.log('Toggle curtida:', { treinamentoId, usuarioId });
    
    // Verificar se já curtiu
    const { curtido } = await verificarCurtida(treinamentoId, usuarioId);
    
    if (curtido) {
      // Remover curtida
      const { error } = await supabase
        .from('treinamento_curtidas')
        .delete()
        .eq('treinamento_id', treinamentoId)
        .eq('usuario_id', usuarioId);
        
      if (error) {
        console.error('Erro ao remover curtida:', error);
        return { error: error.message };
      }
      
      return { data: { curtido: false } };
    } else {
      // Adicionar curtida
      const { error } = await supabase
        .from('treinamento_curtidas')
        .insert([{
          treinamento_id: treinamentoId,
          usuario_id: usuarioId
        }]);
        
      if (error) {
        console.error('Erro ao adicionar curtida:', error);
        return { error: error.message };
      }
      
      return { data: { curtido: true } };
    }
  } catch (error) {
    console.error('Erro ao curtir/descurtir:', error);
    return { error: 'Erro interno do servidor' };
  }
};

// Buscar curtidas de um treinamento
export const getCurtidasTreinamento = async (treinamentoId) => {
  try {
    // Converter ID para o tipo correto
    const treinamentoIdProcessed = parseInt(treinamentoId) || treinamentoId;
    
    const { data: curtidas, error } = await supabase
      .from('treinamento_curtidas')
      .select('*')
      .eq('treinamento_id', treinamentoIdProcessed)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar curtidas:', error);
      return { error: error.message };
    }

    // Buscar dados dos usuários separadamente
    if (curtidas && curtidas.length > 0) {
      const usuarioIds = [...new Set(curtidas.map(c => c.usuario_id))];
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome, email')
        .in('id', usuarioIds);

      // Combinar dados
      const curtidasComUsuarios = curtidas.map(curtida => ({
        ...curtida,
        usuarios: usuarios?.find(u => u.id === curtida.usuario_id) || { nome: 'Usuário', email: '' }
      }));

      return { data: curtidasComUsuarios };
    }

    return { data: curtidas || [] };
  } catch (error) {
    console.error('Erro ao buscar curtidas:', error);
    return { error: 'Erro interno do servidor' };
  }
};

// Contar curtidas de um treinamento
export const contarCurtidas = async (treinamentoId) => {
  try {
    const { count, error } = await supabase
      .from('treinamento_curtidas')
      .select('*', { count: 'exact', head: true })
      .eq('treinamento_id', treinamentoId);

    if (error) {
      console.error('Erro ao contar curtidas:', error);
      return { error: error.message };
    }

    return { count: count || 0 };
  } catch (error) {
    console.error('Erro ao contar curtidas:', error);
    return { error: 'Erro interno do servidor' };
  }
};

// Buscar usuários que curtiram um treinamento
export const getUsuariosCurtiram = async (treinamentoId, limite = 10) => {
  try {
    // Converter ID para o tipo correto
    const treinamentoIdProcessed = parseInt(treinamentoId) || treinamentoId;
    
    const { data: curtidas, error } = await supabase
      .from('treinamento_curtidas')
      .select('created_at, usuario_id')
      .eq('treinamento_id', treinamentoIdProcessed)
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error) {
      console.error('Erro ao buscar usuários que curtiram:', error);
      return { error: error.message };
    }

    // Buscar dados dos usuários separadamente
    if (curtidas && curtidas.length > 0) {
      const usuarioIds = [...new Set(curtidas.map(c => c.usuario_id))];
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome, email')
        .in('id', usuarioIds);

      // Combinar dados
      const curtidasComUsuarios = curtidas.map(curtida => ({
        ...curtida,
        usuarios: usuarios?.find(u => u.id === curtida.usuario_id) || { nome: 'Usuário', email: '' }
      }));

      return { data: curtidasComUsuarios };
    }

    return { data: curtidas || [] };
  } catch (error) {
    console.error('Erro ao buscar usuários que curtiram:', error);
    return { error: 'Erro interno do servidor' };
  }
};

