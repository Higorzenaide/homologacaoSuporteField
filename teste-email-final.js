// Teste final de envio de email
// Execute no console do navegador

console.log('🧪 Teste final de envio de email...');

// Testar configuração primeiro
async function testarConfiguracao() {
  try {
    console.log('📧 Testando configuração...');
    
    const response = await fetch('/api/test-config', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Configuração:', result.summary);
      return result.config.email.configured;
    } else {
      console.log('❌ Erro na configuração:', response.status);
      return false;
    }
  } catch (error) {
    console.log('💥 Erro ao testar configuração:', error);
    return false;
  }
}

// Testar envio de email
async function testarEmail() {
  try {
    console.log('📧 Testando envio de email...');
    
    const response = await fetch('/api/send-email-secure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'teste@exemplo.com',
        subject: 'Teste Final - Suporte Field',
        html: '<h1>Teste Final</h1><p>Email funcionando perfeitamente!</p>',
        text: 'Teste final funcionando!'
      })
    });

    console.log('📥 Resposta:', response.status, response.ok);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email enviado:', result);
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Erro no envio:', error);
      return false;
    }
  } catch (error) {
    console.log('💥 Erro na requisição:', error);
    return false;
  }
}

// Executar testes
async function executarTestes() {
  console.log('🚀 Iniciando testes...');
  
  // Teste 1: Configuração
  const configOk = await testarConfiguracao();
  console.log('📊 Configuração OK:', configOk);
  
  if (configOk) {
    // Teste 2: Envio de email
    const emailOk = await testarEmail();
    console.log('📊 Email OK:', emailOk);
    
    if (emailOk) {
      console.log('🎉 Todos os testes passaram! Sistema funcionando!');
    } else {
      console.log('⚠️ Email falhou, mas configuração está OK');
    }
  } else {
    console.log('❌ Configuração falhou');
  }
}

// Executar
executarTestes();
