import React, { useState, useEffect } from 'react';
import { Activity, Database, Clock, AlertTriangle, CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import { clearAllCache, clearExpiredCache } from '../hooks/useCache';
import { clearUserCacheCompletely, diagnosticCacheIssues } from '../utils/clearOldCache';
import { runCachePerformanceTest, testUserLoadingInHeader } from '../utils/cachePerformanceTest';

// Monitor de cache para desenvolvimento e debug
const CacheMonitor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    totalEntries: 0,
    expiredEntries: 0,
    hitRate: 0,
    missRate: 0,
    totalRequests: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // Atualizar estatísticas periodicamente
  useEffect(() => {
    const updateStats = () => {
      // Aqui você pode implementar lógica para coletar estatísticas do cache
      // Por simplicidade, vou usar valores mock
      setCacheStats(prev => ({
        ...prev,
        totalEntries: Math.floor(Math.random() * 50) + 10,
        expiredEntries: Math.floor(Math.random() * 5),
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 3)
      }));
    };

    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClearAllCache = () => {
    clearAllCache();
    setRecentActivity(prev => [...prev, {
      id: Date.now(),
      action: 'Cache limpo completamente',
      timestamp: new Date(),
      type: 'clear'
    }].slice(-10));
  };

  const handleClearUserCache = () => {
    const cleared = clearUserCacheCompletely();
    setRecentActivity(prev => [...prev, {
      id: Date.now(),
      action: cleared ? 'Cache de usuários limpo (fix ultimo_login)' : 'Erro ao limpar cache de usuários',
      timestamp: new Date(),
      type: cleared ? 'fix' : 'error'
    }].slice(-10));
  };

  const handleDiagnostic = () => {
    const issues = diagnosticCacheIssues();
    setRecentActivity(prev => [...prev, {
      id: Date.now(),
      action: `Diagnóstico: ${issues.length} problemas encontrados`,
      timestamp: new Date(),
      type: issues.length > 0 ? 'warning' : 'success'
    }].slice(-10));
  };

  const handlePerformanceTest = async () => {
    setRecentActivity(prev => [...prev, {
      id: Date.now(),
      action: 'Iniciando teste de performance...',
      timestamp: new Date(),
      type: 'info'
    }].slice(-10));

    try {
      await runCachePerformanceTest();
      setRecentActivity(prev => [...prev, {
        id: Date.now(),
        action: 'Teste de performance concluído - veja console',
        timestamp: new Date(),
        type: 'success'
      }].slice(-10));
    } catch (error) {
      setRecentActivity(prev => [...prev, {
        id: Date.now(),
        action: 'Erro no teste de performance',
        timestamp: new Date(),
        type: 'error'
      }].slice(-10));
    }
  };

  const handleHeaderTest = () => {
    setRecentActivity(prev => [...prev, {
      id: Date.now(),
      action: 'Monitor de header ativo por 30s - veja console',
      timestamp: new Date(),
      type: 'info'
    }].slice(-10));

    testUserLoadingInHeader();
  };

  const handleClearExpired = () => {
    const cleared = clearExpiredCache();
    setRecentActivity(prev => [...prev, {
      id: Date.now(),
      action: `${cleared} entradas expiradas removidas`,
      timestamp: new Date(),
      type: 'cleanup'
    }].slice(-10));
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Só mostrar em desenvolvimento ou homologação
  const isProduction = process.env.NODE_ENV === 'production';
  const isHomologacao = window.location.hostname.includes('homologacao');
  
  if (isProduction && !isHomologacao) {
    return null;
  }

  return (
    <>
      {/* Botão de toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Monitor de Cache"
      >
        <Database className="w-6 h-6" />
      </button>

      {/* Modal do monitor */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-6 h-6" />
                <h2 className="text-xl font-bold">Monitor de Cache</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">Entradas Ativas</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    {cacheStats.totalEntries}
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="text-orange-800 font-medium">Expiradas</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900 mt-1">
                    {cacheStats.expiredEntries}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-800 font-medium">Total Requests</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    {cacheStats.totalRequests}
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-5 h-5 text-purple-600" />
                    <span className="text-purple-800 font-medium">Hit Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900 mt-1">
                    {Math.round((cacheStats.totalRequests > 0 ? (cacheStats.totalRequests - cacheStats.totalEntries) / cacheStats.totalRequests * 100 : 0))}%
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Ações de Cache</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleClearExpired}
                    className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Limpar Expirados</span>
                  </button>
                  
                  <button
                    onClick={handleClearUserCache}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Fix Usuários</span>
                  </button>
                  
                  <button
                    onClick={handlePerformanceTest}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Teste Performance</span>
                  </button>
                  
                  <button
                    onClick={handleHeaderTest}
                    className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Teste Header</span>
                  </button>
                  
                  <button
                    onClick={handleDiagnostic}
                    className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <Activity className="w-4 h-4" />
                    <span>Diagnóstico</span>
                  </button>
                  
                  <button
                    onClick={handleClearAllCache}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Limpar Tudo</span>
                  </button>
                </div>
              </div>

              {/* Atividade Recente */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Atividade Recente</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {recentActivity.length === 0 ? (
                    <p className="text-gray-500 text-sm">Nenhuma atividade registrada</p>
                  ) : (
                    recentActivity.map(activity => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'clear' ? 'bg-red-500' :
                            activity.type === 'cleanup' ? 'bg-orange-500' :
                            activity.type === 'fix' ? 'bg-green-500' :
                            activity.type === 'warning' ? 'bg-yellow-500' :
                            activity.type === 'error' ? 'bg-red-600' :
                            activity.type === 'success' ? 'bg-green-400' :
                            'bg-blue-500'
                          }`} />
                          <span className="text-sm text-gray-800">{activity.action}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTime(activity.timestamp)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Dicas de Otimização */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">💡 Dicas de Otimização</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Use TTL apropriado para cada tipo de dado</li>
                  <li>• Implemente invalidação de cache em mutations</li>
                  <li>• Use staleWhileRevalidate para melhor UX</li>
                  <li>• Monitore hit rate para ajustar TTLs</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CacheMonitor;
