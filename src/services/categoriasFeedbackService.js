import { supabase } from '../lib/supabase';

// Serviço para gerenciamento de categorias de feedback
export const categoriasFeedbackService = {
  // Listar todas as categorias de feedback ativas
  async listarCategorias() {
    try {
      const { data, error } = await supabase
        .from('categorias_feedback')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao listar categorias de feedback:', error);
      return { data: null, error: error.message };
    }
  },

  // Listar todas as categorias (incluindo inativas) - apenas para admins
  async listarTodasCategorias() {
    try {
      const { data, error } = await supabase
        .from('categorias_feedback')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao listar todas as categorias de feedback:', error);
      return { data: null, error: error.message };
    }
  },

  // Criar nova categoria de feedback
  async criarCategoria(dadosCategoria) {
    try {
      const { data, error } = await supabase
        .from('categorias_feedback')
        .insert([{
          nome: dadosCategoria.nome,
          descricao: dadosCategoria.descricao || null,
          cor: dadosCategoria.cor || '#6B7280',
          ativo: dadosCategoria.ativo !== undefined ? dadosCategoria.ativo : true
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar categoria de feedback:', error);
      return { data: null, error: error.message };
    }
  },

  // Atualizar categoria de feedback existente
  async atualizarCategoria(id, dadosCategoria) {
    try {
      const updateData = {
        nome: dadosCategoria.nome,
        descricao: dadosCategoria.descricao,
        cor: dadosCategoria.cor,
        ativo: dadosCategoria.ativo,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('categorias_feedback')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar categoria de feedback:', error);
      return { data: null, error: error.message };
    }
  },

  // Desativar categoria de feedback
  async desativarCategoria(id) {
    try {
      const { data, error } = await supabase
        .from('categorias_feedback')
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
      console.error('Erro ao desativar categoria de feedback:', error);
      return { data: null, error: error.message };
    }
  },

  // Reativar categoria de feedback
  async reativarCategoria(id) {
    try {
      const { data, error } = await supabase
        .from('categorias_feedback')
        .update({ 
          ativo: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao reativar categoria de feedback:', error);
      return { data: null, error: error.message };
    }
  },

  // Deletar categoria de feedback (apenas se não houver feedbacks associados)
  async deletarCategoria(id) {
    try {
      // Verificar se existem feedbacks associados
      const { data: feedbacks, error: feedbackError } = await supabase
        .from('feedbacks')
        .select('id')
        .eq('categoria_id', id)
        .limit(1);

      if (feedbackError) throw feedbackError;

      if (feedbacks && feedbacks.length > 0) {
        return { 
          data: null, 
          error: 'Não é possível deletar categoria com feedbacks associados. Desative-a em vez disso.' 
        };
      }

      const { data, error } = await supabase
        .from('categorias_feedback')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao deletar categoria de feedback:', error);
      return { data: null, error: error.message };
    }
  },

  // Obter categoria por ID
  async obterPorId(id) {
    try {
      const { data, error } = await supabase
        .from('categorias_feedback')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao obter categoria de feedback por ID:', error);
      return { data: null, error: error.message };
    }
  },

  // Validar dados de categoria
  validarDados(dadosCategoria, isEdicao = false) {
    const erros = [];

    // Validar nome
    if (!dadosCategoria.nome || !dadosCategoria.nome.trim()) {
      erros.push('Nome é obrigatório');
    } else if (dadosCategoria.nome.trim().length < 2) {
      erros.push('Nome deve ter pelo menos 2 caracteres');
    } else if (dadosCategoria.nome.trim().length > 100) {
      erros.push('Nome deve ter no máximo 100 caracteres');
    }

    // Validar cor (se fornecida)
    if (dadosCategoria.cor && !/^#[0-9A-F]{6}$/i.test(dadosCategoria.cor)) {
      erros.push('Cor deve estar no formato hexadecimal (#RRGGBB)');
    }

    // Validar descrição (se fornecida)
    if (dadosCategoria.descricao && dadosCategoria.descricao.trim().length > 500) {
      erros.push('Descrição deve ter no máximo 500 caracteres');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  },

  // Formatar dados para exibição
  formatarParaExibicao(categoria) {
    return {
      ...categoria,
      ativo_label: categoria.ativo ? 'Ativa' : 'Inativa',
      created_at_formatted: new Date(categoria.created_at).toLocaleDateString('pt-BR'),
      updated_at_formatted: categoria.updated_at ? new Date(categoria.updated_at).toLocaleDateString('pt-BR') : '-'
    };
  },

  // Cores padrão para categorias
  getCoresPadrao() {
    return [
      { nome: 'Azul', valor: '#3B82F6' },
      { nome: 'Verde', valor: '#10B981' },
      { nome: 'Vermelho', valor: '#EF4444' },
      { nome: 'Amarelo', valor: '#F59E0B' },
      { nome: 'Roxo', valor: '#8B5CF6' },
      { nome: 'Rosa', valor: '#EC4899' },
      { nome: 'Cinza', valor: '#6B7280' },
      { nome: 'Índigo', valor: '#6366F1' },
      { nome: 'Teal', valor: '#14B8A6' },
      { nome: 'Laranja', valor: '#F97316' }
    ];
  }
};

export default categoriasFeedbackService;

