// Teste de variáveis de ambiente
// Execute no console do navegador

console.log('🧪 Testando variáveis de ambiente...');

// Testar API de variáveis
async function testarVariaveis() {
  try {
    console.log('📧 Testando API de variáveis...');
    
    const response = await fetch('/api/test-variables', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Resposta:', response.status, response.ok);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Variáveis recuperadas:', result);
      
      // Verificar configuração de email
      if (result.emailConfig.emailConfigured) {
        console.log('✅ Email configurado corretamente!');
      } else {
        console.log('❌ Email não configurado:', result.emailConfig);
      }
      
      // Mostrar resumo
      console.log('📊 Resumo:', result.summary);
      
    } else {
      const error = await response.text();
      console.log('❌ Erro:', error);
    }
  } catch (error) {
    console.log('💥 Erro na requisição:', error);
  }
}

// Executar teste
testarVariaveis();
