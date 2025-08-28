import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  verificarCurtidaOptimized, 
  toggleCurtidaOptimized, 
  preloadUserCurtidas 
} from '../services/curtidasOptimizedService';
import { contarCurtidas, getUsuariosCurtiram } from '../services/curtidasService';
import analyticsService from '../services/analyticsService';

const CurtidasButtonOptimized = ({ treinamentoId, onCurtidaChange }) => {
  const { user } = useAuth();
  const [curtido, setCurtido] = useState(false);
  const [totalCurtidas, setTotalCurtidas] = useState(0);
  const [usuariosCurtiram, setUsuariosCurtiram] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [treinamentoId, user]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Pré-carregar curtidas do usuário se ainda não foi feito
      if (user) {
        await preloadUserCurtidas(user.id);
      }

      const [curtidaResult, contadorResult, usuariosResult] = await Promise.all([
        user ? verificarCurtidaOptimized(treinamentoId, user.id) : false,
        contarCurtidas(treinamentoId),
        getUsuariosCurtiram(treinamentoId, 5)
      ]);

      setCurtido(curtidaResult);
      
      if (!contadorResult.error) {
        setTotalCurtidas(contadorResult.count);
        if (onCurtidaChange) {
          onCurtidaChange(contadorResult.count);
        }
      }
      
      if (!usuariosResult.error) {
        setUsuariosCurtiram(usuariosResult.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de curtidas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCurtida = async () => {
    if (!user || processando) return;

    setProcessando(true);
    
    try {
      // Atualização otimista da UI
      const novoEstado = !curtido;
      setCurtido(novoEstado);
      setTotalCurtidas(prev => novoEstado ? prev + 1 : prev - 1);
      
      if (onCurtidaChange) {
        onCurtidaChange(novoEstado ? totalCurtidas + 1 : totalCurtidas - 1);
      }

      const result = await toggleCurtidaOptimized(treinamentoId, user.id);
      
      if (result.error) {
        console.error('Erro ao curtir/descurtir:', result.error);
        // Reverter mudança otimista
        setCurtido(!novoEstado);
        setTotalCurtidas(prev => novoEstado ? prev - 1 : prev + 1);
        if (onCurtidaChange) {
          onCurtidaChange(novoEstado ? totalCurtidas - 1 : totalCurtidas + 1);
        }
        return;
      }

      // Registrar analytics
      await analyticsService.recordTrainingInteraction(
        user.id,
        treinamentoId,
        novoEstado ? 'liked' : 'unliked'
      );

      // Recarregar dados para sincronizar
      setTimeout(() => {
        carregarDados();
      }, 500);

    } catch (error) {
      console.error('Erro ao processar curtida:', error);
      // Reverter mudança otimista em caso de erro
      setCurtido(!curtido);
      setTotalCurtidas(prev => curtido ? prev + 1 : prev - 1);
    } finally {
      setProcessando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <div className="animate-pulse">
          <div className="w-6 h-6 bg-gray-200 rounded"></div>
        </div>
        <span className="text-sm animate-pulse">...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggleCurtida}
        disabled={!user || processando}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
          curtido
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
        } ${
          processando ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          !user ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title={user ? (curtido ? 'Descurtir' : 'Curtir') : 'Faça login para curtir'}
      >
        <svg
          className={`w-5 h-5 transition-all duration-200 ${
            curtido ? 'fill-current text-red-500' : 'stroke-current fill-none'
          } ${processando ? 'animate-pulse' : ''}`}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span className="text-sm font-medium">
          {totalCurtidas > 0 ? totalCurtidas : ''}
        </span>
      </button>

      {/* Tooltip com usuários que curtiram */}
      {showTooltip && usuariosCurtiram.length > 0 && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-xs">
            <div className="font-medium mb-1">Curtido por:</div>
            <div className="space-y-1">
              {usuariosCurtiram.slice(0, 3).map((usuario, index) => (
                <div key={index} className="truncate">
                  {usuario.nome || 'Usuário'}
                </div>
              ))}
              {usuariosCurtiram.length > 3 && (
                <div className="text-gray-300">
                  +{usuariosCurtiram.length - 3} outros
                </div>
              )}
            </div>
            {/* Seta do tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurtidasButtonOptimized;
