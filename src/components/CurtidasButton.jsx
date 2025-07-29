import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  verificarCurtida, 
  toggleCurtida, 
  contarCurtidas, 
  getUsuariosCurtiram 
} from '../services/curtidasService';

const CurtidasButton = ({ treinamentoId, onCurtidaChange }) => {
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
      const [curtidaResult, contadorResult, usuariosResult] = await Promise.all([
        user ? verificarCurtida(treinamentoId, user.id) : { curtido: false },
        contarCurtidas(treinamentoId),
        getUsuariosCurtiram(treinamentoId, 5)
      ]);

      if (!curtidaResult.error) {
        setCurtido(curtidaResult.curtido);
      }
      
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
      const result = await toggleCurtida(treinamentoId, user.id);
      if (result.error) {
        console.error('Erro ao curtir:', result.error);
      } else {
        const novoCurtido = result.data.curtido;
        const novoTotal = result.data.total_curtidas;
        
        setCurtido(novoCurtido);
        setTotalCurtidas(novoTotal);
        
        if (onCurtidaChange) {
          onCurtidaChange(novoTotal);
        }
        
        // Recarregar lista de usuários que curtiram
        const usuariosResult = await getUsuariosCurtiram(treinamentoId, 5);
        if (!usuariosResult.error) {
          setUsuariosCurtiram(usuariosResult.data);
        }
      }
    } catch (error) {
      console.error('Erro ao curtir:', error);
    } finally {
      setProcessando(false);
    }
  };

  const formatarListaUsuarios = () => {
    if (usuariosCurtiram.length === 0) return 'Ninguém curtiu ainda';
    
    const nomes = usuariosCurtiram.map(u => u.usuarios?.nome || 'Usuário').slice(0, 3);
    const restantes = usuariosCurtiram.length - 3;
    
    if (restantes > 0) {
      return `${nomes.join(', ')} e mais ${restantes} ${restantes === 1 ? 'pessoa' : 'pessoas'}`;
    }
    
    return nomes.join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
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
        className={`
          flex items-center space-x-1 px-2 py-1.5 rounded-md transition-all duration-200 text-sm
          ${curtido 
            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
          }
          ${!user ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
          ${processando ? 'opacity-50 cursor-wait' : ''}
        `}
        title={!user ? 'Faça login para curtir' : curtido ? 'Descurtir' : 'Curtir'}
      >
        <div className="relative">
          <svg 
            className={`w-4 h-4 transition-all duration-200 ${
              curtido ? 'text-red-500 scale-110' : 'text-gray-400'
            }`} 
            fill={curtido ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={curtido ? 0 : 2} 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
          
          {/* Animação de coração */}
          {processando && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            </div>
          )}
        </div>
        
        <span className={`font-medium ${curtido ? 'text-red-600' : 'text-gray-600'}`}>
          {totalCurtidas}
        </span>
      </button>

      {/* Tooltip com usuários que curtiram */}
      {showTooltip && usuariosCurtiram.length > 0 && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-xs">
            <div className="font-medium mb-1">
              {totalCurtidas} {totalCurtidas === 1 ? 'curtida' : 'curtidas'}
            </div>
            <div className="text-gray-300">
              {formatarListaUsuarios()}
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

export default CurtidasButton;

