import { supabase } from '../lib/supabase';

// Buscar todas as categorias de notícias ativas
export const getCategoriasAtivas = async () => {
  try {

    
    const { data, error } = await supabase
      .from('categorias_noticias')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar categorias de notícias:', error);
      throw error;
    }


    return data || [];
  } catch (error) {
    console.error('❌ Erro no serviço getCategoriasAtivas (notícias):', error);
    throw error;
  }
};

// Buscar todas as categorias (incluindo inativas) - para admin
export const getTodasCategorias = async () => {
  try {

    
    const { data, error } = await supabase
      .from('categorias_noticias')
      .select('*')
      .order('ordem', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar todas as categorias de notícias:', error);
      throw error;
    }


    return data || [];
  } catch (error) {
    console.error('❌ Erro no serviço getTodasCategorias (notícias):', error);
    throw error;
  }
};

// Buscar categoria por ID
export const getCategoriaById = async (id) => {
  try {

    
    const { data, error } = await supabase
      .from('categorias_noticias')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar categoria de notícia por ID:', error);
      throw error;
    }


    return data;
  } catch (error) {
    console.error('❌ Erro no serviço getCategoriaById (notícias):', error);
    throw error;
  }
};

// Atualizar categoria (apenas para admin - notícias têm opções mais limitadas)
export const atualizarCategoria = async (id, categoriaData) => {
  try {

    
    const { data, error } = await supabase
      .from('categorias_noticias')
      .update(categoriaData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar categoria de notícia:', error);
      throw error;
    }


    return data;
  } catch (error) {
    console.error('❌ Erro no serviço atualizarCategoria (notícias):', error);
    throw error;
  }
};

// Desativar categoria (soft delete)
export const desativarCategoria = async (id) => {
  try {

    
    const { data, error } = await supabase
      .from('categorias_noticias')
      .update({ ativo: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao desativar categoria de notícia:', error);
      throw error;
    }

    console.log('✅ Categoria de notícia desativada com sucesso:', data.nome);
    return data;
  } catch (error) {
    console.error('❌ Erro no serviço desativarCategoria (notícias):', error);
    throw error;
  }
};

// Reativar categoria
export const reativarCategoria = async (id) => {
  try {
    console.log('🔄 Reativando categoria de notícia ID:', id);
    
    const { data, error } = await supabase
      .from('categorias_noticias')
      .update({ ativo: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao reativar categoria de notícia:', error);
      throw error;
    }

    console.log('✅ Categoria de notícia reativada com sucesso:', data.nome);
    return data;
  } catch (error) {
    console.error('❌ Erro no serviço reativarCategoria (notícias):', error);
    throw error;
  }
};

// Contar notícias por categoria
export const contarNoticiasPorCategoria = async (categoriaId) => {
  try {
    console.log('📊 Contando notícias da categoria:', categoriaId);
    
    // Verificar se a tabela noticias existe
    const { data: tabelas } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'noticias');

    if (!tabelas || tabelas.length === 0) {
      console.log('ℹ️ Tabela noticias não existe ainda');
      return 0;
    }

    const { count, error } = await supabase
      .from('noticias')
      .select('*', { count: 'exact', head: true })
      .eq('categoria_id', categoriaId);

    if (error) {
      console.error('❌ Erro ao contar notícias:', error);
      return 0;
    }

    console.log('✅ Notícias encontradas:', count);
    return count || 0;
  } catch (error) {
    console.error('❌ Erro no serviço contarNoticiasPorCategoria:', error);
    return 0;
  }
};

// Buscar categorias com contagem de notícias
export const getCategoriasComContagem = async () => {
  try {
    console.log('📊 Buscando categorias de notícias com contagem...');
    
    const categorias = await getCategoriasAtivas();
    
    const categoriasComContagem = await Promise.all(
      categorias.map(async (categoria) => {
        const count = await contarNoticiasPorCategoria(categoria.id);
        return {
          ...categoria,
          total_noticias: count
        };
      })
    );

    console.log('✅ Categorias de notícias com contagem carregadas');
    return categoriasComContagem;
  } catch (error) {
    console.error('❌ Erro no serviço getCategoriasComContagem (notícias):', error);
    throw error;
  }
};

// Reordenar categorias (apenas para admin)
export const reordenarCategorias = async (categoriasComNovaOrdem) => {
  try {
    console.log('🔄 Reordenando categorias de notícias...');
    
    const updates = categoriasComNovaOrdem.map(categoria => 
      supabase
        .from('categorias_noticias')
        .update({ ordem: categoria.ordem })
        .eq('id', categoria.id)
    );

    const results = await Promise.all(updates);
    
    // Verificar se houve erros
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('❌ Erros ao reordenar categorias de notícias:', errors);
      throw new Error('Erro ao reordenar algumas categorias de notícias');
    }

    console.log('✅ Categorias de notícias reordenadas com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro no serviço reordenarCategorias (notícias):', error);
    throw error;
  }
};

