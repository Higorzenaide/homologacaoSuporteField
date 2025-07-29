import { supabase } from '../lib/supabase';

// Buscar todos os links ativos (para usuários não autenticados)
export const getLinksAtivos = async () => {
  try {
    const { data, error } = await supabase
      .from('links_importantes')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Erro ao buscar links ativos:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro na função getLinksAtivos:', error);
    return { success: false, error: error.message };
  }
};

// Buscar todos os links (para administradores)
export const getTodosLinks = async () => {
  try {
    const { data, error } = await supabase
      .from('links_importantes')
      .select('*')
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Erro ao buscar todos os links:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro na função getTodosLinks:', error);
    return { success: false, error: error.message };
  }
};

// Criar novo link
export const criarLink = async (linkData) => {
  try {
    const { data, error } = await supabase
      .from('links_importantes')
      .insert([{
        titulo: linkData.titulo,
        url: linkData.url,
        descricao: linkData.descricao || '',
        icone: linkData.icone || 'link',
        cor: linkData.cor || 'blue',
        ordem: linkData.ordem || 0,
        ativo: linkData.ativo !== undefined ? linkData.ativo : true
      }])
      .select();

    if (error) {
      console.error('Erro ao criar link:', error);
      throw error;
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Erro na função criarLink:', error);
    return { success: false, error: error.message };
  }
};

// Atualizar link existente
export const atualizarLink = async (id, linkData) => {
  try {
    const { data, error } = await supabase
      .from('links_importantes')
      .update({
        titulo: linkData.titulo,
        url: linkData.url,
        descricao: linkData.descricao,
        icone: linkData.icone,
        cor: linkData.cor,
        ordem: linkData.ordem,
        ativo: linkData.ativo
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Erro ao atualizar link:', error);
      throw error;
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Erro na função atualizarLink:', error);
    return { success: false, error: error.message };
  }
};

// Excluir link
export const excluirLink = async (id) => {
  try {
    const { error } = await supabase
      .from('links_importantes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir link:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Erro na função excluirLink:', error);
    return { success: false, error: error.message };
  }
};

// Ativar/Desativar link (soft delete)
export const toggleAtivoLink = async (id, ativo) => {
  try {
    const { data, error } = await supabase
      .from('links_importantes')
      .update({ ativo })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Erro ao alterar status do link:', error);
      throw error;
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Erro na função toggleAtivoLink:', error);
    return { success: false, error: error.message };
  }
};

// Reordenar links
export const reordenarLinks = async (links) => {
  try {
    const updates = links.map((link, index) => ({
      id: link.id,
      ordem: index + 1
    }));

    const promises = updates.map(update =>
      supabase
        .from('links_importantes')
        .update({ ordem: update.ordem })
        .eq('id', update.id)
    );

    await Promise.all(promises);

    return { success: true };
  } catch (error) {
    console.error('Erro na função reordenarLinks:', error);
    return { success: false, error: error.message };
  }
};

// Obter próxima ordem disponível
export const getProximaOrdem = async () => {
  try {
    const { data, error } = await supabase
      .from('links_importantes')
      .select('ordem')
      .order('ordem', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Erro ao buscar próxima ordem:', error);
      throw error;
    }

    const proximaOrdem = data.length > 0 ? data[0].ordem + 1 : 1;
    return { success: true, data: proximaOrdem };
  } catch (error) {
    console.error('Erro na função getProximaOrdem:', error);
    return { success: false, error: error.message };
  }
};

