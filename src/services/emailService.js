// Serviço de envio de emails via Gmail
// Como aplicações frontend não podem se conectar diretamente ao SMTP,
// usamos APIs externas ou serviços de email

class EmailService {
  constructor() {
    this.emailConfig = {
      user: import.meta.env.VITE_EMAIL_USER,
      password: import.meta.env.VITE_EMAIL_APP_PASSWORD,
      from: import.meta.env.VITE_EMAIL_FROM || import.meta.env.VITE_EMAIL_USER
    };
  }

  // Enviar email usando EmailJS (opção 1 - recomendada para frontend)
  async sendEmailViaEmailJS(to, subject, htmlContent, textContent = null) {
    try {
      // EmailJS é um serviço que permite envio de emails do frontend
      // Você precisa criar uma conta em https://www.emailjs.com/
      
      if (!window.emailjs) {
        throw new Error('EmailJS não está carregado. Adicione o script no index.html');
      }

      const templateParams = {
        to_email: to,
        subject: subject,
        html_content: htmlContent,
        text_content: textContent || this.htmlToText(htmlContent),
        from_name: 'Suporte Field',
        from_email: this.emailConfig.from
      };

      const result = await window.emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      return { success: true, data: result };
    } catch (error) {
      console.error('Erro ao enviar email via EmailJS:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar email usando Formspree (opção 2 - simples e gratuito)
  async sendEmailViaFormspree(to, subject, htmlContent, textContent = null) {
    try {
      const formspreeEndpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT;
      
      if (!formspreeEndpoint) {
        throw new Error('VITE_FORMSPREE_ENDPOINT não configurado');
      }

      const formData = new FormData();
      formData.append('email', to);
      formData.append('subject', subject);
      formData.append('message', textContent || this.htmlToText(htmlContent));
      formData.append('_replyto', this.emailConfig.from);

      const response = await fetch(formspreeEndpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('Erro ao enviar email via Formspree:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar email usando Web3Forms (opção 3 - gratuito e simples)
  async sendEmailViaWeb3Forms(to, subject, htmlContent, textContent = null) {
    try {
      const web3formsKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
      
      if (!web3formsKey) {
        throw new Error('VITE_WEB3FORMS_ACCESS_KEY não configurado');
      }

      const formData = new FormData();
      formData.append('access_key', web3formsKey);
      formData.append('email', to);
      formData.append('subject', subject);
      formData.append('message', textContent || this.htmlToText(htmlContent));
      formData.append('from_name', 'Suporte Field');
      formData.append('from_email', this.emailConfig.from);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao enviar email via Web3Forms:', error);
      return { success: false, error: error.message };
    }
  }

  // Testar configuração da API
  async testAPIConfig() {
    try {
      console.log('🧪 Testando configuração da API...');
      
      const response = await fetch('/api/test-config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Configuração da API:', result);
        return result;
      } else {
        console.error('❌ Erro ao testar configuração:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Erro na API de teste:', error);
      return null;
    }
  }

  // Enviar email usando Vercel API + Nodemailer (opção preferida)
  async sendEmailViaNodemailer(to, subject, htmlContent, textContent = null) {
    try {
      console.log('📧 Tentando enviar via Nodemailer API para:', to);
      
      // Testar configuração primeiro
      const config = await this.testAPIConfig();
      if (!config || !config.config.hasEmailUser || !config.config.hasEmailPassword) {
        throw new Error('Configurações de email não encontradas na API. Verifique as variáveis de ambiente na Vercel.');
      }

      const emailData = {
        to: to,
        subject: subject,
        html: htmlContent,
        text: textContent || this.htmlToText(htmlContent)
      };

      console.log('📤 Enviando requisição para /api/send-email...');

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      console.log('📥 Resposta da API:', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText 
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('❌ Erro detalhado da API:', errorData);
        } catch (parseError) {
          const errorText = await response.text();
          console.error('❌ Erro raw da API:', errorText);
          errorData = { error: `HTTP ${response.status}: ${errorText}` };
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Email enviado via Nodemailer:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Erro ao enviar email via Nodemailer:', error);
      return { success: false, error: error.message };
    }
  }

  // Método principal para enviar emails
  async sendNotificationEmail(userEmail, userName, notification) {
    try {
      const emailContent = this.buildEmailTemplate(userName, notification);
      
      // Tentar diferentes métodos de envio em ordem de preferência
      const methods = [
        () => this.sendEmailViaNodemailer(userEmail, notification.title, emailContent.html, emailContent.text),
        () => this.sendEmailViaWeb3Forms(userEmail, notification.title, emailContent.html, emailContent.text),
        () => this.sendEmailViaEmailJS(userEmail, notification.title, emailContent.html, emailContent.text),
        () => this.sendEmailViaFormspree(userEmail, notification.title, emailContent.html, emailContent.text)
      ];

      let lastError = null;

      for (const method of methods) {
        try {
          const result = await method();
          if (result.success) {
            return result;
          }
          lastError = result.error;
        } catch (error) {
          console.log('Método de envio falhou, tentando próximo...', error.message);
          lastError = error.message;
          continue;
        }
      }

      // Se todos os métodos falharam
      throw new Error(lastError || 'Todos os métodos de envio falharam');
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
    // Verificar se pelo menos um método de envio está configurado
    const hasNodemailer = true; // API sempre disponível (usa variáveis de ambiente do servidor)
    const hasWeb3Forms = !!import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
    const hasEmailJS = !!(import.meta.env.VITE_EMAILJS_SERVICE_ID && import.meta.env.VITE_EMAILJS_TEMPLATE_ID);
    const hasFormspree = !!import.meta.env.VITE_FORMSPREE_ENDPOINT;
    
    return hasNodemailer || hasWeb3Forms || hasEmailJS || hasFormspree;
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
