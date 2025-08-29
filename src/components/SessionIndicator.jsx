import React, { useState, useEffect } from 'react';
import { Clock, Shield, Eye, EyeOff } from 'lucide-react';
import sessionService from '../services/sessionService';

const SessionIndicator = () => {
  const [sessionInfo, setSessionInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Verificar se há sessão ativa
    const checkSession = () => {
      const info = sessionService.getSessionInfo();
      setSessionInfo(info);
      setIsVisible(info.isActive);
    };

    // Verificar inicialmente
    checkSession();

    // Atualizar a cada 30 segundos
    const interval = setInterval(checkSession, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !sessionInfo) return null;

  const formatTime = (milliseconds) => {
    return sessionService.formatTime(milliseconds);
  };

  const getStatusColor = () => {
    const remaining = sessionInfo.timeUntilTimeout;
    const total = sessionService.SESSION_TIMEOUT;
    const percentage = (remaining / total) * 100;

    if (percentage > 50) return 'text-green-600 bg-green-100';
    if (percentage > 25) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressWidth = () => {
    const remaining = sessionInfo.timeUntilTimeout;
    const total = sessionService.SESSION_TIMEOUT;
    return Math.max(0, (remaining / total) * 100);
  };

  return (
    <div className="fixed bottom-4 right-4 z-30">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header compacto */}
        <div 
          className="flex items-center space-x-2 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor()}`}>
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">
              Sessão Ativa
            </div>
            <div className="text-xs text-gray-500">
              {formatTime(sessionInfo.timeUntilTimeout)} restante
            </div>
          </div>
          <button className="p-1 rounded-md hover:bg-gray-100">
            {showDetails ? (
              <EyeOff className="w-4 h-4 text-gray-400" />
            ) : (
              <Eye className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>

        {/* Barra de progresso */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-1000"
            style={{ width: `${getProgressWidth()}%` }}
          />
        </div>

        {/* Detalhes expandidos */}
        {showDetails && (
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Último acesso:</span>
                <span className="font-mono text-gray-900">
                  {new Date(sessionInfo.lastActivity).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tempo total:</span>
                <span className="font-mono text-gray-900">
                  {formatTime(sessionInfo.sessionTimeout)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Aviso em:</span>
                <span className="font-mono text-gray-900">
                  {formatTime(sessionInfo.timeUntilWarning)}
                </span>
              </div>

              {sessionInfo.isNearTimeout && (
                <div className="mt-3 p-2 bg-amber-100 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-800">
                      Sessão próxima do limite
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionIndicator;
