// api/send-email.js - Vercel Serverless Function
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Adicionar headers CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Lidar com requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log básico para debug
    console.log('API /send-email chamada:', { 
      method: req.method, 
      hasBody: !!req.body 
    });

    const { to, subject, html, text } = req.body || {};

    // Validar dados obrigatórios
    if (!to || !subject || (!html && !text)) {
      console.error('Dados inválidos recebidos:', { to, subject, hasHtml: !!html, hasText: !!text });
      return res.status(400).json({ 
        error: 'Campos obrigatórios: to, subject, e (html ou text)' 
      });
    }

    // Verificar todas as variáveis de ambiente disponíveis
    console.log('Variáveis disponíveis:', Object.keys(process.env).filter(key => key.includes('EMAIL')));

    // Verificar se as variáveis de ambiente estão configuradas
    const emailUser = process.env.VITE_EMAIL_USER;
    const emailPassword = process.env.VITE_EMAIL_APP_PASSWORD;
    
    console.log('Verificando variáveis:', { 
      hasUser: !!emailUser, 
      hasPassword: !!emailPassword,
      userValue: emailUser ? emailUser.substring(0, 5) + '...' : 'undefined',
      passwordLength: emailPassword ? emailPassword.length : 0
    });
    
    if (!emailUser || !emailPassword) {
      console.error('Variáveis de ambiente não configuradas');
      return res.status(500).json({ 
        error: 'Configurações de email não encontradas no servidor',
        debug: {
          hasUser: !!emailUser,
          hasPassword: !!emailPassword,
          envKeys: Object.keys(process.env).filter(key => key.includes('EMAIL'))
        }
      });
    }

    console.log('Configurando transporter para:', emailUser);

    // Configurar transporter do Gmail usando suas variáveis existentes
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true para 465, false para outras portas
      auth: {
        user: emailUser, // Seu email do Gmail
        pass: emailPassword // App Password do Gmail (com espaços mesmo)
      },
      // Configurações adicionais para melhor compatibilidade
      tls: {
        rejectUnauthorized: false
      }
    });

    // Testar conexão (removido para evitar timeout no serverless)
    console.log('Transporter configurado, pulando verificação para evitar timeout');

    // Configurar opções do email
    const mailOptions = {
      from: `"Suporte Field" <${emailUser}>`,
      to: to,
      subject: subject,
      text: text,
      html: html
    };

    console.log('Enviando email para:', to);

    // Enviar email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email enviado com sucesso:', {
      messageId: info.messageId,
      to: to,
      subject: subject
    });
    
    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email enviado com sucesso'
    });

  } catch (error) {
    console.error('Erro detalhado ao enviar email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor',
      details: error.code || 'UNKNOWN_ERROR'
    });
  }
}
