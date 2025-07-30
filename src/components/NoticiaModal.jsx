import React from 'react';
import ComentariosSectionNoticia from './ComentariosSectionNoticia';

const NoticiaModal = ({ isOpen, onClose, noticia }) => {
  if (!isOpen || !noticia) return null;

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-3">
                {noticia.destaque && (
                  <span className="bg-yellow-400 text-red-800 text-xs px-2 py-1 rounded-full font-semibold">
                    DESTAQUE
                  </span>
                )}
                <span className="bg-white bg-opacity-20 text-white text-xs px-2 py-1 rounded-full">
                  {noticia.categoria_nome}
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2">{noticia.titulo}</h2>
              <div className="flex items-center text-white text-opacity-90 text-sm">
                <span>Por: {noticia.autor}</span>
                <span className="mx-2">•</span>
                <span>{formatarData(noticia.data_publicacao)}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-8 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Conteúdo da notícia */}
          <div className="mb-8">
            <div className="prose max-w-none">
              <div className="text-gray-700 leading-relaxed text-lg space-y-4">
                {noticia.conteudo.split('\n').map((paragraph, index) => (
                  paragraph.trim() ? (
                    <p key={index} className="mb-4 text-justify">
                      {paragraph.trim()}
                    </p>
                  ) : (
                    <div key={index} className="h-2"></div>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* Seção de comentários */}
          <ComentariosSectionNoticia 
            noticiaId={noticia.id}
            onComentarioChange={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default NoticiaModal;

