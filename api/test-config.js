// 🔒 API de Teste de Configuração
// Verifica se as variáveis de ambiente estão configuradas (sem expor valores)

export default async function handler(req, res) {
  console.log('🧪 API de teste de configuração chamada');
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Lidar com preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Permitir apenas GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  try {
    // Verificar configurações de email (sem expor valores)
    const emailUser = process.env.VITE_EMAIL_USER;
    const emailPassword = process.env.VITE_EMAIL_APP_PASSWORD;
    const emailFrom = process.env.VITE_EMAIL_FROM;
    
    // Verificar outras configurações (sem expor valores)
    const web3formsKey = process.env.VITE_WEB3FORMS_ACCESS_KEY;
    const formspreeEndpoint = process.env.VITE_FORMSPREE_ENDPOINT;
    const emailjsPublicKey = process.env.VITE_EMAILJS_PUBLIC_KEY;
    const emailjsServiceId = process.env.VITE_EMAILJS_SERVICE_ID;
    const emailjsTemplateId = process.env.VITE_EMAILJS_TEMPLATE_ID;
    
    const config = {
      email: {
        hasEmailUser: !!emailUser,
        hasEmailPassword: !!emailPassword,
        hasEmailFrom: !!emailFrom,
        configured: !!(emailUser && emailPassword && emailFrom)
      },
      web3forms: {
        hasAccessKey: !!web3formsKey,
        configured: !!web3formsKey
      },
      formspree: {
        hasEndpoint: !!formspreeEndpoint,
        configured: !!formspreeEndpoint
      },
      emailjs: {
        hasPublicKey: !!emailjsPublicKey,
        hasServiceId: !!emailjsServiceId,
        hasTemplateId: !!emailjsTemplateId,
        configured: !!(emailjsPublicKey && emailjsServiceId && emailjsTemplateId)
      }
    };
    
    console.log('📊 Configuração verificada (valores ocultos)');
    
    return res.status(200).json({
      success: true,
      config: config,
      summary: {
        emailConfigured: config.email.configured,
        web3formsConfigured: config.web3forms.configured,
        formspreeConfigured: config.formspree.configured,
        emailjsConfigured: config.emailjs.configured
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 Erro ao verificar configuração:', error);
    
    return res.status(500).json({
      success: false,
      error: `Erro interno: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
}
