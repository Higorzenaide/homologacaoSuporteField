import { supabase } from '../lib/supabase';

class NotificationService {
  // Criar uma nova notificação
  async createNotification(notificationData) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  // Buscar notificações de um usuário
  async getUserNotifications(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      throw error;
    }
  }

  // Marcar notificação como lida
  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      throw error;
    }
  }

  // Marcar todas as notificações como lidas
  async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      throw error;
    }
  }

  // Deletar notificação
  async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      throw error;
    }
  }

  // Contar notificações não lidas
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      throw error;
    }
  }

  // Notificar sobre novo treinamento obrigatório
  async notifyNewRequiredTraining(trainingData, userIds) {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: 'training_required',
        title: 'Novo Treinamento Obrigatório',
        message: `Foi adicionado um novo treinamento obrigatório: "${trainingData.titulo}"`,
        data: {
          training_id: trainingData.id,
          training_title: trainingData.titulo,
          action_url: `/treinamentos/${trainingData.id}`
        },
        priority: 'high'
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao notificar sobre treinamento obrigatório:', error);
      throw error;
    }
  }

  // Notificar sobre lembrete de treinamento
  async notifyTrainingReminder(trainingData, userId, reminderType = 'pending') {
    try {
      let title, message;
      
      switch (reminderType) {
        case 'pending':
          title = 'Treinamento Pendente';
          message = `Você ainda não completou o treinamento: "${trainingData.titulo}"`;
          break;
        case 'overdue':
          title = 'Treinamento Atrasado';
          message = `O prazo para completar "${trainingData.titulo}" já passou`;
          break;
        case 'due_soon':
          title = 'Prazo Próximo';
          message = `O prazo para completar "${trainingData.titulo}" está próximo`;
          break;
        default:
          title = 'Lembrete de Treinamento';
          message = `Lembrete: "${trainingData.titulo}"`;
      }

      const notification = {
        user_id: userId,
        type: 'training_reminder',
        title,
        message,
        data: {
          training_id: trainingData.id,
          training_title: trainingData.titulo,
          reminder_type: reminderType,
          action_url: `/treinamentos/${trainingData.id}`
        },
        priority: reminderType === 'overdue' ? 'high' : 'medium'
      };

      return await this.createNotification(notification);
    } catch (error) {
      console.error('Erro ao criar lembrete de treinamento:', error);
      throw error;
    }
  }

  // Notificar sobre sistema (manutenção, atualizações, etc.)
  async notifySystem(userIds, title, message, priority = 'medium') {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: 'system',
        title,
        message,
        priority,
        data: {
          system_notification: true
        }
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao notificar sistema:', error);
      throw error;
    }
  }

  // Configurar lembretes personalizados
  async createCustomReminder(userId, reminderData) {
    try {
      const notification = {
        user_id: userId,
        type: 'custom_reminder',
        title: reminderData.title || 'Lembrete Personalizado',
        message: reminderData.message,
        data: {
          reminder_id: reminderData.id,
          scheduled_for: reminderData.scheduled_for,
          repeat_interval: reminderData.repeat_interval,
          action_url: reminderData.action_url
        },
        priority: reminderData.priority || 'low'
      };

      return await this.createNotification(notification);
    } catch (error) {
      console.error('Erro ao criar lembrete personalizado:', error);
      throw error;
    }
  }

  // Buscar treinamentos pendentes para um usuário
  async getPendingTrainings(userId) {
    try {
      // Buscar treinamentos obrigatórios que o usuário ainda não completou
      const { data, error } = await supabase
        .from('treinamentos')
        .select(`
          *,
          interacoes_treinamentos!left(
            id,
            usuario_id,
            data_interacao,
            tipo_interacao
          )
        `)
        .eq('obrigatorio', true)
        .eq('ativo', true);

      if (error) throw error;

      // Filtrar apenas os que o usuário não completou
      const pendingTrainings = data?.filter(training => {
        const userInteractions = training.interacoes_treinamentos?.filter(
          interaction => interaction.usuario_id === userId
        );
        return !userInteractions || userInteractions.length === 0;
      }) || [];

      return pendingTrainings;
    } catch (error) {
      console.error('Erro ao buscar treinamentos pendentes:', error);
      throw error;
    }
  }

  // Verificar e criar lembretes automáticos
  async checkAndCreateReminders(userId) {
    try {
      const pendingTrainings = await this.getPendingTrainings(userId);
      const now = new Date();

      for (const training of pendingTrainings) {
        // Verificar se já existe um lembrete recente para este treinamento
        const { data: existingReminders } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'training_reminder')
          .eq('data->training_id', training.id)
          .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24h
          .limit(1);

        if (existingReminders && existingReminders.length > 0) {
          continue; // Já existe um lembrete recente
        }

        // Determinar o tipo de lembrete baseado no prazo
        let reminderType = 'pending';
        if (training.prazo_limite) {
          const deadline = new Date(training.prazo_limite);
          const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDeadline < 0) {
            reminderType = 'overdue';
          } else if (daysUntilDeadline <= 3) {
            reminderType = 'due_soon';
          }
        }

        // Criar o lembrete
        await this.notifyTrainingReminder(training, userId, reminderType);
      }

      return pendingTrainings.length;
    } catch (error) {
      console.error('Erro ao verificar lembretes:', error);
      throw error;
    }
  }

  // Configurar notificações push do navegador
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      throw new Error('Este navegador não suporta notificações');
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      throw new Error('Permissão para notificações foi negada');
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Enviar notificação push do navegador
  sendBrowserNotification(title, options = {}) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/logo.jpeg',
        badge: '/logo.jpeg',
        ...options
      });

      // Fechar automaticamente após 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }
    return null;
  }
}

export default new NotificationService();
