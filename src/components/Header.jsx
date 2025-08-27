import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import UserMenu from './UserMenu';
import NotificationBadge from './NotificationBadge';
import AnalyticsPanel from './AnalyticsPanel';

const Header = ({ currentPage, setCurrentPage }) => {
  const { user, isAdmin, canViewFeedbacks } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuPinned, setIsMenuPinned] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Detectar scroll para efeitos visuais
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Início', icon: '🏠', desc: 'Página inicial' },
    { id: 'treinamentos', label: 'Treinamentos', icon: '📚', desc: 'Materiais de estudo' },
    { id: 'noticias', label: 'Notícias', icon: '📰', desc: 'Últimas atualizações' },
    { id: 'links', label: 'Links Importantes', icon: '🔗', desc: 'Recursos úteis' },
  ];

  // Adicionar itens específicos para admin
  if (isAdmin) {
    navItems.push(
      { id: 'usuarios', label: 'Usuários', icon: '👤', desc: 'Gerenciar equipe' },
      { id: 'inserir-feedback', label: 'Inserir Feedback', icon: '📝', desc: 'Novo feedback' }
    );
    
    if (canViewFeedbacks) {
      navItems.push({ id: 'visualizar-feedbacks', label: 'Visualizar Feedbacks', icon: '📊', desc: 'Análise de dados' });
    }
  }

  const toggleMenu = () => {
    if (!isMenuPinned) {
      setIsMenuOpen(!isMenuOpen);
    }
  };

  const togglePin = () => {
    setIsMenuPinned(!isMenuPinned);
    if (!isMenuPinned) {
      setIsMenuOpen(true);
    }
  };

  const handleNavClick = (pageId) => {
    setCurrentPage(pageId);
    if (!isMenuPinned) {
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      {/* Header Principal */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-lg shadow-xl border-b border-red-100' 
          : 'bg-white shadow-lg'
      }`}>
        <div className="px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo com animação */}
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl overflow-hidden flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                  <img
                    src="/logo.jpeg"
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Efeito de brilho */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
              <div className="transform transition-all duration-300 group-hover:translate-x-1">
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-red-600 bg-clip-text text-transparent">
                  Desktop
                </h1>
                <p className="text-sm text-gray-600 font-medium">Suporte Field</p>
              </div>
            </div>

            {/* Navegação Desktop - PADRÃO VERMELHO */}
            <nav className="hidden lg:flex items-center space-x-3">
              {navItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                    currentPage === item.id
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                      : 'text-gray-700 hover:text-red-600 hover:bg-red-50 hover:shadow-md'
                  }`}
                >
                  <span className="mr-2 text-lg">{item.icon}</span>
                  <span className="font-semibold">{item.label}</span>
                  
                  {/* Efeito de ondulação sutil */}
                  {currentPage !== item.id && (
                    <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 rounded-xl bg-red-500/10 transform scale-0 hover:scale-100 transition-transform duration-300"></div>
                    </div>
                  )}
                  
                  {/* Indicador ativo */}
                  {currentPage === item.id && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                  )}
                </button>
              ))}
            </nav>

            {/* Botão Hambúrguer + User Menu */}
            <div className="flex items-center space-x-6">
              {/* Analytics Button - Admin Only */}
              {user && isAdmin && (
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setShowAnalytics(true)}
                    className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    title="Analytics"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Notification Badge */}
              {user && (
                <div className="flex-shrink-0">
                  <NotificationBadge />
                </div>
              )}
              
              {/* User Menu */}
              {user ? (
                <div className="flex-shrink-0">
                  <UserMenu />
                </div>
              ) : (
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium"
                  >
                    Entrar
                  </button>
                </div>
              )}

              {/* Botão Hambúrguer Animado */}
              <div className="flex-shrink-0">
                <button
                  onClick={toggleMenu}
                  className="lg:hidden relative w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center transform transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl"
                >
                  <div className="w-6 h-6 flex flex-col justify-center items-center">
                    <span className={`block w-6 h-0.5 bg-white transform transition-all duration-300 ${
                      isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                    }`}></span>
                    <span className={`block w-6 h-0.5 bg-white mt-1 transform transition-all duration-300 ${
                      isMenuOpen ? 'opacity-0' : ''
                    }`}></span>
                    <span className={`block w-6 h-0.5 bg-white mt-1 transform transition-all duration-300 ${
                      isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                    }`}></span>
                  </div>
                  
                  {/* Efeito de pulso quando ativo */}
                  {isMenuOpen && (
                    <div className="absolute inset-0 rounded-xl bg-red-400 animate-ping opacity-30"></div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Lateral Animado - PADRÃO VERMELHO */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-all duration-500 z-40 ${
        isMenuOpen || isMenuPinned ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header do Menu */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-500 to-red-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🚀</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Menu</h3>
                <p className="text-red-100 text-sm">Navegação rápida</p>
              </div>
            </div>
            
            {/* Botões de controle */}
            <div className="flex items-center space-x-2">
              {/* Botão de fixar */}
              <button
                onClick={togglePin}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isMenuPinned 
                    ? 'bg-white/30 text-white' 
                    : 'bg-white/10 text-red-100 hover:bg-white/20'
                }`}
                title={isMenuPinned ? 'Desafixar menu' : 'Fixar menu aberto'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d={isMenuPinned 
                      ? "M19 14l-7 7m0 0l-7-7m7 7V3" 
                      : "M5 10l7-7m0 0l7 7m-7-7v18"
                    } 
                  />
                </svg>
              </button>
              
              {/* Botão fechar */}
              {!isMenuPinned && (
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg bg-white/10 text-red-100 hover:bg-white/20 transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Navegação - PADRÃO VERMELHO */}
        <div className="p-6 space-y-3">
          {navItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 transform hover:scale-105 group ${
                currentPage === item.id
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-red-50 hover:shadow-md hover:text-red-600'
              }`}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: isMenuOpen ? 'slideInRight 0.5s ease-out forwards' : ''
              }}
            >
              {/* Ícone com efeito */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                currentPage === item.id
                  ? 'bg-white/20'
                  : 'bg-gradient-to-br from-red-100 to-red-200 text-red-600 group-hover:scale-110 group-hover:from-red-200 group-hover:to-red-300'
              }`}>
                <span className="text-xl">{item.icon}</span>
              </div>
              
              {/* Texto */}
              <div className="flex-1 text-left">
                <div className="font-semibold">{item.label}</div>
                <div className={`text-sm ${
                  currentPage === item.id ? 'text-red-100' : 'text-gray-500 group-hover:text-red-500'
                }`}>
                  {item.desc}
                </div>
              </div>
              
              {/* Indicador ativo */}
              {currentPage === item.id && (
                <div className="w-2 h-8 bg-white rounded-full"></div>
              )}
              
              {/* Seta */}
              <svg className={`w-5 h-5 transition-transform duration-300 ${
                currentPage === item.id ? 'text-white' : 'text-gray-400 group-hover:translate-x-1 group-hover:text-red-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        {/* Footer do Menu */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-gray-50/80">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">
              {isMenuPinned ? '📌 Menu fixado' : '🎯 Menu flutuante'}
            </div>
            <div className="text-xs text-gray-500">
              Desktop Suporte Field © 2025
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {(isMenuOpen && !isMenuPinned) && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* Espaçador para o header fixo */}
      <div className="h-16"></div>

      {/* Modal de Login */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

      {/* Estilos CSS para animações */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Analytics Panel */}
      <AnalyticsPanel 
        isOpen={showAnalytics} 
        onClose={() => setShowAnalytics(false)} 
      />
    </>
  );
};

export default Header;