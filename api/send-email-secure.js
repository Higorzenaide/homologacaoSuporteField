// Importação simples do Nodemailer
let nodemailer = null;

// Rate limiting simples
const rateLimitMap = new Map();

// Limpar rate limit a cada 30 minutos
setInterval(() => {
  rateLimitMap.clear();
}, 30 * 60 * 1000);

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

export default async function handler(req, res) {
  console.log('🚀 === INÍCIO DA API DE EMAIL SEGURA ===');
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
    const emailFrom = process.env.VITE_EMAIL_FROM || emailUser;
    
    console.log('🔧 Configurações de email:', {
      hasUser: !!emailUser,
      hasPassword: !!emailPassword,
      hasFrom: !!emailFrom,
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

    console.log('🔧 Passo 5: Carregando Nodemailer...');
    
    // Carregar Nodemailer de forma mais simples
    if (!nodemailer) {
      try {
        // Tentar import dinâmico primeiro
        const nodemailerModule = await import('nodemailer');
        nodemailer = nodemailerModule.default;
        console.log('✅ Nodemailer carregado via import dinâmico');
      } catch (importError) {
        console.log('⚠️ Import dinâmico falhou, tentando require...');
        try {
          // Fallback para require (pode funcionar em alguns ambientes)
          nodemailer = require('nodemailer');
          console.log('✅ Nodemailer carregado via require');
        } catch (requireError) {
          console.error('❌ Erro ao carregar Nodemailer:', requireError);
          return res.status(500).json({
            success: false,
            error: 'Erro ao carregar Nodemailer',
            details: requireError.message
          });
        }
      }
    }

    console.log('📦 Nodemailer carregado:', !!nodemailer);
    console.log('📦 Tipo do Nodemailer:', typeof nodemailer);
    console.log('📦 createTransporter disponível:', typeof nodemailer?.createTransporter);

    if (!nodemailer || typeof nodemailer.createTransporter !== 'function') {
      console.log('❌ Nodemailer não está disponível ou createTransporter não é uma função');
      return res.status(500).json({
        success: false,
        error: 'Nodemailer não está disponível no servidor'
      });
    }

    console.log('🔧 Passo 6: Configurando transporter SMTP Gmail...');
    
    // Configurar transporter SMTP Gmail (porta 587 para TLS)
    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true para 465, false para outras portas
      auth: {
        user: emailUser,
        pass: emailPassword
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Transporter SMTP configurado');

    console.log('🔧 Passo 7: Verificando conexão SMTP...');
    
    // Verificar conexão
    try {
      await transporter.verify();
      console.log('✅ Conexão SMTP verificada com sucesso');
    } catch (verifyError) {
      console.error('❌ Erro na verificação SMTP:', verifyError);
      return res.status(500).json({
        success: false,
        error: 'Erro na configuração do servidor de email',
        details: verifyError.message
      });
    }

    console.log('🔧 Passo 8: Preparando email para envio...');
    
    // Configurar email
    const mailOptions = {
      from: `"Suporte Field" <${emailFrom}>`,
      to: to,
      subject: subject,
      html: html,
      text: text || html?.replace(/<[^>]*>/g, '')
    };

    console.log('📧 Email preparado:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasHtml: !!mailOptions.html,
      hasText: !!mailOptions.text
    });

    console.log('🔧 Passo 9: Enviando email via SMTP Gmail...');
    
    // Enviar email via SMTP Gmail
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email enviado com sucesso via SMTP Gmail:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });
    
    console.log('🔧 Passo 10: Preparando resposta de sucesso...');
    const response = {
      success: true,
      messageId: info.messageId,
      timestamp: new Date().toISOString(),
      note: 'Email enviado com sucesso via SMTP Gmail!',
      details: {
        accepted: info.accepted,
        response: info.response
      }
    };
    
    console.log('📤 Resposta final:', response);
    console.log('🚀 === FIM DA API DE EMAIL SEGURA (SUCESSO) ===');
    
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('💥 === ERRO NA API DE EMAIL SEGURA ===');
    console.error('❌ Erro capturado:', error);
    console.error('📋 Stack trace:', error.stack);
    console.error('🚀 === FIM DA API DE EMAIL SEGURA (ERRO) ===');
    
    return res.status(500).json({
      success: false,
      error: `Erro interno: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
}
