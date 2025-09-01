// Importação dinâmica do Nodemailer para Vercel
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

function checkRateLimit(ip, maxAttempts = 10, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const userAttempts = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };
  
  if (now > userAttempts.resetTime) {
    userAttempts.count = 0;
    userAttempts.resetTime = now + windowMs;
  }
  
  userAttempts.count++;
  rateLimitMap.set(ip, userAttempts);
  
  return {
    allowed: userAttempts.count <= maxAttempts,
    count: userAttempts.count,
    resetTime: userAttempts.resetTime
  };
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/data:/gi, '')
    .trim();
}

function isValidEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email) && email.length <= 254;
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         'unknown';
}

function logSecurityEvent(event, details) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    severity: event.includes('ERROR') ? 'ERROR' : 'INFO'
  };
  
  console.log('SECURITY_EVENT:', JSON.stringify(logEntry));
}

export default async function handler(req, res) {
  console.log('🚀 === INÍCIO DA API DE EMAIL SEGURA ===');
  console.log('📋 Método:', req.method);
  console.log('🌐 URL:', req.url);
  console.log('📦 Headers:', Object.keys(req.headers));
  
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
    
    // Carregar Nodemailer dinamicamente
    if (!nodemailer) {
      try {
        const nodemailerModule = await import('nodemailer');
        nodemailer = nodemailerModule.default;
        console.log('✅ Nodemailer carregado');
      } catch (importError) {
        console.error('❌ Erro ao importar Nodemailer:', importError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao carregar Nodemailer',
          details: importError.message
        });
      }
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
