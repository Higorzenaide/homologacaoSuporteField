// API de Email usando EmailJS
// Solução simples sem Nodemailer

function setSecurityHeaders(res, req) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // CORS simples e funcional
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Função para enviar email via EmailJS
async function sendEmailViaEmailJS(to, subject, html, text, emailUser, emailPassword) {
  // EmailJS é um serviço que funciona no frontend, mas podemos usar a API deles
  // Vamos usar uma abordagem mais simples com um serviço SMTP gratuito
  
  // Usar o serviço SMTP2GO que é gratuito e simples
  const smtpResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: emailPassword, // Usar a senha de app como API key
      to: [to],
      sender: emailUser,
      subject: subject,
      html_body: html,
      text_body: text || html?.replace(/<[^>]*>/g, '')
    })
  });

  if (!smtpResponse.ok) {
    const errorText = await smtpResponse.text();
    throw new Error(`SMTP Error: ${smtpResponse.status} - ${errorText}`);
  }

  return await smtpResponse.json();
}

export default async function handler(req, res) {
  console.log('🚀 === INÍCIO DA API DE EMAIL EMAILJS ===');
  console.log('📋 Método:', req.method);
  console.log('🌐 URL:', req.url);
  
  try {
    console.log('🔧 Passo 1: Configurando headers de segurança...');
    setSecurityHeaders(res, req);
    console.log('✅ Headers configurados com sucesso');

    // Lidar com preflight
    if (req.method === 'OPTIONS') {
      console.log('🔄 Preflight OPTIONS - retornando 200');
      return res.status(200).end();
    }

    // Permitir apenas POST
    if (req.method !== 'POST') {
      console.log('❌ Método não permitido:', req.method);
      return res.status(405).json({ error: 'Método não permitido' });
    }

    console.log('🔧 Passo 2: Extraindo dados do body...');
    const { to, subject, html, text } = req.body || {};
    
    console.log('📧 Dados recebidos:', {
      to: to ? `${to.substring(0, 10)}...` : 'não fornecido',
      subject: subject ? `${subject.substring(0, 20)}...` : 'não fornecido',
      hasHtml: !!html,
      hasText: !!text
    });

    // Validações básicas
    console.log('🔧 Passo 3: Validando dados obrigatórios...');
    if (!to || !subject || (!html && !text)) {
      console.log('❌ Dados obrigatórios faltando');
      return res.status(400).json({ 
        error: 'Dados obrigatórios: destinatário, assunto e conteúdo' 
      });
    }
    console.log('✅ Validação de dados passou');

    // Verificar configurações
    console.log('🔧 Passo 4: Verificando configurações de email...');
    const emailUser = process.env.VITE_EMAIL_USER;
    const emailPassword = process.env.VITE_EMAIL_APP_PASSWORD;
    
    console.log('🔧 Configurações de email:', {
      hasUser: !!emailUser,
      hasPassword: !!emailPassword,
      user: emailUser ? `${emailUser.substring(0, 3)}...` : 'não configurado'
    });
    
    if (!emailUser || !emailPassword) {
      console.log('❌ Configurações de email incompletas');
      return res.status(400).json({ 
        success: false,
        error: 'Configurações de email não disponíveis'
      });
    }
    console.log('✅ Configurações de email OK');

    console.log('🔧 Passo 5: Enviando email via EmailJS...');
    
    // Enviar email via EmailJS
    const result = await sendEmailViaEmailJS(to, subject, html, text, emailUser, emailPassword);
    
    console.log('✅ Email enviado com sucesso:', result);
    
    console.log('🔧 Passo 6: Preparando resposta de sucesso...');
    const responseData = {
      success: true,
      messageId: result.data?.email_id || `email-${Date.now()}`,
      timestamp: new Date().toISOString(),
      note: 'Email enviado com sucesso via EmailJS!',
      details: {
        from: emailUser,
        to: to,
        subject: subject
      }
    };
    
    console.log('📤 Resposta final:', responseData);
    console.log('🚀 === FIM DA API DE EMAIL EMAILJS (SUCESSO) ===');
    
    return res.status(200).json(responseData);
    
  } catch (error) {
    console.error('💥 === ERRO NA API DE EMAIL EMAILJS ===');
    console.error('❌ Erro capturado:', error);
    console.error('📋 Stack trace:', error.stack);
    console.error('🚀 === FIM DA API DE EMAIL EMAILJS (ERRO) ===');
    
    return res.status(500).json({
      success: false,
      error: `Erro interno: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
}
