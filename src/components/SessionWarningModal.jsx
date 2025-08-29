import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import sessionService from '../services/sessionService';

const SessionWarningModal = ({ isOpen, onExtend, onLogout }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Atualizar tempo restante a cada segundo
    const interval = setInterval(() => {
      const remaining = sessionService.getTimeUntilTimeout();
      setTimeRemaining(remaining);
      
      // Se o tempo acabou, fazer logout automático
      if (remaining <= 0) {
        onLogout();
      }
    }, 1000);

    // Definir tempo inicial
    setTimeRemaining(sessionService.getTimeUntilTimeout());

    return () => clearInterval(interval);
  }, [isOpen, onLogout]);

  const handleExtend = async () => {
    setIsExtending(true);
    try {
      await onExtend();
    } finally {
      setIsExtending(false);
    }
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Sessão Expirando</h3>
              <p className="text-amber-100">Sua sessão está prestes a expirar</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Timer */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full text-white mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Tempo Restante
            </h4>
            <div className="text-3xl font-bold text-red-600 font-mono">
              {formatTime(timeRemaining)}
            </div>
          </div>

          {/* Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 text-sm leading-relaxed">
              Por segurança, sua sessão será encerrada automaticamente após um período de inatividade. 
              Clique em <strong>"Continuar Conectado"</strong> para estender sua sessão por mais 2 horas.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExtend}
              disabled={isExtending}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isExtending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Estendendo...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Continuar Conectado</span>
                </>
              )}
            </button>

            <button
              onClick={onLogout}
              className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair Agora</span>
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              A sessão será renovada automaticamente durante sua atividade
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionWarningModal;
