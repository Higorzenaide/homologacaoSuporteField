import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import UserMenu from './UserMenu';

const Header = ({ currentPage, setCurrentPage }) => {
  const { user, isAdmin } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const navItems = [
    { id: 'home', label: 'Início', icon: '🏠' },
    { id: 'treinamentos', label: 'Treinamentos', icon: '📚' },
    { id: 'noticias', label: 'Notícias', icon: '📰' },
    { id: 'links', label: 'Links Importantes', icon: '🔗' },
  ];

  // Adicionar página de usuários apenas para admins
  if (isAdmin) {
    navItems.push({ id: 'usuarios', label: 'Usuários', icon: '👤' });
  }

  return (
    <>
      <header className="bg-white shadow-sm border-b-2 border-red-600">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Desktop</h1>
                <p className="text-sm text-gray-600">Suporte Field</p>
              </div>
            </div>

            {/* Navegação */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? 'bg-red-600 text-white'
                      : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Menu de usuário ou botão de login */}
            <div className="flex items-center space-x-4">
              {user ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Entrar
                </button>
              )}
            </div>
          </div>

          {/* Navegação mobile */}
          <div className="md:hidden pb-4">
            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? 'bg-red-600 text-white'
                      : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Modal de Login */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </>
  );
};

export default Header;

