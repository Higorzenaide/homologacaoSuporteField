import { supabase, uploadFile, deleteFile, generateUniqueFileName, generateFilePath, getFileUrl } from '../lib/supabase';

// Buscar todos os treinamentos
export const getTreinamentos = async () => {
  try {
    const { data, error } = await supabase
      .from('treinamentos')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const processedData = data.map(item => ({
      id: item.id,
      titulo: item.titulo,
      categoria: item.categoria_nome || item.tipo || 'documento',
      categoria_nome: item.categoria_nome,
      arquivo: item.arquivo_url,
      arquivo_url: item.arquivo_url,
      tipo: item.tipo,
      dataUpload: item.created_at
        ? new Date(item.created_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      descricao: item.descricao,
      logo_url: item.logo_url,
      visualizacoes: item.visualizacoes || 0,
      created_at: item.created_at,
      tags: item.tags ? item.tags.split(',').map(tag => tag.trim()) : []
    }));

    return { data: processedData, error: null };
  } catch (error) {
    console.error('Erro ao buscar treinamentos:', error);
    return { data: [], error };
  }
};


export const getTreinamentoById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('treinamentos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Converte a string de tags em array
    const processedData = {
      ...data,
      tags: data?.tags ? data.tags.split(',').map(tag => tag.trim()) : []
    };

    return { data: processedData, error: null };
  } catch (error) {
    console.error('Erro ao buscar treinamento:', error);
    return { data: null, error };
  }
};

// Criar novo treinamento
export const createTreinamento = async (treinamentoData, file) => {
  try {
    let arquivo_url = null;

    // Upload do arquivo se fornecido
    if (file) {
      const uniqueFileName = generateUniqueFileName(file.name);
      const filePath = generateFilePath('treinamentos', uniqueFileName);
      
      const uploadResult = await uploadFile(file, filePath);
      if (uploadResult.error) throw uploadResult.error;

      arquivo_url = getFileUrl(filePath);
    }

    // Inserir treinamento no banco
    const { data, error } = await supabase
      .from('treinamentos')
      .insert([{
        titulo: treinamentoData.titulo,
        ativo: true,
        descricao: treinamentoData.descricao || '',
        tipo: treinamentoData.tipo || 'documento',
        categoria_nome: treinamentoData.categoria,
        arquivo_url,
        tags: treinamentoData.tags?.join(', ') || '', // <- converte array para string
        obrigatorio: treinamentoData.obrigatorio || false,
        prazo_limite: treinamentoData.prazo_limite || null
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao criar treinamento:', error);
    return { data: null, error };
  }
};

// Atualizar treinamento
export const updateTreinamento = async (id, treinamentoData, file, logoFile) => {
  try {
    let updateData = { ...treinamentoData };

    // Upload do novo arquivo se fornecido
    if (file) {
      // Buscar arquivo atual para deletar
      const { data: currentData } = await supabase
        .from('treinamentos')
        .select('arquivo_url')
        .eq('id', id)
        .single();

      // Deletar arquivo antigo se existir
      if (currentData?.arquivo_url) {
        const oldFilePath = currentData.arquivo_url.split('/').pop();
        await deleteFile(oldFilePath);
      }

      // Upload do novo arquivo
      const uniqueFileName = generateUniqueFileName(file.name);
      const filePath = generateFilePath(treinamentoData.categoria.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(), uniqueFileName);
      
      const uploadResult = await uploadFile(file, filePath);
      if (uploadResult.error) throw uploadResult.error;

      updateData.arquivo_url = getFileUrl(filePath);
      updateData.arquivo_nome = file.name;
      updateData.arquivo_tamanho = file.size;
    }

    // Upload da nova logo se fornecida
    if (logoFile) {
      // Buscar logo atual para deletar
      const { data: currentData } = await supabase
        .from('treinamentos')
        .select('logo_url')
        .eq('id', id)
        .single();

      // Deletar logo antiga se existir
      if (currentData?.logo_url) {
        const oldLogoPath = currentData.logo_url.split('/').pop();
        await deleteFile(oldLogoPath);
      }

      // Upload da nova logo
      const logoFileName = generateUniqueFileName(`logo_${logoFile.name}`);
      const logoPath = generateFilePath('logos', logoFileName);
      
      const logoUploadResult = await uploadFile(logoFile, logoPath);
      if (logoUploadResult.error) {
        console.error('Erro no upload da logo:', logoUploadResult.error);
      } else {
        updateData.logo_url = getFileUrl(logoPath);
      }
    }

    // Atualizar categoria se fornecida
    if (treinamentoData.categoria) {
      updateData.categoria_nome = treinamentoData.categoria;
    }

    // Incluir campos de treinamento obrigatório
    if (treinamentoData.obrigatorio !== undefined) {
      updateData.obrigatorio = treinamentoData.obrigatorio;
    }
    if (treinamentoData.prazo_limite !== undefined) {
      updateData.prazo_limite = treinamentoData.prazo_limite;
    }

    const { data, error } = await supabase
      .from('treinamentos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao atualizar treinamento:', error);
    return { data: null, error };
  }
};

// Incrementar contador de visualizações
export const incrementVisualizacoes = async (id) => {
  try {
    // Primeiro buscar o valor atual
    const { data: currentData, error: fetchError } = await supabase
      .from('treinamentos')
      .select('visualizacoes')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const currentViews = currentData?.visualizacoes || 0;
    
    // Atualizar com o novo valor
    const { data, error } = await supabase
      .from('treinamentos')
      .update({ visualizacoes: currentViews + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao incrementar visualizações:', error);
    return { data: null, error };
  }
};

// Incrementar contador de downloads
export const incrementDownloads = async (id) => {
  try {
    const { data, error } = await supabase
      .from('treinamentos')
      .update({ downloads: supabase.raw('downloads + 1') })
      .eq('id', id);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao incrementar downloads:', error);
    return { data: null, error };
  }
};

// Buscar categorias de treinamentos
export const getCategoriasTreinamentos = async () => {
  try {
    console.log('🔍 Buscando categorias de treinamentos...');
    
    // Buscar da nova tabela categorias_treinamentos
    const { data: categoriasData, error: categoriasError } = await supabase
      .from('categorias_treinamentos')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (categoriasError) {
      console.error('❌ Erro ao buscar categorias:', categoriasError);
      throw categoriasError;
    }

    console.log('✅ Categorias encontradas:', categoriasData?.length || 0);
    return categoriasData || [];
  } catch (error) {
    console.error('❌ Erro ao buscar categorias:', error);
    
    // Em caso de erro, retornar categorias padrão da nova estrutura
    const categoriasDefault = [
      { id: 1, nome: 'Técnico', descricao: 'Treinamentos técnicos', cor: '#3B82F6', ativo: true, ordem: 1 },
      { id: 2, nome: 'Vendas', descricao: 'Treinamentos de vendas', cor: '#10B981', ativo: true, ordem: 2 },
      { id: 3, nome: 'Gestão', descricao: 'Treinamentos de gestão', cor: '#F59E0B', ativo: true, ordem: 3 },
      { id: 4, nome: 'Segurança', descricao: 'Treinamentos de segurança', cor: '#EF4444', ativo: true, ordem: 4 }
    ];

    return categoriasDefault;
  }
};

// Buscar estatísticas
export const getEstatisticas = async () => {
  try {
    // Total de treinamentos
    const { count: totalTreinamentos } = await supabase
      .from('treinamentos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    // Total de categorias
    const { count: totalCategorias } = await supabase
      .from('categorias')
      .select('*', { count: 'exact', head: true })
      .eq('tipo', 'treinamento');

    // Total de downloads
    const { data: downloadsData } = await supabase
      .from('treinamentos')
      .select('downloads')
      .eq('ativo', true);

    const totalDownloads = downloadsData?.reduce((sum, item) => sum + (item.downloads || 0), 0) || 0;

    return {
      data: {
        treinamentos: totalTreinamentos || 0,
        categorias: totalCategorias || 0,
        downloads: totalDownloads,
        tecnicos: 45, // Valor fixo por enquanto
        satisfacao: '98%' // Valor fixo por enquanto
      },
      error: null
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      data: {
        treinamentos: 0,
        categorias: 0,
        downloads: 0,
        tecnicos: 45,
        satisfacao: '98%'
      },
      error
    };
  }
};

// Editar treinamento existente
export const editTreinamento = async (id, treinamentoData, file) => {
  try {
    let updateData = { ...treinamentoData };

    // Upload do novo arquivo se fornecido
    if (file) {
      // Buscar arquivo atual para deletar
      const { data: currentData } = await supabase
        .from('treinamentos')
        .select('arquivo_url')
        .eq('id', id)
        .single();

      // Deletar arquivo antigo se existir
      if (currentData?.arquivo_url) {
        const oldFilePath = currentData.arquivo_url.split('/').slice(-2).join('/');
        await deleteFile(oldFilePath);
      }

      // Upload do novo arquivo
      const uniqueFileName = generateUniqueFileName(file.name);
      const filePath = generateFilePath(treinamentoData.categoria.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(), uniqueFileName);
      
      const uploadResult = await uploadFile(file, filePath);
      if (uploadResult.error) throw uploadResult.error;

      updateData.arquivo_url = getFileUrl(filePath);
      updateData.arquivo_nome = file.name;
      updateData.arquivo_tamanho = file.size;
      updateData.tipo = file.type.includes('pdf') ? 'PDF' : 'PPT';
    }

    // Atualizar categoria se fornecida
    if (treinamentoData.categoria) {
      updateData.categoria_nome = treinamentoData.categoria;
    }

    // Incluir campos de treinamento obrigatório
    if (treinamentoData.obrigatorio !== undefined) {
      updateData.obrigatorio = treinamentoData.obrigatorio;
    }
    if (treinamentoData.prazo_limite !== undefined) {
      updateData.prazo_limite = treinamentoData.prazo_limite;
    }

    // Atualizar no banco
    const { data, error } = await supabase
      .from('treinamentos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao editar treinamento:', error);
    return { data: null, error };
  }
};

// Excluir treinamento (soft delete)
export const deleteTreinamento = async (id) => {
  try {
    // Buscar dados do treinamento para deletar arquivo
    const { data: treinamentoData } = await supabase
      .from('treinamentos')
      .select('arquivo_url')
      .eq('id', id)
      .single();

    // Deletar arquivo do storage se existir
    if (treinamentoData?.arquivo_url) {
      const filePath = treinamentoData.arquivo_url.split('/').slice(-2).join('/');
      await deleteFile(filePath);
    }

    // Marcar como inativo ao invés de deletar
    const { data, error } = await supabase
      .from('treinamentos')
      .update({ ativo: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao deletar treinamento:', error);
    return { data: null, error };
  }
};

// Atualizar ordem dos treinamentos
export const atualizarOrdemTreinamentos = async (treinamentosOrdenados) => {
  try {
    console.log('🔄 Atualizando ordem dos treinamentos:', treinamentosOrdenados.map(t => ({ id: t.id, ordem: t.ordem, titulo: t.titulo })));
    
    // Preparar array de updates
    const updates = treinamentosOrdenados.map((treinamento, index) => ({
      id: treinamento.id,
      ordem: index + 1
    }));

    // Executar updates em batch usando rpc function
    const { data, error } = await supabase.rpc('update_treinamentos_ordem', {
      updates: updates
    });

    if (error) {
      // Se a function não existir, fazer updates individuais
      if (error.code === '42883') {
        console.log('⚠️ Function update_treinamentos_ordem não encontrada, fazendo updates individuais...');
        
        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('treinamentos')
            .update({ ordem: update.ordem })
            .eq('id', update.id);
          
          if (updateError) throw updateError;
        }
        
        console.log('✅ Ordem atualizada com sucesso (updates individuais)');
        return { data: updates, error: null };
      } else {
        throw error;
      }
    }

    console.log('✅ Ordem atualizada com sucesso via RPC');
    return { data, error: null };
  } catch (error) {
    console.error('❌ Erro ao atualizar ordem dos treinamentos:', error);
    return { data: null, error };
  }
};

