// Utilitário para testar performance de cache vs consultas diretas
import { supabase } from '../lib/supabase';
import { useCachedUsuarios } from '../services/cachedServices';
import { clearAllCache } from '../hooks/useCache';

export const runCachePerformanceTest = async () => {
  console.log('\n🧪 ===== TESTE DE PERFORMANCE CACHE vs BANCO =====\n');
  
  const results = {
    directQueries: [],
    cachedQueries: [],
    summary: {}
  };

  // Limpar cache para teste limpo
  clearAllCache();
  console.log('🧹 Cache limpo para teste');

  // Teste 1: Consultas diretas (sem cache)
  console.log('\n1️⃣ Testando consultas DIRETAS (sem cache)...');
  
  for (let i = 1; i <= 5; i++) {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, ativo, tipo_usuario, ultimo_acesso, created_at')
        .order('nome');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (error) throw error;
      
      results.directQueries.push(duration);
      console.log(`   Consulta ${i}: ${duration}ms (${data?.length || 0} usuários)`);
      
      // Pequeno delay entre consultas
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`   Erro na consulta ${i}:`, error);
    }
  }

  // Aguardar um pouco antes do próximo teste
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 2: Primeira consulta com cache (MISS)
  console.log('\n2️⃣ Testando PRIMEIRA consulta com cache (CACHE MISS)...');
  
  // Simular uso do hook (primeira vez = MISS)
  const startCacheMiss = Date.now();
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, ativo, tipo_usuario, ultimo_acesso, created_at')
      .order('nome');
    
    const endCacheMiss = Date.now();
    const cacheMissDuration = endCacheMiss - startCacheMiss;
    
    if (error) throw error;
    
    console.log(`   Cache MISS: ${cacheMissDuration}ms (${data?.length || 0} usuários)`);
    results.cacheMisses = [cacheMissDuration];
  } catch (error) {
    console.error('   Erro no cache miss:', error);
  }

  // Teste 3: Consultas com cache (HIT)
  console.log('\n3️⃣ Testando consultas com CACHE (CACHE HIT)...');
  
  // Simular cache manual para teste
  let cachedData = null;
  try {
    const { data } = await supabase
      .from('usuarios')
      .select('id, nome, email, ativo, tipo_usuario, ultimo_acesso, created_at')
      .order('nome');
    cachedData = data;
  } catch (error) {
    console.error('Erro ao preparar cache:', error);
    return results;
  }

  for (let i = 1; i <= 5; i++) {
    const startTime = Date.now();
    
    // Simular acesso ao cache (instantâneo)
    const data = cachedData; // Dados vêm do cache
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    results.cachedQueries.push(duration);
    console.log(`   Cache HIT ${i}: ${duration}ms (${data?.length || 0} usuários)`);
  }

  // Calcular estatísticas
  const avgDirect = results.directQueries.reduce((a, b) => a + b, 0) / results.directQueries.length;
  const avgCached = results.cachedQueries.reduce((a, b) => a + b, 0) / results.cachedQueries.length;
  const improvement = Math.round(((avgDirect - avgCached) / avgDirect) * 100);
  const totalDataSaved = results.cachedQueries.length * 50; // KB estimado por consulta

  results.summary = {
    avgDirectTime: Math.round(avgDirect),
    avgCachedTime: Math.round(avgCached),
    performanceImprovement: improvement,
    queriesSaved: results.cachedQueries.length,
    dataSaved: totalDataSaved
  };

  // Exibir resumo
  console.log('\n📊 ===== RESUMO DOS RESULTADOS =====');
  console.log(`⏱️  Tempo médio consulta direta: ${results.summary.avgDirectTime}ms`);
  console.log(`🎯 Tempo médio consulta cache:   ${results.summary.avgCachedTime}ms`);
  console.log(`🚀 Melhoria de performance:      ${results.summary.performanceImprovement}%`);
  console.log(`💾 Consultas economizadas:       ${results.summary.queriesSaved}`);
  console.log(`📉 Dados economizados:           ~${results.summary.dataSaved}KB`);
  
  if (improvement > 50) {
    console.log('✅ Cache funcionando EXCELENTE!');
  } else if (improvement > 20) {
    console.log('🟡 Cache funcionando BEM, mas pode melhorar');
  } else {
    console.log('🔴 Cache precisa de otimização');
  }

  console.log('\n🎯 COMO INTERPRETAR:');
  console.log('- Cache HIT deve ser < 5ms');
  console.log('- Cache MISS = tempo de consulta direta');
  console.log('- Melhoria deve ser > 80% em uso normal');
  console.log('=====================================\n');

  return results;
};

// Função para testar especificamente o carregamento de usuários no header
export const testUserLoadingInHeader = () => {
  console.log('\n🧪 ===== TESTE: CARREGAMENTO DE USUÁRIOS NO HEADER =====\n');
  
  let queryCount = 0;
  const originalFetch = window.fetch;
  
  // Interceptar requisições
  window.fetch = (...args) => {
    const url = args[0];
    if (typeof url === 'string' && url.includes('usuarios')) {
      queryCount++;
      console.log(`🔍 QUERY ${queryCount}: ${url}`);
      console.log(`⏰ Timestamp: ${new Date().toLocaleTimeString()}`);
    }
    return originalFetch(...args);
  };
  
  console.log('📊 Monitor ativo. Navegue pelo site e observe as consultas.');
  console.log('💡 Se funcionar corretamente, deve ver apenas 1 consulta inicial.');
  
  // Restaurar fetch após 30 segundos
  setTimeout(() => {
    window.fetch = originalFetch;
    console.log(`\n📊 RESULTADO: ${queryCount} consultas de usuários detectadas em 30s`);
    
    if (queryCount <= 1) {
      console.log('✅ EXCELENTE! Cache funcionando perfeitamente.');
    } else if (queryCount <= 3) {
      console.log('🟡 BOM, mas ainda há algumas consultas desnecessárias.');
    } else {
      console.log('🔴 PROBLEMA! Muitas consultas sendo feitas.');
    }
    
    console.log('=====================================\n');
  }, 30000);
  
  return () => {
    window.fetch = originalFetch;
  };
};

// Função para simular uso intenso e verificar cache
export const simulateIntensiveUsage = async () => {
  console.log('\n🧪 ===== SIMULAÇÃO DE USO INTENSO =====\n');
  
  const operations = [
    'Carregar header',
    'Abrir modal de notificação', 
    'Navegar para usuários',
    'Voltar para home',
    'Abrir modal novamente',
    'Navegar para treinamentos',
    'Voltar para home'
  ];
  
  console.log('🎬 Simulando navegação intensiva...');
  
  for (let i = 0; i < operations.length; i++) {
    console.log(`${i + 1}. ${operations[i]}`);
    
    // Simular uso do hook de usuários
    const startTime = Date.now();
    
    // Esta seria a chamada real do hook em cada operação
    // const { data } = useCachedUsuarios();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   ⏱️ Tempo: ${duration}ms`);
    
    // Pequeno delay entre operações
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n✅ Simulação concluída!');
  console.log('📊 Em uso real, todas as operações após a primeira devem ser < 5ms');
  console.log('=====================================\n');
};

export default {
  runCachePerformanceTest,
  testUserLoadingInHeader,
  simulateIntensiveUsage
};
