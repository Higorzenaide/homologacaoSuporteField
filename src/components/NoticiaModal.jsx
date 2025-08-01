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

  // Função para sanitizar HTML básica
  const sanitizeHTML = (html) => {
    if (!html) return '';
    return html;
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
            <div className="prose prose-lg max-w-none">
              {/* Renderizar HTML formatado */}
              <div 
                className="text-gray-700 leading-relaxed space-y-4 formatted-content"
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeHTML(noticia.conteudo) 
                }}
              />
            </div>
          </div>

          {/* Seção de comentários */}
          <ComentariosSectionNoticia 
            noticiaId={noticia.id}
            onComentarioChange={() => {}}
          />
        </div>
      </div>

      {/* Estilos CSS para o conteúdo formatado */}
      <style jsx>{`
        .formatted-content {
          font-size: 16px;
          line-height: 1.6;
          font-family: inherit;
        }
        
        .formatted-content h1, 
        .formatted-content h2, 
        .formatted-content h3, 
        .formatted-content h4, 
        .formatted-content h5, 
        .formatted-content h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
          line-height: 1.25;
        }
        
        .formatted-content h1 { font-size: 2em; color: #1f2937; }
        .formatted-content h2 { font-size: 1.5em; color: #1f2937; }
        .formatted-content h3 { font-size: 1.25em; color: #374151; }
        .formatted-content h4 { font-size: 1.125em; color: #374151; }
        .formatted-content h5 { font-size: 1em; color: #4b5563; }
        .formatted-content h6 { font-size: 0.875em; color: #4b5563; }
        
        .formatted-content p {
          margin-bottom: 1em;
          text-align: justify;
        }
        
        .formatted-content strong, 
        .formatted-content b {
          font-weight: 600 !important;
          color: #1f2937;
        }
        
        .formatted-content em, 
        .formatted-content i {
          font-style: italic;
        }
        
        .formatted-content u {
          text-decoration: underline;
        }
        
        .formatted-content s, 
        .formatted-content strike {
          text-decoration: line-through;
        }
        
        .formatted-content ul, 
        .formatted-content ol {
          margin: 1em 0;
          padding-left: 1.5em;
        }
        
        .formatted-content li {
          margin-bottom: 0.5em;
        }
        
        .formatted-content blockquote {
          border-left: 4px solid #dc2626;
          padding-left: 1em;
          margin: 1.5em 0;
          font-style: italic;
          color: #4b5563;
          background-color: #f9fafb;
          padding: 1em;
          border-radius: 0.375rem;
        }
        
        .formatted-content a {
          color: #dc2626;
          text-decoration: underline;
        }
        
        .formatted-content a:hover {
          color: #b91c1c;
        }
        
        .formatted-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 1em 0;
        }
        
        .formatted-content code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875em;
        }
        
        .formatted-content pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1em;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1em 0;
        }
        
        .formatted-content pre code {
          background: none;
          color: inherit;
          padding: 0;
        }

        /* Cores personalizadas do editor */
        .formatted-content [style*="color: rgb(220, 38, 38)"] {
          color: #dc2626 !important;
        }
        
        .formatted-content [style*="color: rgb(5, 150, 105)"] {
          color: #059669 !important;
        }
        
        .formatted-content [style*="color: rgb(37, 99, 235)"] {
          color: #2563eb !important;
        }
        
        .formatted-content [style*="color: rgb(0, 0, 0)"] {
          color: #000000 !important;
        }

        /* Tamanhos de fonte */
        .formatted-content font[size="1"] {
          font-size: 0.75em;
        }
        
        .formatted-content font[size="3"] {
          font-size: 1em;
        }
        
        .formatted-content font[size="5"] {
          font-size: 1.25em;
        }
        
        .formatted-content font[size="7"] {
          font-size: 1.5em;
        }
      `}</style>
    </div>
  );
};

export default NoticiaModal;