// api/test-config.js - Testar configurações de email
export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verificar variáveis de ambiente
    const emailUser = process.env.VITE_EMAIL_USER;
    const emailPassword = process.env.VITE_EMAIL_APP_PASSWORD;
    
    // Listar todas as variáveis que contêm "EMAIL"
    const emailVars = Object.keys(process.env).filter(key => 
      key.includes('EMAIL') || key.includes('VITE_EMAIL')
    );

    const response = {
      status: 'success',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      config: {
        hasEmailUser: !!emailUser,
        hasEmailPassword: !!emailPassword,
        emailUserPrefix: emailUser ? emailUser.substring(0, 5) + '...' : 'undefined',
        passwordLength: emailPassword ? emailPassword.length : 0,
        emailVariables: emailVars,
        allEnvCount: Object.keys(process.env).length
      }
    };

    console.log('Teste de configuração:', response);
    
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('Erro no teste de configuração:', error);
    return res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
