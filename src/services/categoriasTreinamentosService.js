import { supabase } from '../lib/supabase';

// Buscar todas as categorias de treinamentos ativas
export const getCategoriasAtivas = async () => {
  try {
    console.log('🔍 Buscando categorias de treinamentos ativas...');
    
    const { data, error } = await supabase
      .from('categorias_treinamentos')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      throw error;
    }

    console.log('✅ Categorias encontradas:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Erro no serviço getCategoriasAtivas:', error);
    throw error;
  }
};

// Buscar todas as categorias (incluindo inativas) - para admin
export const getTodasCategorias = async () => {
  try {
    console.log('🔍 Buscando todas as categorias de treinamentos...');
    
    const { data, error } = await supabase
      .from('categorias_treinamentos')
      .select('*')
      .order('ordem', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar todas as categorias:', error);
      throw error;
    }

    console.log('✅ Total de categorias encontradas:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Erro no serviço getTodasCategorias:', error);
    throw error;
  }
};

// Buscar categoria por ID
export const getCategoriaById = async (id) => {
  try {
    console.log('🔍 Buscando categoria por ID:', id);
    
    const { data, error } = await supabase
      .from('categorias_treinamentos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar categoria por ID:', error);
      throw error;
    }

    console.log('✅ Categoria encontrada:', data?.nome);
    return data;
  } catch (error) {
    console.error('❌ Erro no serviço getCategoriaById:', error);
    throw error;
  }
};

// Criar nova categoria
export const criarCategoria = async (categoriaData) => {
  try {
    console.log('➕ Criando nova categoria:', categoriaData);
    
    // Buscar a próxima ordem disponível
    const { data: ultimaCategoria } = await supabase
      .from('categorias_treinamentos')
      .select('ordem')
      .order('ordem', { ascending: false })
      .limit(1);

    const proximaOrdem = ultimaCategoria && ultimaCategoria.length > 0 
      ? ultimaCategoria[0].ordem + 1 
      : 1;

    const novaCategoria = {
      nome: categoriaData.nome,
      descricao: categoriaData.descricao || '',
      cor: categoriaData.cor || '#3B82F6',
      ativo: categoriaData.ativo !== undefined ? categoriaData.ativo : true,
      ordem: categoriaData.ordem || proximaOrdem
    };

    const { data, error } = await supabase
      .from('categorias_treinamentos')
      .insert([novaCategoria])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar categoria:', error);
      throw error;
    }

    console.log('✅ Categoria criada com sucesso:', data.nome);
    return data;
  } catch (error) {
    console.error('❌ Erro no serviço criarCategoria:', error);
    throw error;
  }
};

// Atualizar categoria
export const atualizarCategoria = async (id, categoriaData) => {
  try {
    console.log('📝 Atualizando categoria ID:', id, categoriaData);
    
    const { data, error } = await supabase
      .from('categorias_treinamentos')
      .update(categoriaData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar categoria:', error);
      throw error;
    }

    console.log('✅ Categoria atualizada com sucesso:', data.nome);
    return data;
  } catch (error) {
    console.error('❌ Erro no serviço atualizarCategoria:', error);
    throw error;
  }
};

// Desativar categoria (soft delete)
export const desativarCategoria = async (id) => {
  try {
    console.log('🗑️ Desativando categoria ID:', id);
    
    const { data, error } = await supabase
      .from('categorias_treinamentos')
      .update({ ativo: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao desativar categoria:', error);
      throw error;
    }

    console.log('✅ Categoria desativada com sucesso:', data.nome);
    return data;
  } catch (error) {
    console.error('❌ Erro no serviço desativarCategoria:', error);
    throw error;
  }
};

// Reativar categoria
export const reativarCategoria = async (id) => {
  try {
    console.log('🔄 Reativando categoria ID:', id);
    
    const { data, error } = await supabase
      .from('categorias_treinamentos')
      .update({ ativo: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao reativar categoria:', error);
      throw error;
    }

    console.log('✅ Categoria reativada com sucesso:', data.nome);
    return data;
  } catch (error) {
    console.error('❌ Erro no serviço reativarCategoria:', error);
    throw error;
  }
};

// Reordenar categorias
export const reordenarCategorias = async (categoriasComNovaOrdem) => {
  try {
    console.log('🔄 Reordenando categorias...');
    
    const updates = categoriasComNovaOrdem.map(categoria => 
      supabase
        .from('categorias_treinamentos')
        .update({ ordem: categoria.ordem })
        .eq('id', categoria.id)
    );

    const results = await Promise.all(updates);
    
    // Verificar se houve erros
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('❌ Erros ao reordenar categorias:', errors);
      throw new Error('Erro ao reordenar algumas categorias');
    }

    console.log('✅ Categorias reordenadas com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro no serviço reordenarCategorias:', error);
    throw error;
  }
};

// Contar treinamentos por categoria
export const contarTreinamentosPorCategoria = async (categoriaId) => {
  try {
    console.log('📊 Contando treinamentos da categoria:', categoriaId);
    
    const { count, error } = await supabase
      .from('treinamentos')
      .select('*', { count: 'exact', head: true })
      .eq('categoria_id', categoriaId);

    if (error) {
      console.error('❌ Erro ao contar treinamentos:', error);
      throw error;
    }

    console.log('✅ Treinamentos encontrados:', count);
    return count || 0;
  } catch (error) {
    console.error('❌ Erro no serviço contarTreinamentosPorCategoria:', error);
    return 0;
  }
};

// Buscar categorias com contagem de treinamentos
export const getCategoriasComContagem = async () => {
  try {
    console.log('📊 Buscando categorias com contagem de treinamentos...');
    
    const categorias = await getCategoriasAtivas();
    
    const categoriasComContagem = await Promise.all(
      categorias.map(async (categoria) => {
        const count = await contarTreinamentosPorCategoria(categoria.id);
        return {
          ...categoria,
          total_treinamentos: count
        };
      })
    );

    console.log('✅ Categorias com contagem carregadas');
    return categoriasComContagem;
  } catch (error) {
    console.error('❌ Erro no serviço getCategoriasComContagem:', error);
    throw error;
  }
};

