import { supabase } from '../lib/supabase';

class AnalyticsService {
  // =====================================================
  // ANALYTICS DE NOTIFICAÇÕES
  // =====================================================

  // Registrar que usuário leu uma notificação
  async markNotificationAsRead(notificationId, userId) {
    try {
      const { error } = await supabase
        .from('notification_analytics')
        .upsert({
          notification_id: notificationId,
          user_id: userId,
          action: 'read'
        }, {
          onConflict: 'notification_id,user_id,action'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
  }

  // Registrar que usuário clicou em uma notificação
  async markNotificationAsClicked(notificationId, userId) {
    try {
      const { error } = await supabase
        .from('notification_analytics')
        .upsert({
          notification_id: notificationId,
          user_id: userId,
          action: 'clicked'
        }, {
          onConflict: 'notification_id,user_id,action'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao registrar clique na notificação:', error);
      return false;
    }
  }

  // Obter analytics de uma notificação específica
  async getNotificationAnalytics(notificationId) {
    try {
      const { data, error } = await supabase
        .from('notification_analytics')
        .select(`
          *,
          usuarios:user_id (
            id,
            nome,
            email
          )
        `)
        .eq('notification_id', notificationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar por ação
      const analytics = {
        read: data.filter(item => item.action === 'read'),
        clicked: data.filter(item => item.action === 'clicked'),
        dismissed: data.filter(item => item.action === 'dismissed'),
        total: data.length
      };

      return analytics;
    } catch (error) {
      console.error('Erro ao buscar analytics da notificação:', error);
      return null;
    }
  }

  // Obter todas as notificações com analytics
  async getAllNotificationsWithAnalytics(limit = 50) {
    try {
      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (notificationsError) throw notificationsError;

      // Obter total de usuários ativos para calcular escopo
      const { count: totalActiveUsers } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);

      // Para cada notificação, buscar seus analytics e informações de escopo
      const notificationsWithAnalytics = await Promise.all(
        notifications.map(async (notification) => {
          const analytics = await this.getNotificationAnalytics(notification.id);
          
          // Contar quantas notificações foram criadas com o mesmo título e message na mesma data
          const { count: totalRecipients } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('title', notification.title)
            .eq('message', notification.message)
            .gte('created_at', new Date(new Date(notification.created_at).getTime() - 60000).toISOString()) // +/- 1 minuto
            .lte('created_at', new Date(new Date(notification.created_at).getTime() + 60000).toISOString());

          // Determinar escopo da notificação
          const scope = {
            type: totalRecipients >= totalActiveUsers ? 'all_users' : 'specific_users',
            totalRecipients: totalRecipients || 1,
            totalActiveUsers: totalActiveUsers || 0,
            percentage: totalActiveUsers > 0 ? Math.round((totalRecipients / totalActiveUsers) * 100) : 0
          };

          // Se foi para usuários específicos, buscar quem recebeu
          let recipients = [];
          if (scope.type === 'specific_users' && totalRecipients <= 50) {
            const { data: recipientData } = await supabase
              .from('notifications')
              .select(`
                user_id,
                usuarios:user_id (
                  id,
                  nome,
                  email,
                  cargo
                )
              `)
              .eq('title', notification.title)
              .eq('message', notification.message)
              .gte('created_at', new Date(new Date(notification.created_at).getTime() - 60000).toISOString())
              .lte('created_at', new Date(new Date(notification.created_at).getTime() + 60000).toISOString())
              .limit(50);

            recipients = recipientData || [];
          }

          return {
            ...notification,
            analytics: analytics || { read: [], clicked: [], dismissed: [], total: 0 },
            scope,
            recipients
          };
        })
      );

      return notificationsWithAnalytics;
    } catch (error) {
      console.error('Erro ao buscar notificações com analytics:', error);
      return [];
    }
  }

  // =====================================================
  // ANALYTICS DE NOTÍCIAS
  // =====================================================

  // Registrar visualização de notícia
  async registerNoticiaView(noticiaId, userId) {
    try {
      const { error } = await supabase
        .from('noticias_analytics')
        .insert({
          noticia_id: noticiaId,
          user_id: userId,
          action: 'viewed'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao registrar visualização da notícia:', error);
      return false;
    }
  }

  // Registrar curtida em notícia
  async registerNoticiaLike(noticiaId, userId) {
    try {
      const { error } = await supabase
        .from('noticias_analytics')
        .insert({
          noticia_id: noticiaId,
          user_id: userId,
          action: 'liked'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao registrar curtida na notícia:', error);
      return false;
    }
  }

  // Registrar comentário em notícia
  async registerNoticiaComment(noticiaId, userId, commentText) {
    try {
      const { error } = await supabase
        .from('noticias_analytics')
        .insert({
          noticia_id: noticiaId,
          user_id: userId,
          action: 'commented',
          metadata: {
            comment_preview: commentText.substring(0, 100)
          }
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao registrar comentário na notícia:', error);
      return false;
    }
  }

  // Obter analytics de uma notícia específica
  async getNoticiaAnalytics(noticiaId) {
    try {
      const { data, error } = await supabase
        .from('noticias_analytics')
        .select(`
          *,
          usuarios:user_id (
            id,
            nome,
            email
          )
        `)
        .eq('noticia_id', noticiaId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar por ação
      const analytics = {
        viewed: data.filter(item => item.action === 'viewed'),
        liked: data.filter(item => item.action === 'liked'),
        commented: data.filter(item => item.action === 'commented'),
        shared: data.filter(item => item.action === 'shared'),
        total: data.length
      };

      return analytics;
    } catch (error) {
      console.error('Erro ao buscar analytics da notícia:', error);
      return null;
    }
  }

  // =====================================================
  // ANALYTICS DE TREINAMENTOS
  // =====================================================

  // Registrar visualização de treinamento
  async registerTreinamentoView(treinamentoId, userId) {
    try {
      const { error } = await supabase
        .from('treinamentos_analytics')
        .insert({
          treinamento_id: treinamentoId,
          user_id: userId,
          action: 'viewed'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao registrar visualização do treinamento:', error);
      return false;
    }
  }

  // Registrar curtida em treinamento
  async registerTreinamentoLike(treinamentoId, userId) {
    try {
      const { error } = await supabase
        .from('treinamentos_analytics')
        .insert({
          treinamento_id: treinamentoId,
          user_id: userId,
          action: 'liked'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao registrar curtida no treinamento:', error);
      return false;
    }
  }

  // Registrar comentário em treinamento
  async registerTreinamentoComment(treinamentoId, userId, commentText) {
    try {
      const { error } = await supabase
        .from('treinamentos_analytics')
        .insert({
          treinamento_id: treinamentoId,
          user_id: userId,
          action: 'commented',
          metadata: {
            comment_preview: commentText.substring(0, 100)
          }
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao registrar comentário no treinamento:', error);
      return false;
    }
  }

  // Registrar conclusão de treinamento
  async registerTreinamentoCompleted(treinamentoId, userId) {
    try {
      const { error } = await supabase
        .from('treinamentos_analytics')
        .insert({
          treinamento_id: treinamentoId,
          user_id: userId,
          action: 'completed',
          metadata: {
            completed_at: new Date().toISOString()
          }
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao registrar conclusão do treinamento:', error);
      return false;
    }
  }

  // Obter analytics de um treinamento específico
  async getTreinamentoAnalytics(treinamentoId) {
    try {
      const { data, error } = await supabase
        .from('treinamentos_analytics')
        .select(`
          *,
          usuarios:user_id (
            id,
            nome,
            email
          )
        `)
        .eq('treinamento_id', treinamentoId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar por ação
      const analytics = {
        viewed: data.filter(item => item.action === 'viewed'),
        liked: data.filter(item => item.action === 'liked'),
        commented: data.filter(item => item.action === 'commented'),
        completed: data.filter(item => item.action === 'completed'),
        downloaded: data.filter(item => item.action === 'downloaded'),
        total: data.length
      };

      return analytics;
    } catch (error) {
      console.error('Erro ao buscar analytics do treinamento:', error);
      return null;
    }
  }

  // =====================================================
  // DASHBOARD DE ANALYTICS
  // =====================================================

  // Obter resumo geral de analytics
  async getAnalyticsSummary() {
    try {
      // Analytics de notificações
      const { data: notificationStats } = await supabase
        .from('notification_analytics')
        .select('action')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Analytics de notícias
      const { data: noticiasStats } = await supabase
        .from('noticias_analytics')
        .select('action')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Analytics de treinamentos
      const { data: treinamentosStats } = await supabase
        .from('treinamentos_analytics')
        .select('action')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      return {
        notifications: {
          total: notificationStats?.length || 0,
          read: notificationStats?.filter(s => s.action === 'read').length || 0,
          clicked: notificationStats?.filter(s => s.action === 'clicked').length || 0
        },
        noticias: {
          total: noticiasStats?.length || 0,
          viewed: noticiasStats?.filter(s => s.action === 'viewed').length || 0,
          liked: noticiasStats?.filter(s => s.action === 'liked').length || 0,
          commented: noticiasStats?.filter(s => s.action === 'commented').length || 0
        },
        treinamentos: {
          total: treinamentosStats?.length || 0,
          viewed: treinamentosStats?.filter(s => s.action === 'viewed').length || 0,
          liked: treinamentosStats?.filter(s => s.action === 'liked').length || 0,
          commented: treinamentosStats?.filter(s => s.action === 'commented').length || 0,
          completed: treinamentosStats?.filter(s => s.action === 'completed').length || 0
        }
      };
    } catch (error) {
      console.error('Erro ao buscar resumo de analytics:', error);
      return null;
    }
  }

  // Obter top notícias por engajamento
  async getTopNoticiasByEngagement(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('noticias_analytics')
        .select(`
          noticia_id,
          action,
          noticias:noticia_id (
            id,
            titulo,
            created_at
          )
        `)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Agrupar por notícia e calcular engajamento
      const engagement = {};
      data.forEach(item => {
        if (!engagement[item.noticia_id]) {
          engagement[item.noticia_id] = {
            noticia: item.noticias,
            views: 0,
            likes: 0,
            comments: 0,
            total: 0
          };
        }
        
        if (item.action === 'viewed') engagement[item.noticia_id].views++;
        if (item.action === 'liked') engagement[item.noticia_id].likes++;
        if (item.action === 'commented') engagement[item.noticia_id].comments++;
        engagement[item.noticia_id].total++;
      });

      // Ordenar por engajamento total
      return Object.values(engagement)
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
    } catch (error) {
      console.error('Erro ao buscar top notícias:', error);
      return [];
    }
  }

  // Obter top treinamentos por engajamento
  async getTopTreinamentosByEngagement(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('treinamentos_analytics')
        .select(`
          treinamento_id,
          action,
          treinamentos:treinamento_id (
            id,
            titulo,
            created_at
          )
        `)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Agrupar por treinamento e calcular engajamento
      const engagement = {};
      data.forEach(item => {
        if (!engagement[item.treinamento_id]) {
          engagement[item.treinamento_id] = {
            treinamento: item.treinamentos,
            views: 0,
            likes: 0,
            comments: 0,
            completed: 0,
            total: 0
          };
        }
        
        if (item.action === 'viewed') engagement[item.treinamento_id].views++;
        if (item.action === 'liked') engagement[item.treinamento_id].likes++;
        if (item.action === 'commented') engagement[item.treinamento_id].comments++;
        if (item.action === 'completed') engagement[item.treinamento_id].completed++;
        engagement[item.treinamento_id].total++;
      });

      // Ordenar por engajamento total
      return Object.values(engagement)
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
    } catch (error) {
      console.error('Erro ao buscar top treinamentos:', error);
      return [];
    }
  }
}

export default new AnalyticsService();
