import { supabase } from '../lib/supabase';

class ProfileService {
  // Obter perfil completo do usuário
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_profile', { user_id_param: userId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      throw error;
    }
  }

  // Obter feedbacks visíveis do usuário
  async getUserFeedbacks(userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_feedbacks', { user_id_param: userId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar feedbacks do usuário:', error);
      throw error;
    }
  }

  // Obter atividades do usuário
  async getUserActivities(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_activities', { 
          user_id_param: userId,
          limit_param: limit 
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar atividades do usuário:', error);
      throw error;
    }
  }

  // Responder a um feedback
  async respondToFeedback(feedbackId, userId, tipoResposta, motivo = null) {
    try {
      const { data, error } = await supabase
        .rpc('respond_to_feedback', {
          feedback_id_param: feedbackId,
          user_id_param: userId,
          tipo_resposta_param: tipoResposta,
          motivo_param: motivo
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao responder feedback:', error);
      throw error;
    }
  }

  // Obter estatísticas resumidas do usuário
  async getUserStats(userId) {
    try {
      // Buscar dados das views diretamente para estatísticas mais detalhadas
      const { data: profile, error: profileError } = await supabase
        .from('vw_perfil_usuario')
        .select('*')
        .eq('usuario_id', userId)
        .single();

      if (profileError) throw profileError;

      // Buscar questionários mais recentes com detalhes
      const { data: recentQuestionarios, error: questionariosError } = await supabase
        .from('sessoes_questionarios')
        .select(`
          id,
          percentual_acerto,
          data_conclusao,
          questionarios:questionario_id (titulo)
        `)
        .eq('usuario_id', userId)
        .eq('status', 'concluido')
        .order('data_conclusao', { ascending: false })
        .limit(5);

      if (questionariosError) {
        console.warn('Erro ao buscar questionários recentes:', questionariosError);
      }

      return {
        profile,
        recentQuestionarios: recentQuestionarios || []
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do usuário:', error);
      throw error;
    }
  }

  // Obter timeline de atividades com paginação
  async getUserTimeline(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .from('vw_atividades_usuario')
        .select('*')
        .eq('usuario_id', userId)
        .order('data_atividade', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        activities: data || [],
        hasMore: data && data.length === limit
      };
    } catch (error) {
      console.error('Erro ao buscar timeline do usuário:', error);
      throw error;
    }
  }

  // Obter detalhes de um feedback específico (para modais/expandir)
  async getFeedbackDetails(feedbackId, userId) {
    try {
      const { data, error } = await supabase
        .from('vw_feedbacks_usuario')
        .select('*')
        .eq('feedback_id', feedbackId)
        .eq('usuario_mencionado', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar detalhes do feedback:', error);
      throw error;
    }
  }

  // Buscar histórico de notas em questionários
  async getQuestionarioHistory(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('sessoes_questionarios')
        .select(`
          id,
          percentual_acerto,
          data_conclusao,
          tempo_total,
          tentativa,
          questionarios:questionario_id (
            id,
            titulo,
            treinamentos:treinamento_id (
              id,
              titulo
            )
          )
        `)
        .eq('usuario_id', userId)
        .eq('status', 'concluido')
        .order('data_conclusao', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico de questionários:', error);
      throw error;
    }
  }

  // Atualizar preferências do usuário (para futuras funcionalidades)
  async updateUserPreferences(userId, preferences) {
    try {
      // Estrutura para futuras preferências como:
      // - Notificações
      // - Tema
      // - Privacidade do perfil
      // etc.

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          preferences: preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      throw error;
    }
  }

  // Obter rankings/comparações (gamificação futura)
  async getUserRanking(userId) {
    try {
      // Query para ranking baseado em engajamento
      const { data, error } = await supabase
        .from('vw_perfil_usuario')
        .select(`
          usuario_id,
          nome,
          total_comentarios,
          total_curtidas,
          total_questionarios,
          media_notas_questionarios
        `)
        .order('total_comentarios', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Encontrar posição do usuário
      const userPosition = data.findIndex(user => user.usuario_id === userId) + 1;
      
      // Calcular score total para ranking
      const usersWithScore = data.map(user => ({
        ...user,
        score: (user.total_comentarios * 2) + (user.total_curtidas * 1) + (user.total_questionarios * 3)
      })).sort((a, b) => b.score - a.score);

      const userRankPosition = usersWithScore.findIndex(user => user.usuario_id === userId) + 1;

      return {
        userPosition: userRankPosition,
        topUsers: usersWithScore.slice(0, 10),
        userStats: usersWithScore.find(user => user.usuario_id === userId)
      };
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
      throw error;
    }
  }
}

// Singleton instance
export const profileService = new ProfileService();
