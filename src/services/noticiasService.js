import { supabase } from '../lib/supabase';

// Buscar todas as notícias
export const getNoticias = async () => {
  try {
    const { data, error } = await supabase
      .from('noticias')
      .select(`
        *,
        categorias (
          id,
          nome,
          cor
        )
      `)
      .eq('ativo', true)
      .order('data_publicacao', { ascending: false });

    if (error) throw error;

    // Processar dados para compatibilidade com o frontend existente
    const processedData = data.map(item => ({
      id: item.id,
      titulo: item.titulo,
      conteudo: item.conteudo,
      categoria: item.categorias?.nome || item.categoria_nome || 'Geral',
      categoria_nome: item.categorias?.nome || item.categoria_nome || 'Geral',
      data_publicacao: item.data_publicacao,
      dataPublicacao: item.data_publicacao ? item.data_publicacao.split('T')[0] : new Date().toISOString().split('T')[0],
      autor: item.autor,
      destaque: item.destaque,
      created_at: item.created_at
    }));

    return { data: processedData, error: null };
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    return { data: [], error };
  }
};

// Buscar notícia por ID
export const getNoticiaById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('noticias')
      .select(`
        *,
        categorias (
          id,
          nome,
          cor
        )
      `)
      .eq('id', id)
      .eq('ativo', true)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar notícia:', error);
    return { data: null, error };
  }
};

// Criar nova notícia
export const createNoticia = async (noticiaData) => {
  try {
    // Buscar categoria_id se fornecido nome da categoria
    let categoria_id = null;
    if (noticiaData.categoria) {
      const { data: categoriaData } = await supabase
        .from('categorias')
        .select('id')
        .eq('nome', noticiaData.categoria)
        .eq('tipo', 'noticia')
        .single();
      
      categoria_id = categoriaData?.id;
    }

    const { data, error } = await supabase
      .from('noticias')
      .insert([{
        titulo: noticiaData.titulo,
        conteudo: noticiaData.conteudo,
        categoria_id,
        categoria_nome: noticiaData.categoria,
        autor: noticiaData.autor || 'Administrador',
        destaque: noticiaData.destaque || false,
        data_publicacao: noticiaData.data_publicacao || new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao criar notícia:', error);
    return { data: null, error };
  }
};

// Atualizar notícia
export const updateNoticia = async (id, noticiaData) => {
  try {
    let updateData = { ...noticiaData };

    // Buscar categoria_id se fornecido nome da categoria
    if (noticiaData.categoria) {
      const { data: categoriaData } = await supabase
        .from('categorias')
        .select('id')
        .eq('nome', noticiaData.categoria)
        .eq('tipo', 'noticia')
        .single();
      
      updateData.categoria_id = categoriaData?.id;
      updateData.categoria_nome = noticiaData.categoria;
    }

    const { data, error } = await supabase
      .from('noticias')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao atualizar notícia:', error);
    return { data, error };
  }
};

// Buscar categorias de notícias
export const getCategoriasNoticias = async () => {
  try {
    // Primeiro, tentar buscar da tabela categorias
    const { data: categoriasData, error: categoriasError } = await supabase
      .from('categorias')
      .select('*')
      .eq('tipo', 'noticia')
      .order('nome');

    // Se a tabela categorias existir e tiver dados, usar ela
    if (!categoriasError && categoriasData && categoriasData.length > 0) {
      return categoriasData;
    }

    // Caso contrário, retornar categorias padrão
    const categoriasDefault = [
      { id: 1, nome: 'Equipamentos', tipo: 'noticia', cor: '#EF4444' },
      { id: 2, nome: 'Ferramentas', tipo: 'noticia', cor: '#F59E0B' },
      { id: 3, nome: 'Resultados', tipo: 'noticia', cor: '#10B981' },
      { id: 4, nome: 'Segurança', tipo: 'noticia', cor: '#3B82F6' },
      { id: 5, nome: 'Treinamento', tipo: 'noticia', cor: '#8B5CF6' }
    ];

    return categoriasDefault;
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    
    // Em caso de erro, retornar categorias padrão
    const categoriasDefault = [
      { id: 1, nome: 'Equipamentos', tipo: 'noticia', cor: '#EF4444' },
      { id: 2, nome: 'Ferramentas', tipo: 'noticia', cor: '#F59E0B' },
      { id: 3, nome: 'Resultados', tipo: 'noticia', cor: '#10B981' },
      { id: 4, nome: 'Segurança', tipo: 'noticia', cor: '#3B82F6' },
      { id: 5, nome: 'Treinamento', tipo: 'noticia', cor: '#8B5CF6' }
    ];

    return categoriasDefault;
  }
};

// Buscar notícias em destaque
export const getNoticiasDestaque = async (limit = 2) => {
  try {
    const { data, error } = await supabase
      .from('noticias')
      .select(`
        *,
        categorias (
          id,
          nome,
          cor
        )
      `)
      .eq('ativo', true)
      .eq('destaque', true)
      .order('data_publicacao', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Processar dados para compatibilidade
    const processedData = data.map(item => ({
      id: item.id,
      titulo: item.titulo,
      conteudo: item.conteudo,
      categoria: item.categorias?.nome || item.categoria_nome || 'Geral',
      dataPublicacao: item.data_publicacao.split('T')[0],
      autor: item.autor,
      destaque: item.destaque
    }));

    return { data: processedData, error: null };
  } catch (error) {
    console.error('Erro ao buscar notícias em destaque:', error);
    return { data: [], error };
  }
};

// Alternar destaque da notícia
export const toggleDestaque = async (id, destaque) => {
  try {
    const { data, error } = await supabase
      .from('noticias')
      .update({ destaque })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao alterar destaque:', error);
    return { data: null, error };
  }
};



// Editar notícia existente
export const editNoticia = async (id, noticiaData) => {
  try {
    // Buscar categoria_id se fornecido nome da categoria
    let categoria_id = null;
    if (noticiaData.categoria) {
      const { data: categoriaData } = await supabase
        .from('categorias')
        .select('id')
        .eq('nome', noticiaData.categoria)
        .eq('tipo', 'noticia')
        .single();
      
      categoria_id = categoriaData?.id;
    }

    const updateData = {
      titulo: noticiaData.titulo,
      conteudo: noticiaData.conteudo,
      categoria_id,
      categoria_nome: noticiaData.categoria,
      autor: noticiaData.autor,
      destaque: noticiaData.destaque || false,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('noticias')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao editar notícia:', error);
    return { data: null, error };
  }
};

// Excluir notícia (soft delete)
export const deleteNoticia = async (id) => {
  try {
    const { data, error } = await supabase
      .from('noticias')
      .update({ 
        ativo: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao deletar notícia:', error);
    return { data: null, error };
  }
};

