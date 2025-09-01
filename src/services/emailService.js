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
      if (!config || !config.config.email.configured) {
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
          const errorText = await response.text();
          console.error('❌ Erro raw da API:', errorText);
          
          try {
            errorData = JSON.parse(errorText);
            console.error('❌ Erro detalhado da API:', errorData);
          } catch (parseError) {
            errorData = { error: `HTTP ${response.status}: ${errorText}` };
          }
        } catch (textError) {
          errorData = { error: `HTTP error! status: ${response.status}` };
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
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
        <style>
          /* Reset de estilos */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
          }
          
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: transparent;
          }
          
          .email-container {
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="%23ffffff" opacity="0.05"/><circle cx="75" cy="75" r="1" fill="%23ffffff" opacity="0.05"/><circle cx="50" cy="10" r="0.5" fill="%23ffffff" opacity="0.03"/><circle cx="10" cy="50" r="0.5" fill="%23ffffff" opacity="0.03"/><circle cx="90" cy="30" r="0.5" fill="%23ffffff" opacity="0.03"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            pointer-events: none;
          }
          
          .logo-container {
            position: relative;
            z-index: 2;
            margin-bottom: 20px;
          }
          
          .logo {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 20px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            margin-bottom: 15px;
          }
          
          .logo-icon {
            font-size: 36px;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
          }
          
          .brand-name {
            color: white;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            letter-spacing: -0.5px;
          }
          
          .brand-subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 25px;
          }
          
          .notification-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 50px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(10px);
            position: relative;
            z-index: 2;
          }
          
          .type-training_required { 
            background: linear-gradient(135deg, #ef4444, #dc2626); 
            color: white; 
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
          }
          .type-training_reminder { 
            background: linear-gradient(135deg, #f97316, #ea580c); 
            color: white; 
            box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);
          }
          .type-training_new { 
            background: linear-gradient(135deg, #06b6d4, #0891b2); 
            color: white; 
            box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);
          }
          .type-news { 
            background: linear-gradient(135deg, #10b981, #059669); 
            color: white; 
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
          }
          .type-system { 
            background: linear-gradient(135deg, #8b5cf6, #7c3aed); 
            color: white; 
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
          }
          .type-feedback { 
            background: linear-gradient(135deg, #3b82f6, #2563eb); 
            color: white; 
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
          }
          
          .content {
            padding: 40px 30px;
            background: #ffffff;
          }
          
          .greeting {
            font-size: 18px;
            color: #6b7280;
            margin-bottom: 10px;
            font-weight: 500;
          }
          
          .title {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 20px;
            line-height: 1.3;
          }
          
          .message {
            font-size: 16px;
            line-height: 1.7;
            color: #4b5563;
            margin-bottom: 30px;
            background: #f9fafb;
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #dc2626;
          }
          
          .action-button {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 25px 0;
            box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3);
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
          }
          
          .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 35px rgba(220, 38, 38, 0.4);
          }
          
          .stats-card {
            background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #dc2626;
          }
          
          .priority-high {
            border-left: 6px solid #ef4444;
            background: linear-gradient(135deg, #fef2f2, #fee2e2);
          }
          
          .priority-medium {
            border-left: 6px solid #f59e0b;
            background: linear-gradient(135deg, #fffbeb, #fef3c7);
          }
          
          .footer {
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          
          .footer p {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
            line-height: 1.6;
          }
          
          .footer a {
            color: #dc2626;
            text-decoration: none;
            font-weight: 600;
          }
          
          .footer a:hover {
            text-decoration: underline;
          }
          
          .social-links {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
            margin: 30px 0;
          }
          
          /* Responsividade */
          @media only screen and (max-width: 600px) {
            .email-wrapper {
              margin: 10px;
            }
            
            .header, .content, .footer {
              padding: 25px 20px;
            }
            
            .brand-name {
              font-size: 24px;
            }
            
            .title {
              font-size: 20px;
            }
            
            .action-button {
              display: block;
              margin: 20px 0;
            }
          }
          
          /* Dark mode support */
          @media (prefers-color-scheme: dark) {
            .email-container {
              background: #1f2937;
            }
            
            .content {
              background: #1f2937;
            }
            
            .title {
              color: #f9fafb;
            }
            
            .message {
              background: #374151;
              color: #d1d5db;
            }
            
            .footer {
              background: #111827;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <!-- Header -->
            <div class="header">
              <div class="logo-container">
                <div class="logo">
                  <div class="logo-icon">🖥️</div>
                </div>
                <div class="brand-name">Suporte Field</div>
                <div class="brand-subtitle">Sistema de Gestão & Treinamentos</div>
                <div class="notification-badge type-${notification.type}">
                  ${this.getTypeLabel(notification.type)}
                </div>
              </div>
            </div>
            
            <!-- Content -->
            <div class="content ${notification.priority === 'high' ? 'priority-high' : notification.priority === 'medium' ? 'priority-medium' : ''}">
              <div class="greeting">Olá, <strong>${userName}</strong>! 👋</div>
              <div class="title">${notification.title}</div>
              <div class="message">
                ${notification.message}
                ${this.getAdditionalContent(notification)}
              </div>
              
              ${actionUrl !== baseUrl ? `
                <div style="text-align: center;">
                  <a href="${actionUrl}" class="action-button">
                    🚀 Acessar Sistema
                  </a>
                </div>
              ` : ''}
              
              <div class="divider"></div>
              
              <div class="stats-card">
                <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">
                  📊 Informações do Sistema
                </div>
                <div style="font-size: 14px; color: #6b7280;">
                  <strong>Tipo:</strong> ${this.getTypeLabel(notification.type)}<br>
                  <strong>Prioridade:</strong> ${notification.priority === 'high' ? '🔴 Alta' : notification.priority === 'medium' ? '🟠 Média' : '🟢 Baixa'}<br>
                  <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p><strong>📧 Esta é uma notificação automática do Suporte Field</strong></p>
              <p>Sistema de gestão de treinamentos e suporte técnico</p>
              
              <div class="divider"></div>
              
              <p>
                <a href="${baseUrl}">🌐 Acessar Sistema</a> | 
                <a href="${baseUrl}">⚙️ Configurações</a>
              </p>
              
              <div class="social-links">
                <p style="font-size: 12px; color: #9ca3af;">
                  © ${new Date().getFullYear()} Suporte Field - Todos os direitos reservados<br>
                  Para alterar suas preferências de notificação, acesse: Perfil > Configurações
                </p>
              </div>
            </div>
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
          <div style="background: linear-gradient(135deg, #fef3c7, #fbbf24); padding: 20px; border-radius: 12px; margin: 15px 0; border-left: 4px solid #f59e0b; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 24px; margin-right: 12px;">⚠️</span>
              <strong style="color: #92400e; font-size: 16px;">Treinamento Obrigatório</strong>
            </div>
            <p style="color: #78350f; margin: 0; line-height: 1.5;">Este treinamento é obrigatório e deve ser completado dentro do prazo estabelecido.</p>
          </div>
        `;
      case 'training_reminder':
        if (notification.data?.reminder_type === 'overdue') {
          return `
            <div style="background: linear-gradient(135deg, #fee2e2, #ef4444); padding: 20px; border-radius: 12px; margin: 15px 0; border-left: 4px solid #dc2626; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 24px; margin-right: 12px;">🚨</span>
                <strong style="color: #7f1d1d; font-size: 16px;">URGENTE - Prazo Vencido</strong>
              </div>
              <p style="color: #991b1b; margin: 0; line-height: 1.5;">O prazo para este treinamento já passou! Complete imediatamente.</p>
            </div>
          `;
        }
        if (notification.data?.reminder_type === 'due_soon') {
          return `
            <div style="background: linear-gradient(135deg, #fef3c7, #f59e0b); padding: 20px; border-radius: 12px; margin: 15px 0; border-left: 4px solid #d97706; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 24px; margin-right: 12px;">⏰</span>
                <strong style="color: #92400e; font-size: 16px;">Prazo Próximo</strong>
              </div>
              <p style="color: #78350f; margin: 0; line-height: 1.5;">Complete este treinamento o quanto antes para não perder o prazo.</p>
            </div>
          `;
        }
        break;
      case 'feedback':
        return `
          <div style="background: linear-gradient(135deg, #dbeafe, #3b82f6); padding: 20px; border-radius: 12px; margin: 15px 0; border-left: 4px solid #2563eb; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 24px; margin-right: 12px;">📝</span>
              <strong style="color: #1e3a8a; font-size: 16px;">Novo Feedback Recebido</strong>
            </div>
            <p style="color: #1e40af; margin: 0; line-height: 1.5;">Você recebeu um novo feedback. Acesse o sistema para visualizar e responder.</p>
          </div>
        `;
      case 'news':
        return `
          <div style="background: linear-gradient(135deg, #d1fae5, #10b981); padding: 20px; border-radius: 12px; margin: 15px 0; border-left: 4px solid #059669; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 24px; margin-right: 12px;">📰</span>
              <strong style="color: #064e3b; font-size: 16px;">Nova Notícia Publicada</strong>
            </div>
            <p style="color: #065f46; margin: 0; line-height: 1.5;">Confira as últimas novidades e atualizações importantes.</p>
          </div>
        `;
      case 'system':
        return `
          <div style="background: linear-gradient(135deg, #ede9fe, #8b5cf6); padding: 20px; border-radius: 12px; margin: 15px 0; border-left: 4px solid #7c3aed; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 24px; margin-right: 12px;">⚙️</span>
              <strong style="color: #4c1d95; font-size: 16px;">Notificação do Sistema</strong>
            </div>
            <p style="color: #5b21b6; margin: 0; line-height: 1.5;">Informação importante sobre o sistema ou atualizações.</p>
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

  // Enviar email de boas-vindas para novo usuário
  async sendWelcomeEmail(userData) {
    console.log('🚀 === INÍCIO DO ENVIO DE EMAIL DE BOAS-VINDAS ===');
    console.log('👤 Dados do usuário:', {
      email: userData.email,
      nome: userData.nome,
      tipo: userData.tipo
    });
    
    try {
      console.log('🔧 Passo 1: Construindo template do email...');
      console.log('📧 Enviando email de boas-vindas...');
      
      const emailContent = this.buildWelcomeEmailTemplate(userData);
      console.log('✅ Template construído:', {
        hasHtml: !!emailContent.html,
        hasText: !!emailContent.text,
        htmlLength: emailContent.html ? emailContent.html.length : 0,
        textLength: emailContent.text ? emailContent.text.length : 0
      });
      
      console.log('🔧 Passo 2: Chamando sendEmailViaNodemailer...');
      // Usar apenas Nodemailer para email real
      const result = await this.sendEmailViaNodemailer(userData.email, 'Bem-vindo(a) ao Suporte Field! 🎉', emailContent.html, emailContent.text);
      
      console.log('📊 Resultado do sendEmailViaNodemailer:', result);
      
      if (result.success) {
        console.log(`✅ Email de boas-vindas enviado para ${userData.email}`);
        console.log('🚀 === FIM DO ENVIO DE EMAIL DE BOAS-VINDAS (SUCESSO) ===');
        return result;
      } else {
        // Se Nodemailer falhar, retornar erro real
        console.error('❌ Falha no envio de email real:', result.error);
        console.log('🚀 === FIM DO ENVIO DE EMAIL DE BOAS-VINDAS (FALHA) ===');
        
        return { 
          success: false, 
          error: result.error || 'Falha no envio de email real'
        };
      }
    } catch (error) {
      console.error('💥 === ERRO NO ENVIO DE EMAIL DE BOAS-VINDAS ===');
      console.error('❌ Erro ao enviar email de boas-vindas:', error);
      console.error('📋 Stack trace:', error.stack);
      console.log('🚀 === FIM DO ENVIO DE EMAIL DE BOAS-VINDAS (ERRO) ===');
      
      return { 
        success: false, 
        error: error.message || 'Erro interno no envio de email'
      };
    }
  }

  // Construir template de email de boas-vindas
  buildWelcomeEmailTemplate(userData) {
    const baseUrl = window.location.origin;
    
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo(a) ao Suporte Field!</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
          }
          
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: transparent;
          }
          
          .email-container {
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            padding: 50px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="%23ffffff" opacity="0.05"/><circle cx="75" cy="75" r="1" fill="%23ffffff" opacity="0.05"/><circle cx="50" cy="10" r="0.5" fill="%23ffffff" opacity="0.03"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            pointer-events: none;
          }
          
          .welcome-banner {
            position: relative;
            z-index: 2;
          }
          
          .logo {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100px;
            height: 100px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 25px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            margin-bottom: 20px;
          }
          
          .logo-icon {
            font-size: 48px;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
          }
          
          .welcome-title {
            color: white;
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            letter-spacing: -0.5px;
          }
          
          .welcome-subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 15px;
          }
          
          .user-name {
            color: #fef3c7;
            font-size: 24px;
            font-weight: 600;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          .content {
            padding: 50px 30px;
            background: #ffffff;
          }
          
          .intro-text {
            font-size: 18px;
            color: #4b5563;
            margin-bottom: 30px;
            text-align: center;
            line-height: 1.7;
          }
          
          .credentials-card {
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            border: 2px solid #dc2626;
            box-shadow: 0 8px 25px rgba(220, 38, 38, 0.1);
          }
          
          .credentials-title {
            display: flex;
            align-items: center;
            font-size: 20px;
            font-weight: 700;
            color: #dc2626;
            margin-bottom: 20px;
          }
          
          .credential-item {
            background: white;
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 15px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          
          .credential-label {
            font-size: 14px;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          
          .credential-value {
            font-size: 16px;
            color: #111827;
            font-weight: 600;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            background: #f9fafb;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          
          .instructions-card {
            background: linear-gradient(135deg, #ecfdf5, #d1fae5);
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            border-left: 6px solid #10b981;
          }
          
          .instructions-title {
            display: flex;
            align-items: center;
            font-size: 18px;
            font-weight: 700;
            color: #064e3b;
            margin-bottom: 20px;
          }
          
          .step-list {
            list-style: none;
            padding: 0;
          }
          
          .step-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
            padding: 15px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          
          .step-number {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            margin-right: 15px;
            flex-shrink: 0;
          }
          
          .step-text {
            color: #065f46;
            font-weight: 500;
            line-height: 1.6;
          }
          
          .action-button {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            padding: 20px 40px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 18px;
            text-align: center;
            margin: 30px auto;
            box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3);
            transition: all 0.3s ease;
            display: block;
            max-width: 300px;
          }
          
          .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 35px rgba(220, 38, 38, 0.4);
          }
          
          .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 40px 0;
          }
          
          .feature-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            border: 2px solid #f3f4f6;
            transition: all 0.3s ease;
          }
          
          .feature-card:hover {
            border-color: #dc2626;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(220, 38, 38, 0.1);
          }
          
          .feature-icon {
            font-size: 48px;
            margin-bottom: 15px;
          }
          
          .feature-title {
            font-size: 16px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 10px;
          }
          
          .feature-description {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.5;
          }
          
          .footer {
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            padding: 40px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          
          .footer p {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 15px;
            line-height: 1.6;
          }
          
          .footer a {
            color: #dc2626;
            text-decoration: none;
            font-weight: 600;
          }
          
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
            margin: 30px 0;
          }
          
          .security-note {
            background: linear-gradient(135deg, #fef3c7, #fbbf24);
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
            border-left: 4px solid #f59e0b;
          }
          
          .security-note-title {
            display: flex;
            align-items: center;
            font-weight: 700;
            color: #92400e;
            margin-bottom: 10px;
          }
          
          .security-note-text {
            color: #78350f;
            font-size: 14px;
            line-height: 1.5;
          }
          
          /* Responsividade */
          @media only screen and (max-width: 600px) {
            .email-wrapper {
              margin: 10px;
            }
            
            .header, .content, .footer {
              padding: 30px 20px;
            }
            
            .welcome-title {
              font-size: 28px;
            }
            
            .features-grid {
              grid-template-columns: 1fr;
            }
            
            .action-button {
              padding: 16px 32px;
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <!-- Header -->
            <div class="header">
              <div class="welcome-banner">
                <div class="logo">
                  <div class="logo-icon">🖥️</div>
                </div>
                <div class="welcome-title">Bem-vindo(a)!</div>
                <div class="welcome-subtitle">Você agora faz parte do</div>
                <div class="user-name">Suporte Field</div>
              </div>
            </div>
            
            <!-- Content -->
            <div class="content">
              <p class="intro-text">
                Olá <strong>${userData.nome}</strong>! 🎉<br><br>
                É com grande prazer que damos as boas-vindas ao <strong>Suporte Field</strong> - 
                seu novo sistema de gestão de treinamentos e suporte técnico!
              </p>
              
              <!-- Credenciais -->
              <div class="credentials-card">
                <div class="credentials-title">
                  🔐 Suas Credenciais de Acesso
                </div>
                
                <div class="credential-item">
                  <div class="credential-label">📧 Email de Acesso</div>
                  <div class="credential-value">${userData.email}</div>
                </div>
                
                <div class="credential-item">
                  <div class="credential-label">🔑 Senha Inicial</div>
                  <div class="credential-value">${userData.senha}</div>
                </div>
                
                <div class="credential-item">
                  <div class="credential-label">👤 Tipo de Usuário</div>
                  <div class="credential-value">${userData.tipo_usuario === 'admin' ? '👑 Administrador' : '👨‍💼 Usuário'}</div>
                </div>
              </div>
              
              <!-- Instruções -->
              <div class="instructions-card">
                <div class="instructions-title">
                  📋 Primeiros Passos
                </div>
                
                <ol class="step-list">
                  <li class="step-item">
                    <div class="step-number">1</div>
                    <div class="step-text">
                      <strong>Acesse o sistema</strong> clicando no botão abaixo ou utilizando o link: <br>
                      <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${baseUrl}</code>
                    </div>
                  </li>
                  
                  <li class="step-item">
                    <div class="step-number">2</div>
                    <div class="step-text">
                      <strong>Faça seu primeiro login</strong> usando suas credenciais acima
                    </div>
                  </li>
                  
                  <li class="step-item">
                    <div class="step-number">3</div>
                    <div class="step-text">
                      <strong>Altere sua senha</strong> na primeira vez que acessar (recomendado)
                    </div>
                  </li>
                  
                  <li class="step-item">
                    <div class="step-number">4</div>
                    <div class="step-text">
                      <strong>Explore o sistema</strong> e configure suas preferências de notificação
                    </div>
                  </li>
                </ol>
              </div>
              
              <!-- Botão de ação -->
              <a href="${baseUrl}" class="action-button">
                🚀 Acessar Suporte Field
              </a>
              
              <!-- Recursos do sistema -->
              <div class="divider"></div>
              
              <h3 style="text-align: center; color: #111827; margin-bottom: 30px; font-size: 24px;">
                🌟 O que você pode fazer no sistema
              </h3>
              
              <div class="features-grid">
                <div class="feature-card">
                  <div class="feature-icon">📚</div>
                  <div class="feature-title">Treinamentos</div>
                  <div class="feature-description">
                    Acesse materiais, faça cursos e acompanhe seu progresso
                  </div>
                </div>
                
                <div class="feature-card">
                  <div class="feature-icon">📰</div>
                  <div class="feature-title">Notícias</div>
                  <div class="feature-description">
                    Fique por dentro das novidades e atualizações importantes
                  </div>
                </div>
                
                <div class="feature-card">
                  <div class="feature-icon">📝</div>
                  <div class="feature-title">Feedbacks</div>
                  <div class="feature-description">
                    Receba e responda feedbacks de forma organizada
                  </div>
                </div>
                
                <div class="feature-card">
                  <div class="feature-icon">🔔</div>
                  <div class="feature-title">Notificações</div>
                  <div class="feature-description">
                    Configure como e quando receber alertas importantes
                  </div>
                </div>
              </div>
              
              <!-- Nota de segurança -->
              <div class="security-note">
                <div class="security-note-title">
                  <span style="margin-right: 10px;">🔒</span>
                  Importante - Segurança
                </div>
                <div class="security-note-text">
                  Por favor, <strong>altere sua senha</strong> no primeiro acesso e mantenha suas credenciais seguras. 
                  Nunca compartilhe sua senha com outras pessoas.
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p><strong>🎯 Precisa de ajuda?</strong></p>
              <p>Nossa equipe está aqui para apoiá-lo em sua jornada!</p>
              
              <div class="divider"></div>
              
              <p>
                <a href="${baseUrl}">🌐 Acessar Sistema</a> | 
                <a href="${baseUrl}">📞 Suporte</a> | 
                <a href="${baseUrl}">❓ Ajuda</a>
              </p>
              
              <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af;">
                  © ${new Date().getFullYear()} Suporte Field - Sistema de Gestão & Treinamentos<br>
                  Este email foi enviado automaticamente pelo sistema. Guarde suas credenciais em local seguro.
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Bem-vindo(a) ao Suporte Field!
      
      Olá ${userData.nome}!
      
      É com grande prazer que damos as boas-vindas ao Suporte Field - seu novo sistema de gestão de treinamentos e suporte técnico!
      
      SUAS CREDENCIAIS DE ACESSO:
      Email: ${userData.email}
      Senha: ${userData.senha}
      Tipo: ${userData.tipo_usuario === 'admin' ? 'Administrador' : 'Usuário'}
      
      PRIMEIROS PASSOS:
      1. Acesse: ${baseUrl}
      2. Faça login com suas credenciais
      3. Altere sua senha (recomendado)
      4. Explore o sistema
      
      RECURSOS DISPONÍVEIS:
      - Treinamentos e materiais
      - Notícias e atualizações
      - Sistema de feedbacks
      - Notificações personalizadas
      
      SEGURANÇA:
      Por favor, altere sua senha no primeiro acesso e mantenha suas credenciais seguras.
      
      Acesse agora: ${baseUrl}
      
      ---
      Suporte Field - Sistema de Gestão & Treinamentos
      © ${new Date().getFullYear()} - Todos os direitos reservados
    `;

    return { html, text };
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
