// Serviço de Email Simplificado
// Apenas mensagens amigáveis, sem envio real

class EmailService {
  // Função para construir template de boas-vindas (apenas para exibição)
  buildWelcomeEmailTemplate(userData) {
    const { email, nome } = userData;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">🎉 Bem-vindo(a) ao Suporte Field!</h1>
          </div>
          
          <div style="margin-bottom: 25px;">
            <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin: 0;">
              Olá <strong>${nome || 'Usuário'}</strong>!
            </p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin: 0;">
              Seu cadastro foi realizado com sucesso! Agora você tem acesso completo à plataforma de suporte.
            </p>
          </div>
          
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #2c3e50; margin-top: 0;">📧 Seus dados de acesso:</h3>
            <p style="color: #34495e; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="color: #34495e; margin: 5px 0;"><strong>Nome:</strong> ${nome || 'Não informado'}</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h3 style="color: #2c3e50;">🚀 Próximos passos:</h3>
            <ul style="color: #34495e; font-size: 16px; line-height: 1.6;">
              <li>Faça login na plataforma</li>
              <li>Explore as funcionalidades disponíveis</li>
              <li>Configure suas preferências</li>
              <li>Entre em contato se precisar de ajuda</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #7f8c8d; font-size: 14px; margin: 0;">
              Obrigado por escolher o Suporte Field! 🎯
            </p>
          </div>
        </div>
      </div>
    `;

    const text = `
      Bem-vindo(a) ao Suporte Field!
      
      Olá ${nome || 'Usuário'}!
      
      Seu cadastro foi realizado com sucesso! Agora você tem acesso completo à plataforma de suporte.
      
      Seus dados de acesso:
      - Email: ${email}
      - Nome: ${nome || 'Não informado'}
      
      Próximos passos:
      - Faça login na plataforma
      - Explore as funcionalidades disponíveis
      - Configure suas preferências
      - Entre em contato se precisar de ajuda
      
      Obrigado por escolher o Suporte Field!
    `;

    return { html, text };
  }

  // Função simplificada - apenas mensagem amigável
  async sendWelcomeEmail(userData) {
    console.log('🚀 === MENSAGEM DE BOAS-VINDAS ===');
    console.log('👤 Dados do usuário:', userData);
    
    try {
      console.log('🔧 Passo 1: Construindo mensagem amigável...');
      
      // Construir template do email (apenas para referência)
      const { html, text } = this.buildWelcomeEmailTemplate(userData);
      
      console.log('📧 Mensagem de boas-vindas preparada');
      console.log('✅ Template construído:', {
        hasHtml: !!html,
        hasText: !!text,
        htmlLength: html?.length || 0,
        textLength: text?.length || 0
      });

      console.log('🔧 Passo 2: Exibindo mensagem amigável...');
      
      // Simular sucesso (sem envio real)
      const result = {
        success: true,
        message: 'Usuário criado com sucesso! Mensagem de boas-vindas preparada.',
        timestamp: new Date().toISOString(),
        details: {
          user: userData.email,
          welcomeMessage: 'Bem-vindo(a) ao Suporte Field! 🎉'
        }
      };
      
      console.log('✅ Mensagem de boas-vindas exibida para', userData.email);
      console.log('🎉 Usuário criado com sucesso!');
      console.log('🚀 === FIM DA MENSAGEM DE BOAS-VINDAS (SUCESSO) ===');
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro ao preparar mensagem de boas-vindas:', error.message);
      console.log('🚀 === FIM DA MENSAGEM DE BOAS-VINDAS (ERRO) ===');
      
      // Retornar sucesso mesmo com erro na mensagem
      return {
        success: true,
        message: 'Usuário criado com sucesso!',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

export default new EmailService();
