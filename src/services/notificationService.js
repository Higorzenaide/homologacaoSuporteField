import { supabase } from '../lib/supabase';

class NotificationService {
  constructor() {
    // Configurações básicas do serviço
  }

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

  // Limpar todas as notificações (apenas se todas estiverem lidas)
  async clearAllNotifications(userId) {
    try {
      // Primeiro, verificar se há notificações não lidas
      const { count: unreadCount, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (countError) throw countError;

      // Se há notificações não lidas, não permitir limpeza
      if (unreadCount > 0) {
        return { 
          success: false, 
          error: `Você tem ${unreadCount} notificação(ões) não lida(s). Leia todas antes de limpar.` 
        };
      }

      // Se todas estão lidas, deletar todas
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return { 
        success: true, 
        message: 'Todas as notificações foram removidas com sucesso!' 
      };
    } catch (error) {
      console.error('Erro ao limpar todas as notificações:', error);
      return { 
        success: false, 
        error: 'Erro ao limpar notificações. Tente novamente.' 
      };
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
      // Primeiro, verificar se a coluna obrigatorio existe
      const { data: trainings, error: trainingsError } = await supabase
        .from('treinamentos')
        .select('*')
        .eq('ativo', true);

      if (trainingsError) {
        // Se der erro por coluna não existir, buscar todos os treinamentos ativos
        if (trainingsError.code === '42703' && trainingsError.message.includes('obrigatorio')) {

          const { data: allTrainings, error: allError } = await supabase
            .from('treinamentos')
            .select('*')
            .eq('ativo', true);
          
          if (allError) throw allError;
          
          // Por enquanto, retornar array vazio até a coluna ser adicionada
          return [];
        }
        throw trainingsError;
      }

      // Filtrar apenas treinamentos obrigatórios (se a coluna existir)
      const mandatoryTrainings = trainings?.filter(training => training.obrigatorio === true) || [];

      // Para cada treinamento, verificar se o usuário já interagiu (comentou ou curtiu)
      const pendingTrainings = [];
      
      for (const training of mandatoryTrainings) {
        // Verificar se o usuário já comentou neste treinamento
        const { data: comments } = await supabase
          .from('treinamento_comentarios')
          .select('id')
          .eq('treinamento_id', training.id)
          .eq('usuario_id', userId)
          .limit(1);

        // Verificar se o usuário já curtiu este treinamento
        const { data: likes } = await supabase
          .from('treinamento_curtidas')
          .select('id')
          .eq('treinamento_id', training.id)
          .eq('usuario_id', userId)
          .limit(1);

        // Se não comentou nem curtiu, considera pendente
        if ((!comments || comments.length === 0) && (!likes || likes.length === 0)) {
          pendingTrainings.push(training);
        }
      }

      return pendingTrainings;
    } catch (error) {
      console.error('Erro ao buscar treinamentos pendentes:', error);
      // Retornar array vazio em caso de erro para não quebrar a interface
      return [];
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

  // Verificar e criar notificações para lembretes personalizados
  async checkCustomReminders(userId) {
    try {
      const now = new Date();
      
      // Buscar lembretes personalizados que devem ser notificados
      const { data: reminders, error } = await supabase
        .from('custom_reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .lte('scheduled_for', now.toISOString());

      if (error) throw error;

      let notificationsCreated = 0;

      for (const reminder of reminders || []) {
        // Verificar se já existe notificação para este lembrete
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'custom_reminder')
          .eq('data->>reminder_id', reminder.id.toString())
          .single();

        if (!existingNotification) {
          // Criar notificação para o lembrete
          await this.createNotification({
            user_id: userId,
            type: 'custom_reminder',
            title: reminder.title,
            message: reminder.message,
            data: {
              reminder_id: reminder.id,
              scheduled_for: reminder.scheduled_for,
              repeat_interval: reminder.repeat_interval,
              action_url: reminder.action_url,
              priority: reminder.priority
            },
            priority: reminder.priority || 'medium'
          });

          notificationsCreated++;
        }
      }

      return notificationsCreated;
    } catch (error) {
      console.error('Erro ao verificar lembretes personalizados:', error);
      return 0;
    }
  }

  // Notificar sobre nova notícia (com seleção de usuários)
  async notifyNewNoticia(noticiaData, selectedUserIds = null) {
    try {
      let userIds = selectedUserIds;
      
      // Se não foram especificados usuários, usar todos os ativos (comportamento antigo)
      if (!userIds) {
        const { data: users } = await supabase
          .from('usuarios')
          .select('id')
          .eq('ativo', true);

        userIds = users?.map(user => user.id) || [];
      }

      if (userIds.length === 0) return [];

      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: 'news',
        title: 'Nova Notícia Publicada',
        message: `Foi publicada uma nova notícia: "${noticiaData.titulo}"`,
        data: {
          noticia_id: noticiaData.id,
          noticia_title: noticiaData.titulo,
          action_url: `/noticias/${noticiaData.id}`
        },
        priority: 'medium'
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) throw error;
      

      return data;
    } catch (error) {
      console.error('Erro ao notificar sobre nova notícia:', error);
      throw error;
    }
  }

  // Notificar sobre novo treinamento (não obrigatório, com seleção de usuários)
  async notifyNewTreinamento(treinamentoData, selectedUserIds = null) {
    try {
      console.log('🔔 notifyNewTreinamento chamado:', { treinamentoData, selectedUserIds });
      
      let userIds = selectedUserIds;
      
      // Se não foram especificados usuários, usar todos os ativos (comportamento antigo)
      if (!userIds) {
        console.log('📋 Buscando todos os usuários ativos...');
        const { data: users } = await supabase
          .from('usuarios')
          .select('id')
          .eq('ativo', true);

        userIds = users?.map(user => user.id) || [];
        console.log('👥 Usuários encontrados:', userIds.length);
      } else {
        console.log('👥 Usuários selecionados:', userIds.length);
      }

      if (userIds.length === 0) {
        console.log('❌ Nenhum usuário para notificar');
        return [];
      }

      console.log('📝 Criando notificações para usuários:', userIds);

      // Determinar se é obrigatório para ajustar prioridade e mensagem
      const isObrigatorio = treinamentoData.obrigatorio === true;
      const notificationType = isObrigatorio ? 'training_required' : 'training_new';
      const title = isObrigatorio ? 'Novo Treinamento Obrigatório' : 'Novo Treinamento Disponível';
      const message = isObrigatorio 
        ? `Foi adicionado um novo treinamento obrigatório: "${treinamentoData.titulo}"`
        : `Foi adicionado um novo treinamento: "${treinamentoData.titulo}"`;
      const priority = isObrigatorio ? 'high' : 'low';

      console.log('📋 Configuração da notificação:', { 
        isObrigatorio, 
        notificationType, 
        title, 
        priority 
      });

      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: notificationType,
        title: title,
        message: message,
        data: {
          treinamento_id: treinamentoData.id,
          treinamento_title: treinamentoData.titulo,
          action_url: `/treinamentos/${treinamentoData.id}`
        },
        priority: priority
      }));

      console.log('💾 Inserindo notificações no banco:', notifications.length);
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) {
        console.error('❌ Erro ao inserir notificações:', error);
        throw error;
      }
      
      console.log('✅ Notificações inseridas com sucesso:', data?.length || 0);
      return data;
    } catch (error) {
      console.error('❌ Erro ao notificar sobre novo treinamento:', error);
      throw error;
    }
  }

  // Notificar sobre sistema (com seleção de usuários)
  async notifySystem(title, message, selectedUserIds = null, priority = 'medium') {
    try {
      let userIds = selectedUserIds;
      
      // Se não foram especificados usuários, usar todos os ativos (comportamento antigo)
      if (!userIds) {
        const { data: users } = await supabase
          .from('usuarios')
          .select('id')
          .eq('ativo', true);

        userIds = users?.map(user => user.id) || [];
      }

      if (userIds.length === 0) return [];

      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: 'system',
        title: title,
        message: message,
        data: {},
        priority: priority
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

  // Notificar usuário sobre feedback recebido
  async notifyUserFeedback(feedbackData) {
    try {
      // Só criar notificação se o feedback for visível para o usuário
      if (!feedbackData.usuario_pode_ver) {
        return null;
      }



      // Usar função RPC para bypassar RLS
      const { data, error } = await supabase
        .rpc('criar_notificacao_feedback', {
          usuario_id_param: feedbackData.usuario_id,
          feedback_id_param: feedbackData.id,
          categoria_nome_param: feedbackData.categoria_nome || 'Geral',
          categoria_cor_param: feedbackData.categoria_cor || '#6B7280',
          nome_avaliador_param: feedbackData.nome_avaliador
        });

      if (error) throw error;

      if (data && data.success) {

        
        // Enviar email para o feedback se habilitado
        if (emailService.isEmailEnabled()) {
          this.sendEmailNotification(data.notification).catch(emailError => {
            console.error('Erro ao enviar email de feedback:', emailError);
          });
        }
        
        return data.notification;
      } else {
        console.error('❌ Erro retornado pela função RPC:', data);
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao notificar sobre feedback:', error);
      return null;
    }
  }

  // Verificar se pode enviar email (rate limiting)
  canSendEmail() {
    const now = Date.now();
    
    // Verificar limite por minuto
    if (this.emailsSentThisMinute >= this.emailConfig.maxEmailsPerMinute) {
      return { 
        canSend: false, 
        reason: `Limite de ${this.emailConfig.maxEmailsPerMinute} emails por minuto atingido` 
      };
    }
    
    // Verificar limite por hora
    if (this.emailsSentThisHour >= this.emailConfig.maxEmailsPerHour) {
      return { 
        canSend: false, 
        reason: `Limite de ${this.emailConfig.maxEmailsPerHour} emails por hora atingido` 
      };
    }
    
    // Verificar delay mínimo entre emails
    const timeSinceLastEmail = now - this.lastEmailSentAt;
    if (timeSinceLastEmail < this.emailConfig.minDelayBetweenEmails) {
      const waitTime = this.emailConfig.minDelayBetweenEmails - timeSinceLastEmail;
      return { 
        canSend: false, 
        reason: `Aguardar ${waitTime}ms antes do próximo email`,
        waitTime 
      };
    }
    
    return { canSend: true };
  }

  // Registrar envio de email
  registerEmailSent() {
    this.emailsSentThisMinute++;
    this.emailsSentThisHour++;
    this.lastEmailSentAt = Date.now();
  }

  // Enviar notificação por email
  async sendEmailNotification(notification) {
    try {
      // Verificar rate limiting
      const canSend = this.canSendEmail();
      if (!canSend.canSend) {

        return { success: false, error: canSend.reason };
      }

      // Buscar dados do usuário
      const { data: user, error: userError } = await supabase
        .from('usuarios')
        .select('email, nome, email_notifications_enabled')
        .eq('id', notification.user_id)
        .single();

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
        return { success: false, error: 'Usuário não encontrado' };
      }

      // Verificar se o usuário tem email e quer receber notificações
      if (!user.email) {

        return { success: false, error: 'Email não cadastrado' };
      }

      // Se a coluna email_notifications_enabled existir, verificar preferência
      if (user.email_notifications_enabled === false) {

        return { success: false, error: 'Notificações por email desabilitadas' };
      }

      // Enviar o email
      const result = await emailService.sendNotificationEmail(
        user.email,
        user.nome || 'Usuário',
        notification
      );

      if (result.success) {
        // Registrar envio bem-sucedido
        this.registerEmailSent();

      } else {
        console.error(`❌ Falha ao enviar email para ${user.email}:`, result.error);
      }

      return result;
    } catch (error) {
      console.error('Erro ao processar envio de email:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar emails em lote para múltiplas notificações
  async sendBatchEmailNotifications(notifications) {
    const results = [];
    const totalEmails = notifications.length;
    
    console.log(`📧 Iniciando envio de ${totalEmails} emails com delays anti-spam...`);
    
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      const currentIndex = i + 1;
      
      try {

        
        const result = await this.sendEmailNotification(notification);
        results.push({
          notification_id: notification.id,
          user_id: notification.user_id,
          success: result.success,
          error: result.error
        });
        
        if (result.success) {

        } else {

        }
        
        // Delay progressivo para evitar detecção de spam
        if (i < notifications.length - 1) { // Não aplicar delay no último email
          const delay = this.calculateEmailDelay(currentIndex, totalEmails);

          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {

        results.push({
          notification_id: notification.id,
          user_id: notification.user_id,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`📊 Resultado final: ${successCount} sucessos, ${failureCount} falhas de ${totalEmails} emails`);
    return results;
  }

  // Calcular delay entre emails (progressivo e inteligente)
  calculateEmailDelay(currentIndex, totalEmails) {
    // Delays base em milissegundos
    const baseDelays = {
      small: 2000,   // 2 segundos para poucos emails
      medium: 3500,  // 3.5 segundos para quantidade média  
      large: 5000    // 5 segundos para muitos emails
    };
    
    let baseDelay;
    
    // Determinar delay base pela quantidade total
    if (totalEmails <= 5) {
      baseDelay = baseDelays.small;
    } else if (totalEmails <= 15) {
      baseDelay = baseDelays.medium;
    } else {
      baseDelay = baseDelays.large;
    }
    
    // Aumentar delay gradualmente a cada 10 emails
    const progressiveMultiplier = Math.floor(currentIndex / 10) * 0.5;
    const progressiveDelay = baseDelay * (1 + progressiveMultiplier);
    
    // Adicionar variação aleatória para parecer mais humano (±30%)
    const randomVariation = 0.3;
    const randomFactor = 1 + (Math.random() - 0.5) * randomVariation;
    
    const finalDelay = Math.round(progressiveDelay * randomFactor);
    
    // Garantir limites mínimo e máximo
    return Math.max(1500, Math.min(10000, finalDelay));
  }

  // Atualizar preferências de email do usuário
  async updateEmailPreferences(userId, preferences) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          email_notifications_enabled: preferences.emailEnabled,
          email_frequency: preferences.frequency || 'immediate', // immediate, daily, weekly
          email_types: preferences.types || [] // array de tipos que quer receber
        })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar preferências de email:', error);
      return { success: false, error: error.message };
    }
  }

  // Buscar preferências de email do usuário
  async getUserEmailPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('email_notifications_enabled, email_frequency, email_types')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      return {
        emailEnabled: data.email_notifications_enabled ?? true, // padrão habilitado
        frequency: data.email_frequency || 'immediate',
        types: data.email_types || ['training_required', 'training_reminder', 'news', 'system', 'feedback']
      };
    } catch (error) {
      console.error('Erro ao buscar preferências de email:', error);
      // Retornar padrões em caso de erro
      return {
        emailEnabled: true,
        frequency: 'immediate',
        types: ['training_required', 'training_reminder', 'news', 'system', 'feedback']
      };
    }
  }

  // Testar envio de email
  async sendTestEmail(userId) {
    try {
      const { data: user, error: userError } = await supabase
        .from('usuarios')
        .select('email, nome')
        .eq('id', userId)
        .single();

      if (userError || !user.email) {
        throw new Error('Usuário não encontrado ou sem email cadastrado');
      }

      return await emailService.sendTestEmail(user.email, user.nome || 'Usuário');
    } catch (error) {
      console.error('Erro ao enviar email de teste:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new NotificationService();
