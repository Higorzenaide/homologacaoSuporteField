import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserMenu = ({ onOpenProfile }) => {
  const { user, userProfile, isAdmin, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const isMountedRef = useRef(true);

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
        <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
          {userProfile?.nome?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
        </div>
        <span className="hidden md:block text-sm font-medium">
          {userProfile?.nome?.split(' ')[0] || user.email?.split('@')[0]}
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
                  {userProfile?.nome || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
                {userProfile?.cargo && (
                  <p className="text-xs text-gray-500">{userProfile.cargo}</p>
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

