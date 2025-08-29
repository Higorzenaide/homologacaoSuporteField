import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import FirstLoginModal from './components/FirstLoginModal';
import Header from './components/Header';
import CacheMonitor from './components/CacheMonitor';
import PerformanceMonitor from './components/PerformanceMonitor';
import { preloadEssentialData } from './services/cachedServices';
import { preloadUserCurtidas } from './services/curtidasOptimizedService';
import Home from './pages/Home';
import Treinamentos from './pages/Treinamentos';
import Noticias from './pages/Noticias';
import LinksImportantes from './pages/LinksImportantes';
import Usuarios from './pages/Usuarios';
import InserirFeedback from './pages/InserirFeedback';
import VisualizarFeedbacks from './pages/VisualizarFeedbacks';

import './App.css';

// Componente interno que tem acesso ao AuthContext
const AppContent = () => {
  const { showFirstLoginModal, handleFirstLoginCompleted, user } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams, setPageParams] = useState(null);

  // Função para navegar programaticamente (usada pelas notificações)
  const navigateToPage = (page, params = null) => {
    setCurrentPage(page);
    setPageParams(params);
    
    // Atualizar a URL do navegador sem recarregar a página
    const url = params ? `/${page}/${params.id || ''}` : `/${page}`;
    window.history.pushState({}, '', url);
  };

  // Verificar URL inicial e configurar navegação
  useEffect(() => {
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(part => part.length > 0);
    
    if (pathParts.length === 0) {
      setCurrentPage('home');
    } else if (pathParts.length === 1) {
      // URLs como /treinamentos, /noticias, etc.
      const page = pathParts[0];
      if (['treinamentos', 'noticias', 'links', 'usuarios', 'inserir-feedback', 'visualizar-feedbacks'].includes(page)) {
        setCurrentPage(page);
      } else {
        setCurrentPage('home');
      }
    } else if (pathParts.length === 2) {
      // URLs como /treinamentos/58
      const page = pathParts[0];
      const id = pathParts[1];
      
      if (['treinamentos', 'noticias'].includes(page) && !isNaN(id)) {
        setCurrentPage(page);
        setPageParams({ id: parseInt(id) });
      } else {
        setCurrentPage('home');
      }
    } else {
      setCurrentPage('home');
    }

    // Disponibilizar a função de navegação globalmente para as notificações
    window.navigateToPage = navigateToPage;

    // Pré-carregar dados essenciais
    preloadEssentialData();
  }, []);

  // Limpar parâmetros quando mudar de página
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setPageParams(null);
    window.history.pushState({}, '', `/${newPage}`);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home setCurrentPage={handlePageChange} />;
      case 'treinamentos':
        return <Treinamentos pageParams={pageParams} />;
      case 'noticias':
        return <Noticias pageParams={pageParams} />;
      case 'links':
        return <LinksImportantes />;
      case 'usuarios':
        return <Usuarios />;
      case 'inserir-feedback':
        return <InserirFeedback />;
      case 'visualizar-feedbacks':
        return <VisualizarFeedbacks />;
      default:
        return <Home setCurrentPage={handlePageChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage={currentPage} setCurrentPage={handlePageChange} />
      <main>
        {renderPage()}
      </main>
      
      {/* Modal de Primeiro Login */}
      <FirstLoginModal
        isOpen={showFirstLoginModal}
        onPasswordChanged={handleFirstLoginCompleted}
        userEmail={user?.email}
      />
      
      {/* Monitores de desenvolvimento - descomente para testar */}
      {/* <CacheMonitor /> */}
      {/* <PerformanceMonitor /> */}
    </div>
  );
};

// Componente principal App
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

