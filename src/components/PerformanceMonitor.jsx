import React, { useState, useEffect } from 'react';
import { Activity, Database, Zap, Clock, Users } from 'lucide-react';

// Monitor específico para verificar uso de cache vs consultas diretas
const PerformanceMonitor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    avgCacheTime: 0,
    avgDbTime: 0,
    totalDataSaved: 0
  });

  useEffect(() => {
    // Interceptar console.log para capturar logs de cache
    const originalLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      
      // Capturar logs específicos de cache
      if (message.includes('CACHE HIT') || message.includes('CACHE MISS') || message.includes('[USUÁRIOS]')) {
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        const logEntry = {
          id: Date.now(),
          timestamp,
          message,
          type: message.includes('CACHE HIT') ? 'hit' : 
                message.includes('CACHE MISS') ? 'miss' : 
                message.includes('[USUÁRIOS]') ? 'users' : 'info'
        };
        
        setLogs(prev => [logEntry, ...prev.slice(0, 49)]); // Manter últimos 50
        
        // Atualizar estatísticas
        setStats(prev => {
          const newStats = { ...prev };
          
          if (message.includes('CACHE HIT')) {
            newStats.totalRequests++;
            newStats.cacheHits++;
          } else if (message.includes('CACHE MISS')) {
            newStats.totalRequests++;
            newStats.cacheMisses++;
            
            // Extrair tempo da mensagem (ex: "300ms")
            const timeMatch = message.match(/(\d+)ms/);
            if (timeMatch) {
              const time = parseInt(timeMatch[1]);
              newStats.avgDbTime = Math.round((newStats.avgDbTime + time) / 2);
            }
          }
          
          return newStats;
        });
      }
      
      // Chamar console.log original
      originalLog(...args);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  const calculateHitRate = () => {
    const total = stats.cacheHits + stats.cacheMisses;
    return total > 0 ? Math.round((stats.cacheHits / total) * 100) : 0;
  };

  const calculateDataSaved = () => {
    // Estimar dados economizados (supondo 50KB por consulta de usuários)
    return Math.round((stats.cacheHits * 50) / 1024); // MB
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'hit': return '🎯';
      case 'miss': return '🚀';
      case 'users': return '👥';
      default: return '📝';
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'hit': return 'text-green-600 bg-green-50';
      case 'miss': return 'text-blue-600 bg-blue-50';
      case 'users': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Só mostrar em desenvolvimento ou homologação
  const isProduction = process.env.NODE_ENV === 'production';
  const isHomologacao = window.location.hostname.includes('homologacao');
  
  if (isProduction && !isHomologacao) {
    return null;
  }

  return (
    <>
      {/* Botão toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-50 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
        title="Monitor de Performance"
      >
        <Activity className="w-6 h-6" />
      </button>

      {/* Modal do monitor */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-green-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-6 h-6" />
                <h2 className="text-xl font-bold">Monitor de Performance</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {/* Estatísticas de Cache */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">Hit Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    {calculateHitRate()}%
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-800 font-medium">Cache Hits</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    {stats.cacheHits}
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="text-orange-800 font-medium">DB Queries</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900 mt-1">
                    {stats.cacheMisses}
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="text-purple-800 font-medium">Dados Salvos</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900 mt-1">
                    {calculateDataSaved()} MB
                  </div>
                </div>
              </div>

              {/* Indicador Visual */}
              <div className={`p-4 rounded-lg border-2 ${
                calculateHitRate() > 70 ? 'bg-green-50 border-green-300' :
                calculateHitRate() > 50 ? 'bg-yellow-50 border-yellow-300' :
                'bg-red-50 border-red-300'
              }`}>
                <h3 className="font-bold text-lg mb-2">Status do Cache</h3>
                <p className={`${
                  calculateHitRate() > 70 ? 'text-green-700' :
                  calculateHitRate() > 50 ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {calculateHitRate() > 70 ? 
                    '🟢 Excelente! Cache funcionando perfeitamente.' :
                    calculateHitRate() > 50 ?
                    '🟡 Bom, mas pode melhorar com TTL mais longo.' :
                    '🔴 Cache precisa de ajustes ou muitas consultas novas.'
                  }
                </p>
              </div>

              {/* Logs em Tempo Real */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Logs em Tempo Real ({logs.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-4">
                  {logs.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      Nenhum log ainda. Navegue pelo site para ver as operações de cache.
                    </p>
                  ) : (
                    logs.map(log => (
                      <div
                        key={log.id}
                        className={`flex items-start space-x-3 p-3 rounded-lg ${getLogColor(log.type)}`}
                      >
                        <span className="text-lg">{getLogIcon(log.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono break-all">{log.message}</p>
                          <p className="text-xs opacity-75 mt-1">{log.timestamp}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Dicas de Verificação */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">
                  🔍 Como Verificar se o Cache Está Funcionando:
                </h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li><strong>Primeira vez:</strong> Deve ver "CACHE MISS" + tempo em ms</li>
                  <li><strong>Navegação seguinte:</strong> Deve ver "CACHE HIT" + 0ms</li>
                  <li><strong>Hit Rate:</strong> Deve estar acima de 70% após uso normal</li>
                  <li><strong>Logs de usuários:</strong> Só deve aparecer uma vez por sessão</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PerformanceMonitor;
