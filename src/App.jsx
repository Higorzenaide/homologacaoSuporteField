import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Treinamentos from './pages/Treinamentos';
import Noticias from './pages/Noticias';
import LinksImportantes from './pages/LinksImportantes';
import Usuarios from './pages/Usuarios';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home setCurrentPage={setCurrentPage} />;
      case 'treinamentos':
        return <Treinamentos />;
      case 'noticias':
        return <Noticias />;
      case 'links':
        return <LinksImportantes />;
      case 'usuarios':
        return <Usuarios />;
      default:
        return <Home setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main>
          {renderPage()}
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;

