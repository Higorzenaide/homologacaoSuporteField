import { supabase } from '../lib/supabase';
import notificationService from './notificationService';

// Serviço para gerenciamento de feedbacks
export const feedbackService = {
  // Listar todos os feedbacks com informações completas
  async listarFeedbacks(filtros = {}) {
    try {
      let query = supabase
        .from('feedbacks')
        .select(`
          *,
          usuario:usuarios!usuario_id (
            id,
            nome,
            email,
            setor
          ),
          categoria:categorias_feedback!categoria_id (
            id,
            nome,
            cor
          ),
          admin:usuarios!admin_id (
            id,
            nome
          ),
          feedback_respostas (
            id,
            tipo_resposta,
            motivo_discordancia,
            created_at,
            updated_at
          )
        `);

      // Aplicar filtros
      if (filtros.usuario_id) {
        query = query.eq('usuario_id', filtros.usuario_id);
      }

      if (filtros.categoria_id) {
        query = query.eq('categoria_id', filtros.categoria_id);
      }

      if (filtros.data_inicio) {
        query = query.gte('created_at', filtros.data_inicio);
      }

      if (filtros.data_fim) {
        query = query.lte('created_at', filtros.data_fim);
      }

      if (filtros.nome_avaliador) {
        query = query.ilike('nome_avaliador', `%${filtros.nome_avaliador}%`);
      }

      // Ordenar por data de criação (mais recentes primeiro)
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao listar feedbacks:', error);
      return { data: null, error: error.message };
    }
  },

  // Criar novo feedback
  async criarFeedback(dadosFeedback) {
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .insert([{
          usuario_id: dadosFeedback.usuario_id,
          categoria_id: dadosFeedback.categoria_id,
          relato: dadosFeedback.relato,
          nome_avaliador: dadosFeedback.nome_avaliador,
          admin_id: dadosFeedback.admin_id,
          usuario_pode_ver: dadosFeedback.usuario_pode_ver || false
        }])
        .select(`
          *,
          usuario:usuarios!usuario_id(id, nome, email, setor),
          categoria:categorias_feedback!categoria_id(id, nome, cor),
          admin:usuarios!admin_id(id, nome)
        `)
        .single();

      if (error) throw error;
      
      // Se o feedback foi criado com sucesso e é visível para o usuário, criar notificação
      if (data && data.usuario_pode_ver) {
        try {
          // Criar dados estruturados para a notificação
          const notificationData = {
            id: data.id,
            usuario_id: data.usuario_id,
            usuario_pode_ver: data.usuario_pode_ver,
            categoria_nome: data.categoria?.nome,
            categoria_cor: data.categoria?.cor,
            nome_avaliador: data.nome_avaliador
          };
          
          await notificationService.notifyUserFeedback(notificationData);
        } catch (notifError) {
          console.error('Erro ao criar notificação de feedback:', notifError);
          // Não falha o processo se a notificação der erro
        }
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar feedback:', error);
      return { data: null, error: error.message };
    }
  },

  // Atualizar feedback existente
  async atualizarFeedback(id, dadosFeedback) {
    try {
      const updateData = {
        usuario_id: dadosFeedback.usuario_id,
        categoria_id: dadosFeedback.categoria_id,
        relato: dadosFeedback.relato,
        nome_avaliador: dadosFeedback.nome_avaliador,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('feedbacks')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          usuario:usuarios!usuario_id(id, nome, email, setor),
          categoria:categorias_feedback!categoria_id(id, nome, cor),
          admin:usuarios!admin_id(id, nome)
        `)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar feedback:', error);
      return { data: null, error: error.message };
    }
  },

  // Deletar feedback
  async deletarFeedback(id) {
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao deletar feedback:', error);
      return { data: null, error: error.message };
    }
  },

  // Obter feedback por ID
  async obterPorId(id) {
    try {
      const { data, error } = await supabase
        .from('feedbacks_completos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao obter feedback por ID:', error);
      return { data: null, error: error.message };
    }
  },

  // Obter feedbacks de um usuário específico
  async obterFeedbacksUsuario(usuarioId) {
    try {
      const { data, error } = await supabase
        .from('feedbacks_completos')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao obter feedbacks do usuário:', error);
      return { data: null, error: error.message };
    }
  },

  // Obter estatísticas de feedbacks por usuário
  async obterEstatisticasUsuario(usuarioId = null) {
    try {
      let query = supabase
        .from('estatisticas_feedback_usuario')
        .select('*');

      if (usuarioId) {
        query = query.eq('usuario_id', usuarioId);
      }

      query = query.order('total_feedbacks', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao obter estatísticas de usuário:', error);
      return { data: null, error: error.message };
    }
  },

  // Obter estatísticas gerais de feedbacks
  async obterEstatisticasGerais() {
    try {
      const { data, error } = await supabase
        .from('estatisticas_feedback_geral')
        .select('*')
        .order('mes', { ascending: false })
        .limit(12); // Últimos 12 meses

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao obter estatísticas gerais:', error);
      return { data: null, error: error.message };
    }
  },

  // Obter resumo de feedbacks por categoria
  async obterResumoCategoria() {
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select(`
          categoria_id,
          categorias_feedback!categoria_id(nome, cor),
          count:id.count()
        `)
        .group('categoria_id');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao obter resumo por categoria:', error);
      return { data: null, error: error.message };
    }
  },

  // Obter feedbacks recentes
  async obterFeedbacksRecentes(limite = 10) {
    try {
      const { data, error } = await supabase
        .from('feedbacks_completos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limite);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao obter feedbacks recentes:', error);
      return { data: null, error: error.message };
    }
  },

  // Validar dados de feedback
  validarDados(dadosFeedback) {
    const erros = [];

    // Validar usuário
    if (!dadosFeedback.usuario_id) {
      erros.push('Usuário é obrigatório');
    }

    // Validar categoria
    if (!dadosFeedback.categoria_id) {
      erros.push('Categoria é obrigatória');
    }

    // Validar relato
    if (!dadosFeedback.relato || !dadosFeedback.relato.trim()) {
      erros.push('Relato é obrigatório');
    } else if (dadosFeedback.relato.trim().length < 10) {
      erros.push('Relato deve ter pelo menos 10 caracteres');
    } else if (dadosFeedback.relato.trim().length > 2000) {
      erros.push('Relato deve ter no máximo 2000 caracteres');
    }

    // Validar nome do avaliador
    if (!dadosFeedback.nome_avaliador || !dadosFeedback.nome_avaliador.trim()) {
      erros.push('Nome do avaliador é obrigatório');
    } else if (dadosFeedback.nome_avaliador.trim().length < 2) {
      erros.push('Nome do avaliador deve ter pelo menos 2 caracteres');
    } else if (dadosFeedback.nome_avaliador.trim().length > 255) {
      erros.push('Nome do avaliador deve ter no máximo 255 caracteres');
    }

    // Validar admin
    if (!dadosFeedback.admin_id) {
      erros.push('Administrador é obrigatório');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  },

  // Formatar dados para exibição
  formatarParaExibicao(feedback) {
    return {
      ...feedback,
      created_at_formatted: new Date(feedback.created_at).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      updated_at_formatted: feedback.updated_at ? 
        new Date(feedback.updated_at).toLocaleDateString('pt-BR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : '-',
      relato_resumo: feedback.relato.length > 100 ? 
        feedback.relato.substring(0, 100) + '...' : 
        feedback.relato
    };
  },

  // Obter cores das categorias para gráficos
  async obterCoresCategorias() {
    try {
      const { data, error } = await supabase
        .from('categorias_feedback')
        .select('id, nome, cor')
        .eq('ativo', true);

      if (error) throw error;

      const cores = {};
      data.forEach(categoria => {
        cores[categoria.nome] = categoria.cor;
      });

      return { data: cores, error: null };
    } catch (error) {
      console.error('Erro ao obter cores das categorias:', error);
      return { data: null, error: error.message };
    }
  },

  // Exportar feedbacks para CSV
  async exportarCSV(filtros = {}) {
    try {
      const { data: feedbacks, error } = await this.listarFeedbacks(filtros);
      
      if (error) throw new Error(error);

      if (!feedbacks || feedbacks.length === 0) {
        return { data: null, error: 'Nenhum feedback encontrado para exportar' };
      }

      // Cabeçalhos do CSV
      const headers = [
        'ID',
        'Usuário',
        'Email',
        'Setor',
        'Categoria',
        'Relato',
        'Avaliador',
        'Administrador',
        'Data de Criação'
      ];

      // Converter dados para CSV
      const csvContent = [
        headers.join(','),
        ...feedbacks.map(feedback => [
          feedback.id,
          `"${feedback.usuario_nome}"`,
          `"${feedback.usuario_email}"`,
          `"${feedback.usuario_setor || ''}"`,
          `"${feedback.categoria_nome}"`,
          `"${feedback.relato.replace(/"/g, '""')}"`,
          `"${feedback.nome_avaliador}"`,
          `"${feedback.admin_nome}"`,
          `"${new Date(feedback.created_at).toLocaleDateString('pt-BR')}"`
        ].join(','))
      ].join('\n');

      return { data: csvContent, error: null };
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      return { data: null, error: error.message };
    }
  }
};

export default feedbackService;

