// Serviço de envio de emails via Gmail SMTP
// Para usar este serviço, você precisa configurar uma "App Password" no Gmail

class EmailService {
  constructor() {
    this.smtpConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true para 465, false para outras portas
      auth: {
        user: import.meta.env.VITE_EMAIL_USER, // seu email do Gmail
        pass: import.meta.env.VITE_EMAIL_APP_PASSWORD // App Password do Gmail
      }
    };
  }

  // Enviar email usando a API do Supabase (opção 1 - mais simples)
  async sendEmailViaSupabase(to, subject, htmlContent, textContent = null) {
    try {
      // Usar a função RPC do Supabase para enviar emails
      const { data, error } = await supabase.rpc('send_notification_email', {
        recipient_email: to,
        email_subject: subject,
        html_content: htmlContent,
        text_content: textContent || this.htmlToText(htmlContent)
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao enviar email via Supabase:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar email usando API externa (opção 2 - mais controle)
  async sendEmailViaAPI(to, subject, htmlContent, textContent = null) {
    try {
      const emailData = {
        to: to,
        subject: subject,
        html: htmlContent,
        text: textContent || this.htmlToText(htmlContent),
        from: import.meta.env.VITE_EMAIL_FROM || 'suporte@desktop.com.br'
      };

      // Usar um endpoint do seu backend ou serviço de email
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_EMAIL_API_KEY}`
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('Erro ao enviar email via API:', error);
      return { success: false, error: error.message };
    }
  }

  // Método principal para enviar emails
  async sendNotificationEmail(userEmail, userName, notification) {
    try {
      const emailContent = this.buildEmailTemplate(userName, notification);
      
      // Tentar enviar via Supabase primeiro, depois via API como fallback
      let result = await this.sendEmailViaSupabase(
        userEmail,
        notification.title,
        emailContent.html,
        emailContent.text
      );

      // Se falhar, tentar via API externa
      if (!result.success) {
        console.log('Tentando envio via API externa...');
        result = await this.sendEmailViaAPI(
          userEmail,
          notification.title,
          emailContent.html,
          emailContent.text
        );
      }

      return result;
    } catch (error) {
      console.error('Erro no envio de email:', error);
      return { success: false, error: error.message };
    }
  }

  // Construir template de email HTML
  buildEmailTemplate(userName, notification) {
    const baseUrl = window.location.origin;
    const actionUrl = notification.data?.action_url 
      ? `${baseUrl}${notification.data.action_url}` 
      : baseUrl;

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .email-container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #0066cc;
            margin-bottom: 10px;
          }
          .notification-type {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 20px;
          }
          .type-training_required { background: #dc3545; color: white; }
          .type-training_reminder { background: #fd7e14; color: white; }
          .type-news { background: #20c997; color: white; }
          .type-system { background: #6f42c1; color: white; }
          .type-feedback { background: #0d6efd; color: white; }
          .content {
            margin-bottom: 30px;
          }
          .title {
            font-size: 20px;
            font-weight: 600;
            color: #212529;
            margin-bottom: 15px;
          }
          .message {
            font-size: 16px;
            line-height: 1.6;
            color: #495057;
            margin-bottom: 20px;
          }
          .action-button {
            display: inline-block;
            background: #0066cc;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            text-align: center;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            font-size: 14px;
            color: #6c757d;
          }
          .priority-high {
            border-left: 4px solid #dc3545;
            padding-left: 15px;
          }
          .priority-medium {
            border-left: 4px solid #fd7e14;
            padding-left: 15px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">🖥️ Suporte Field</div>
            <div class="notification-type type-${notification.type}">
              ${this.getTypeLabel(notification.type)}
            </div>
          </div>
          
          <div class="content ${notification.priority === 'high' ? 'priority-high' : notification.priority === 'medium' ? 'priority-medium' : ''}">
            <div class="title">Olá ${userName}!</div>
            <div class="title">${notification.title}</div>
            <div class="message">${notification.message}</div>
            
            ${actionUrl !== baseUrl ? `
              <a href="${actionUrl}" class="action-button">
                Visualizar no Sistema
              </a>
            ` : ''}
            
            ${this.getAdditionalContent(notification)}
          </div>
          
          <div class="footer">
            <p>Esta é uma notificação automática do sistema Suporte Field.</p>
            <p>Para alterar suas preferências de notificação, acesse o sistema e vá em Configurações > Notificações.</p>
            <p><a href="${baseUrl}">Acessar Sistema</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${notification.title}
      
      Olá ${userName}!
      
      ${notification.message}
      
      ${actionUrl !== baseUrl ? `Acesse: ${actionUrl}` : ''}
      
      ---
      Suporte Field - Sistema de Gestão de Treinamentos
      Para alterar suas preferências, acesse: ${baseUrl}
    `;

    return { html, text };
  }

  // Obter rótulo do tipo de notificação
  getTypeLabel(type) {
    const labels = {
      'training_required': 'Treinamento Obrigatório',
      'training_reminder': 'Lembrete',
      'training_new': 'Novo Treinamento',
      'news': 'Notícia',
      'system': 'Sistema',
      'feedback': 'Feedback',
      'custom_reminder': 'Lembrete Personalizado'
    };
    return labels[type] || 'Notificação';
  }

  // Obter conteúdo adicional baseado no tipo
  getAdditionalContent(notification) {
    switch (notification.type) {
      case 'training_required':
        return `
          <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <strong>⚠️ Atenção:</strong> Este treinamento é obrigatório e deve ser completado.
          </div>
        `;
      case 'training_reminder':
        if (notification.data?.reminder_type === 'overdue') {
          return `
            <div style="background: #f8d7da; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <strong>🚨 Urgente:</strong> O prazo para este treinamento já passou!
            </div>
          `;
        }
        if (notification.data?.reminder_type === 'due_soon') {
          return `
            <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <strong>⏰ Prazo Próximo:</strong> Complete este treinamento o quanto antes.
            </div>
          `;
        }
        break;
      case 'feedback':
        return `
          <div style="background: #d1ecf1; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <strong>📝 Feedback:</strong> Você recebeu um novo feedback. Acesse o sistema para visualizar.
          </div>
        `;
    }
    return '';
  }

  // Converter HTML para texto simples
  htmlToText(html) {
    return html
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Verificar se o email está habilitado
  isEmailEnabled() {
    return !!(import.meta.env.VITE_EMAIL_USER && import.meta.env.VITE_EMAIL_APP_PASSWORD);
  }

  // Enviar email de teste
  async sendTestEmail(userEmail, userName) {
    const testNotification = {
      title: 'Email de Teste - Suporte Field',
      message: 'Este é um email de teste para verificar se as notificações por email estão funcionando corretamente.',
      type: 'system',
      priority: 'low',
      data: {}
    };

    return await this.sendNotificationEmail(userEmail, userName, testNotification);
  }
}

export default new EmailService();
