import React, { useState, useRef, useEffect } from 'react';
import { User, Crown, Shield, Star, UserCheck, Settings, Briefcase, Heart, Zap, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserMenu = ({ onOpenProfile }) => {
  const { user, isAdmin, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const isMountedRef = useRef(true);

  // Função para escolher o ícone baseado no tipo e características do usuário
  const getUserIcon = () => {
    if (isAdmin) {
      return Crown; // Coroa para administradores
    }
    
    switch (user.tipo_usuario) {
      case 'gestor':
        return Shield; // Escudo para gestores
      case 'especialista':
        return Star; // Estrela para especialistas
      case 'supervisor':
        return UserCheck; // Check para supervisores
      case 'tecnico':
        return Settings; // Engrenagem para técnicos
      case 'analista':
        return Briefcase; // Maleta para analistas
      default:
        // Escolher ícone baseado na primeira letra do nome para variedade
        const firstLetter = user.nome?.charAt(0)?.toLowerCase() || 'u';
        const iconMap = {
          'a': Award, 'b': Briefcase, 'c': Crown, 'd': Star,
          'e': Zap, 'f': Heart, 'g': Shield, 'h': Heart,
          'i': Star, 'j': Award, 'k': Shield, 'l': Heart,
          'm': Briefcase, 'n': Star, 'o': Award, 'p': Crown,
          'q': Shield, 'r': Heart, 's': Star, 't': Award,
          'u': User, 'v': Shield, 'w': Heart, 'x': Star,
          'y': Award, 'z': Crown
        };
        return iconMap[firstLetter] || User;
    }
  };

  const UserIcon = getUserIcon();

  // Função para escolher a cor do avatar baseado no tipo de usuário
  const getAvatarColor = () => {
    if (isAdmin) {
      return 'bg-gradient-to-br from-purple-500 to-purple-600'; // Roxo para administradores
    }
    
    switch (user.tipo_usuario) {
      case 'gestor':
        return 'bg-gradient-to-br from-blue-500 to-blue-600'; // Azul para gestores
      case 'especialista':
        return 'bg-gradient-to-br from-green-500 to-green-600'; // Verde para especialistas
      case 'supervisor':
        return 'bg-gradient-to-br from-orange-500 to-orange-600'; // Laranja para supervisores
      case 'tecnico':
        return 'bg-gradient-to-br from-teal-500 to-teal-600'; // Teal para técnicos
      case 'analista':
        return 'bg-gradient-to-br from-indigo-500 to-indigo-600'; // Índigo para analistas
      default:
        // Cores variadas baseadas na primeira letra do nome
        const firstLetter = user.nome?.charAt(0)?.toLowerCase() || 'u';
        const colorMap = {
          'a': 'bg-gradient-to-br from-red-500 to-red-600',
          'b': 'bg-gradient-to-br from-blue-500 to-blue-600',
          'c': 'bg-gradient-to-br from-cyan-500 to-cyan-600',
          'd': 'bg-gradient-to-br from-emerald-500 to-emerald-600',
          'e': 'bg-gradient-to-br from-violet-500 to-violet-600',
          'f': 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600',
          'g': 'bg-gradient-to-br from-green-500 to-green-600',
          'h': 'bg-gradient-to-br from-rose-500 to-rose-600',
          'i': 'bg-gradient-to-br from-indigo-500 to-indigo-600',
          'j': 'bg-gradient-to-br from-yellow-500 to-yellow-600',
          'k': 'bg-gradient-to-br from-lime-500 to-lime-600',
          'l': 'bg-gradient-to-br from-purple-500 to-purple-600',
          'm': 'bg-gradient-to-br from-pink-500 to-pink-600',
          'n': 'bg-gradient-to-br from-orange-500 to-orange-600',
          'o': 'bg-gradient-to-br from-amber-500 to-amber-600',
          'p': 'bg-gradient-to-br from-teal-500 to-teal-600',
          'q': 'bg-gradient-to-br from-sky-500 to-sky-600',
          'r': 'bg-gradient-to-br from-red-500 to-red-600',
          's': 'bg-gradient-to-br from-slate-500 to-slate-600',
          't': 'bg-gradient-to-br from-emerald-500 to-emerald-600',
          'u': 'bg-gradient-to-br from-blue-500 to-blue-600',
          'v': 'bg-gradient-to-br from-violet-500 to-violet-600',
          'w': 'bg-gradient-to-br from-cyan-500 to-cyan-600',
          'x': 'bg-gradient-to-br from-rose-500 to-rose-600',
          'y': 'bg-gradient-to-br from-yellow-500 to-yellow-600',
          'z': 'bg-gradient-to-br from-zinc-500 to-zinc-600'
        };
        return colorMap[firstLetter] || 'bg-gradient-to-br from-gray-500 to-gray-600';
    }
  };

  // Cleanup quando componente desmonta
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSignOut = async () => {
    try {
      // Fechar menu imediatamente
      if (isMountedRef.current) {
        setIsOpen(false);
      }
      
      // Executar logout após pequeno delay para evitar conflitos
      setTimeout(() => {
        signOut();
      }, 50);
    } catch (error) {
      console.error('Erro no logout:', error);
      // Mesmo com erro, fechar menu se ainda montado
      if (isMountedRef.current) {
        setIsOpen(false);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (isMountedRef.current) {
            setIsOpen(!isOpen);
          }
        }}
        className="flex items-center space-x-2 text-gray-700 hover:text-red-600 focus:outline-none"
      >
        <div className={`w-8 h-8 ${getAvatarColor()} text-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105`}>
          <UserIcon className="w-4 h-4" />
        </div>
        <span className="hidden md:block text-sm font-medium">
          {user.nome?.split(' ')[0] || user.email?.split('@')[0]}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Overlay para fechar o menu */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              if (isMountedRef.current) {
                setIsOpen(false);
              }
            }}
          />
          
          {/* Menu dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="py-2">
              {/* Informações do usuário */}
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {user.nome || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
                {user.cargo && (
                  <p className="text-xs text-gray-500">{user.cargo}</p>
                )}
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    isAdmin 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isAdmin ? 'Administrador' : 'Usuário'}
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    onOpenProfile && onOpenProfile();
                    if (isMountedRef.current) {
                      setIsOpen(false);
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Meu Perfil
                </button>

                <div className="border-t border-gray-100 my-1"></div>

                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sair
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;

