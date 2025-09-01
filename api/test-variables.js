// 🔒 API de Teste de Variáveis de Ambiente
// Verifica se as variáveis estão sendo recuperadas corretamente

export default async function handler(req, res) {
  console.log('🧪 API de teste de variáveis chamada');
  
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
    // Recuperar todas as variáveis de ambiente
    const variables = {
      // Variáveis de email
      VITE_EMAIL_USER: process.env.VITE_EMAIL_USER,
      VITE_EMAIL_APP_PASSWORD: process.env.VITE_EMAIL_APP_PASSWORD,
      VITE_EMAIL_FROM: process.env.VITE_EMAIL_FROM,
      
      // Variáveis do Supabase
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
      
      // Outras variáveis
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      
      // Variáveis opcionais
      VITE_WEB3FORMS_ACCESS_KEY: process.env.VITE_WEB3FORMS_ACCESS_KEY,
      VITE_FORMSPREE_ENDPOINT: process.env.VITE_FORMSPREE_ENDPOINT,
      VITE_EMAILJS_PUBLIC_KEY: process.env.VITE_EMAILJS_PUBLIC_KEY,
      VITE_EMAILJS_SERVICE_ID: process.env.VITE_EMAILJS_SERVICE_ID,
      VITE_EMAILJS_TEMPLATE_ID: process.env.VITE_EMAILJS_TEMPLATE_ID
    };
    
    // Verificar se as variáveis principais estão configuradas
    const emailConfig = {
      hasEmailUser: !!variables.VITE_EMAIL_USER,
      hasEmailPassword: !!variables.VITE_EMAIL_APP_PASSWORD,
      hasEmailFrom: !!variables.VITE_EMAIL_FROM,
      emailUser: variables.VITE_EMAIL_USER ? `${variables.VITE_EMAIL_USER.substring(0, 3)}...` : 'não configurado',
      emailPassword: variables.VITE_EMAIL_APP_PASSWORD ? 'configurado' : 'não configurado',
      emailFrom: variables.VITE_EMAIL_FROM ? `${variables.VITE_EMAIL_FROM.substring(0, 3)}...` : 'não configurado'
    };
    
    console.log('📊 Variáveis recuperadas:', {
      emailConfig,
      totalVariables: Object.keys(variables).length,
      configuredVariables: Object.values(variables).filter(v => v).length
    });
    
    return res.status(200).json({
      success: true,
      variables: variables,
      emailConfig: emailConfig,
      summary: {
        totalVariables: Object.keys(variables).length,
        configuredVariables: Object.values(variables).filter(v => v).length,
        emailConfigured: emailConfig.hasEmailUser && emailConfig.hasEmailPassword && emailConfig.hasEmailFrom
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 Erro ao verificar variáveis:', error);
    
    return res.status(500).json({
      success: false,
      error: `Erro interno: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
}
