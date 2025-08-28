// Utilitário para limpar cache antigo que pode ter referências incorretas
import { clearAllCache } from '../hooks/useCache';

// Função para limpar cache específico de usuários
export const clearUserCacheCompletely = () => {
  try {
    // Limpar localStorage se houver cache persistente
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('users') || key.includes('usuarios') || key.includes('ultimo_login'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🧹 Cache removido: ${key}`);
    });

    // Limpar sessionStorage também
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('users') || key.includes('usuarios') || key.includes('ultimo_login'))) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
      console.log(`🧹 Session cache removido: ${key}`);
    });

    // Limpar cache global da aplicação
    clearAllCache();
    
    console.log('✅ Cache de usuários completamente limpo');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    return false;
  }
};

// Função para forçar refresh de dados específicos
export const forceRefreshUserData = async () => {
  try {
    // Limpar cache primeiro
    clearUserCacheCompletely();
    
    // Aguardar um pouco para garantir limpeza
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Forçar reload da página se necessário
    if (window.location.pathname.includes('notification') || 
        window.location.search.includes('user')) {
      window.location.reload();
    }
    
    console.log('✅ Refresh de dados de usuário forçado');
    return true;
  } catch (error) {
    console.error('❌ Erro ao forçar refresh:', error);
    return false;
  }
};

// Verificar se há problemas de cache conhecidos
export const diagnosticCacheIssues = () => {
  const issues = [];
  
  // Verificar localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('ultimo_login')) {
      issues.push(`localStorage contém chave problemática: ${key}`);
    }
  }
  
  // Verificar sessionStorage
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.includes('ultimo_login')) {
      issues.push(`sessionStorage contém chave problemática: ${key}`);
    }
  }
  
  if (issues.length > 0) {
    console.warn('⚠️ Problemas de cache detectados:', issues);
    return issues;
  }
  
  console.log('✅ Nenhum problema de cache detectado');
  return [];
};

export default {
  clearUserCacheCompletely,
  forceRefreshUserData,
  diagnosticCacheIssues
};
