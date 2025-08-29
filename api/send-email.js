// api/send-email.js - Vercel Serverless Function
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html, text } = req.body;

    // Validar dados obrigatórios
    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: to, subject, e (html ou text)' 
      });
    }

    // Verificar se as variáveis de ambiente estão configuradas
    const emailUser = process.env.VITE_EMAIL_USER;
    const emailPassword = process.env.VITE_EMAIL_APP_PASSWORD;
    
    if (!emailUser || !emailPassword) {
      console.error('Variáveis de ambiente não configuradas:', { 
        hasUser: !!emailUser, 
        hasPassword: !!emailPassword 
      });
      return res.status(500).json({ 
        error: 'Configurações de email não encontradas no servidor' 
      });
    }

    console.log('Configurando transporter para:', emailUser);

    // Configurar transporter do Gmail usando suas variáveis existentes
    const transporter = nodemailer.createTransporter({
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

    // Testar conexão
    await transporter.verify();
    console.log('Conexão SMTP verificada com sucesso');

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
