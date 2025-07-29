import React, { useState, useEffect } from 'react';
import ComentariosSection from './ComentariosSection';
import CurtidasButton from './CurtidasButton';
import PDFViewer from './PDFViewer';
import { contarComentarios } from '../services/comentariosService';
import { contarCurtidas } from '../services/curtidasService';

const TreinamentoModal = ({ treinamento, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('detalhes');
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [totalComentarios, setTotalComentarios] = useState(0);
  const [totalCurtidas, setTotalCurtidas] = useState(0);

  // Carregar contadores quando o modal abrir
  useEffect(() => {
    const carregarContadores = async () => {
      if (isOpen && treinamento?.id) {
        try {
          // Carregar contador de comentários
          const comentariosResult = await contarComentarios(treinamento.id);
          if (comentariosResult.count !== undefined) {
            setTotalComentarios(comentariosResult.count);
          }

          // Carregar contador de curtidas
          const curtidasResult = await contarCurtidas(treinamento.id);
          if (curtidasResult.count !== undefined) {
            setTotalCurtidas(curtidasResult.count);
          }
        } catch (error) {
          console.error('Erro ao carregar contadores:', error);
          setTotalComentarios(0);
          setTotalCurtidas(0);
        }
      }
    };

    carregarContadores();
  }, [isOpen, treinamento?.id]);

  if (!isOpen || !treinamento) return null;

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewPDF = () => {
    setShowPDFViewer(true);
    // Abrir em nova aba também
    if (treinamento.arquivo_url) {
      window.open(treinamento.arquivo_url, '_blank', 'noopener,noreferrer');
    }
  };

  const getCategoriaColor = (categoria) => {
    const colors = {
      'Equipamentos': 'from-blue-500 to-blue-600',
      'Ferramentas': 'from-green-500 to-green-600',
      'Resultados': 'from-purple-500 to-purple-600',
      'Segurança': 'from-red-500 to-red-600',
      'Treinamento': 'from-orange-500 to-orange-600',
      'default': 'from-red-800 to-red-900'
    };
    return colors[categoria] || colors.default;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className={`relative bg-gradient-to-br ${getCategoriaColor(treinamento.categoria)} p-8 text-white`}>
            {/* Elementos decorativos */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -ml-12 -mb-12"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-6 flex-1">
                  {/* Logo do treinamento */}
                  {treinamento.logo_url ? (
                    <div className="w-20 h-20 bg-white bg-opacity-20 rounded-xl p-3 backdrop-blur-sm flex-shrink-0">
                      <img 
                        src={treinamento.logo_url} 
                        alt="Logo do treinamento"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="bg-white bg-opacity-20 text-white text-sm px-4 py-2 rounded-full font-medium backdrop-blur-sm">
                        {treinamento.tipo?.toUpperCase()}
                      </span>
                      <span className="bg-white bg-opacity-20 text-white text-sm px-4 py-2 rounded-full font-medium backdrop-blur-sm">
                        {treinamento.categoria}
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold leading-tight mb-2">
                      {treinamento.titulo}
                    </h2>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors backdrop-blur-sm flex-shrink-0 ml-4"
                >
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Informações básicas */}
              <div className="flex items-center flex-wrap gap-6 text-white text-opacity-90 text-sm">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatarData(treinamento.created_at)}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>1.3 MB</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{treinamento.visualizacoes || 0} visualizações</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('detalhes')}
                className={`py-4 px-2 border-b-2 font-medium text-base transition-colors ${
                  activeTab === 'detalhes'
                    ? 'border-red-800 text-red-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Detalhes
              </button>
              <button
                onClick={() => setActiveTab('comentarios')}
                className={`py-4 px-2 border-b-2 font-medium text-base transition-colors flex items-center space-x-2 ${
                  activeTab === 'comentarios'
                    ? 'border-red-800 text-red-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>Comentários</span>
                {totalComentarios > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    {totalComentarios}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Conteúdo */}
          <div className="p-8 max-h-[60vh] overflow-y-auto">
            {activeTab === 'detalhes' && (
              <div className="space-y-6">
                {/* Descrição */}
                {treinamento.descricao && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Descrição</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {treinamento.descricao}
                    </p>
                  </div>
                )}
                
                {/* Tags */}
                {treinamento.tags && treinamento.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {treinamento.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Estatísticas */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Estatísticas</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">{treinamento.visualizacoes || 0}</div>
                      <div className="text-sm text-gray-500">Visualizações</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">{treinamento.downloads || 0}</div>
                      <div className="text-sm text-gray-500">Downloads</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">{totalCurtidas}</div>
                      <div className="text-sm text-gray-500">Curtidas</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">{totalComentarios}</div>
                      <div className="text-sm text-gray-500">Comentários</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'comentarios' && (
              <ComentariosSection 
                treinamentoId={treinamento.id} 
                onComentarioChange={setTotalComentarios}
              />
            )}
          </div>

          {/* Footer com ações */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CurtidasButton 
                  treinamentoId={treinamento.id} 
                  onCurtidaChange={setTotalCurtidas}
                />
                
                <button
                  onClick={() => setActiveTab('comentarios')}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Comentar</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <a
                  href={treinamento.arquivo_url}
                  download
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Baixar</span>
                </a>
                
                <button
                  onClick={handleViewPDF}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Visualizar Treinamento</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {showPDFViewer && (
        <PDFViewer
          isOpen={showPDFViewer}
          onClose={() => setShowPDFViewer(false)}
          pdfData={{
            url: treinamento.arquivo_url,
            title: treinamento.titulo
          }}
        />
      )}
    </>
  );
};

export default TreinamentoModal;

