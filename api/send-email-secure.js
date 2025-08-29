// 🔒 API Segura de Envio de Email
import nodemailer from 'nodemailer';

// Rate limiting simples
const rateLimitMap = new Map();

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // CORS restritivo
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://seu-dominio.com'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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
  const clientIP = getClientIP(req);
  
  try {
    // Configurar headers de segurança
    setSecurityHeaders(res);

    // Lidar com preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Permitir apenas POST
    if (req.method !== 'POST') {
      logSecurityEvent('INVALID_METHOD', { method: req.method, ip: clientIP });
      return res.status(405).json({ error: 'Método não permitido' });
    }

    // Rate limiting
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { 
        ip: clientIP, 
        count: rateLimit.count,
        resetTime: new Date(rateLimit.resetTime).toISOString()
      });
      return res.status(429).json({ 
        error: 'Muitas tentativas. Tente novamente em alguns minutos.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      });
    }

    const { to, subject, html, text } = req.body || {};

    // Validações rigorosas
    if (!to || !subject || (!html && !text)) {
      logSecurityEvent('INVALID_REQUEST_DATA', { 
        ip: clientIP,
        hasTo: !!to,
        hasSubject: !!subject,
        hasContent: !!(html || text)
      });
      return res.status(400).json({ 
        error: 'Dados obrigatórios: destinatário, assunto e conteúdo' 
      });
    }

    // Validar email
    if (!isValidEmail(to)) {
      logSecurityEvent('INVALID_EMAIL', { ip: clientIP, email: to });
      return res.status(400).json({ error: 'Email de destinatário inválido' });
    }

    // Sanitizar entradas
    const sanitizedData = {
      to: sanitizeInput(to),
      subject: sanitizeInput(subject),
      html: html ? sanitizeInput(html) : null,
      text: text ? sanitizeInput(text) : null
    };

    // Verificar configurações
    const emailUser = process.env.VITE_EMAIL_USER;
    const emailPassword = process.env.VITE_EMAIL_APP_PASSWORD;
    
    if (!emailUser || !emailPassword) {
      logSecurityEvent('CONFIG_ERROR', { ip: clientIP, hasUser: !!emailUser, hasPass: !!emailPassword });
      return res.status(500).json({ 
        error: 'Configurações de email não disponíveis' 
      });
    }

    // Configurar transporter com segurança
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword
      },
      secure: true,
      tls: {
        rejectUnauthorized: true
      }
    });

    // Verificar conexão
    try {
      await transporter.verify();
    } catch (verifyError) {
      logSecurityEvent('SMTP_VERIFY_ERROR', { 
        ip: clientIP, 
        error: verifyError.message 
      });
      return res.status(500).json({ 
        error: 'Erro na configuração do servidor de email' 
      });
    }

    // Configurar email
    const mailOptions = {
      from: `"Suporte Field" <${emailUser}>`,
      to: sanitizedData.to,
      subject: sanitizedData.subject,
      html: sanitizedData.html,
      text: sanitizedData.text || sanitizedData.html?.replace(/<[^>]*>/g, ''),
      // Adicionar headers de segurança ao email
      headers: {
        'X-Mailer': 'Suporte Field System',
        'X-Priority': '3',
        'Precedence': 'bulk'
      }
    };

    // Enviar email
    const info = await transporter.sendMail(mailOptions);
    
    logSecurityEvent('EMAIL_SENT_SUCCESS', { 
      ip: clientIP,
      to: sanitizedData.to,
      messageId: info.messageId,
      response: info.response
    });

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logSecurityEvent('EMAIL_SEND_ERROR', { 
      ip: clientIP,
      error: error.message,
      stack: error.stack
    });

    // Não expor detalhes internos do erro
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  }
}

// Limpeza periódica do rate limit (a cada 30 minutos)
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 30 * 60 * 1000);
