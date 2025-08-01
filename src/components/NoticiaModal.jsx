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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
        {/* Header Limpo e Moderno */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-8">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-6">
              {/* Badges */}
              <div className="flex items-center gap-3 mb-4">
                {noticia.destaque && (
                  <span className="bg-yellow-400 text-red-800 text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    DESTAQUE
                  </span>
                )}
                <span className="bg-white bg-opacity-20 backdrop-blur-sm text-black text-sm px-4 py-1.5 rounded-full border border-white border-opacity-30 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {noticia.categoria_nome}
                </span>
              </div>
              
              {/* Título */}
              <h1 className="text-3xl font-bold mb-4 leading-tight">
                {noticia.titulo}
              </h1>
              
              {/* Metadados */}
              <div className="flex items-center text-black text-opacity-90 text-sm">
                <div className="flex items-center mr-6 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">{noticia.autor}</span>
                </div>
                <div className="flex items-center bg-black bg-opacity-10 backdrop-blur-sm rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-1 12a2 2 0 002 2h6a2 2 0 002-2L16 7" />
                  </svg>
                  <span>{formatarData(noticia.data_publicacao)}</span>
                </div>
              </div>
            </div>
            
            {/* Botão fechar */}
            <button
              onClick={onClose}
              className="text-white hover:text-red-200 transition-colors p-3 hover:bg-white hover:bg-opacity-20 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="max-h-[calc(95vh-200px)] overflow-y-auto">
          {/* Artigo */}
          <article className="p-8">
            <div className="max-w-4xl mx-auto">
              {/* Conteúdo formatado */}
              <div className="prose prose-lg max-w-none mb-12">
                <div 
                  className="text-gray-800 leading-relaxed formatted-content article-content"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeHTML(noticia.conteudo) 
                  }}
                />
              </div>

              {/* Divisor elegante */}
              <div className="flex items-center my-12">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <div className="mx-4 text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>

              {/* Seção de comentários melhorada */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <ComentariosSectionNoticia 
                  noticiaId={noticia.id}
                  onComentarioChange={() => {}}
                />
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* Estilos CSS aprimorados */}
      <style jsx>{`
        .article-content {
          font-size: 18px;
          line-height: 1.8;
          font-family: 'Georgia', 'Times New Roman', serif;
          color: #1f2937;
        }
        
        .article-content h1, 
        .article-content h2, 
        .article-content h3, 
        .article-content h4, 
        .article-content h5, 
        .article-content h6 {
          margin-top: 2em;
          margin-bottom: 1em;
          font-weight: 700;
          line-height: 1.3;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .article-content h1 { 
          font-size: 2.5em; 
          color: #111827;
          border-bottom: 3px solid #dc2626;
          padding-bottom: 0.5em;
        }
        .article-content h2 { 
          font-size: 2em; 
          color: #1f2937;
          border-bottom: 2px solid #ef4444;
          padding-bottom: 0.3em;
        }
        .article-content h3 { 
          font-size: 1.5em; 
          color: #374151;
          border-bottom: 1px solid #f87171;
          padding-bottom: 0.2em;
        }
        .article-content h4 { font-size: 1.25em; color: #374151; }
        .article-content h5 { font-size: 1.1em; color: #4b5563; }
        .article-content h6 { font-size: 1em; color: #4b5563; }
        
        .article-content p {
          margin-bottom: 1.5em;
          text-align: justify;
          text-indent: 1.5em;
        }
        
        .article-content p:first-of-type {
          font-size: 1.1em;
          font-weight: 500;
          text-indent: 0;
          color: #374151;
        }
        
        .article-content strong, 
        .article-content b {
          font-weight: 700 !important;
          color: #111827;
          background: linear-gradient(120deg, #fef3c7 0%, #fde68a 100%);
          padding: 0.1em 0.2em;
          border-radius: 0.2em;
        }
        
        .article-content em, 
        .article-content i {
          font-style: italic;
          color: #4b5563;
        }
        
        .article-content u {
          text-decoration: underline;
          text-decoration-color: #dc2626;
          text-decoration-thickness: 2px;
        }
        
        .article-content s, 
        .article-content strike {
          text-decoration: line-through;
          color: #6b7280;
        }
        
        .article-content ul, 
        .article-content ol {
          margin: 1.5em 0;
          padding-left: 2em;
        }
        
        .article-content li {
          margin-bottom: 0.8em;
          line-height: 1.6;
        }
        
        .article-content ul li {
          list-style-type: none;
          position: relative;
        }
        
        .article-content ul li:before {
          content: "▶";
          color: #dc2626;
          font-weight: bold;
          position: absolute;
          left: -1.5em;
        }
        
        .article-content ol li {
          list-style-type: decimal;
          color: #374151;
        }
        
        .article-content blockquote {
          border-left: 4px solid #dc2626;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          margin: 2em 0;
          padding: 1.5em;
          border-radius: 0.5rem;
          font-style: italic;
          color: #7f1d1d;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .article-content blockquote:before {
          content: """;
          font-size: 4em;
          color: #dc2626;
          opacity: 0.3;
          float: left;
          line-height: 0.6em;
          margin-right: 0.25em;
          margin-top: 0.25em;
        }
        
        .article-content a {
          color: #dc2626;
          text-decoration: none;
          border-bottom: 2px solid transparent;
          transition: all 0.3s ease;
          font-weight: 500;
        }
        
        .article-content a:hover {
          color: #b91c1c;
          border-bottom-color: #dc2626;
          background-color: #fef2f2;
          padding: 0.1em 0.2em;
          border-radius: 0.2em;
        }
        
        .article-content img {
          max-width: 100%;
          height: auto;
          border-radius: 1rem;
          margin: 2em auto;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }
        
        .article-content code {
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          padding: 0.3em 0.6em;
          border-radius: 0.4rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9em;
          color: #1f2937;
          border: 1px solid #d1d5db;
        }
        
        .article-content pre {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: #f9fafb;
          padding: 1.5em;
          border-radius: 1rem;
          overflow-x: auto;
          margin: 2em 0;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
          border: 1px solid #374151;
        }
        
        .article-content pre code {
          background: none;
          color: inherit;
          padding: 0;
          border: none;
        }

        /* Cores personalizadas do editor */
        .article-content [style*="color: rgb(220, 38, 38)"] {
          color: #dc2626 !important;
          font-weight: 600;
        }
        
        .article-content [style*="color: rgb(5, 150, 105)"] {
          color: #059669 !important;
          font-weight: 600;
        }
        
        .article-content [style*="color: rgb(37, 99, 235)"] {
          color: #2563eb !important;
          font-weight: 600;
        }
        
        .article-content [style*="color: rgb(0, 0, 0)"] {
          color: #000000 !important;
          font-weight: 600;
        }

        /* Tamanhos de fonte melhorados */
        .article-content font[size="1"] {
          font-size: 0.8em;
          color: #6b7280;
        }
        
        .article-content font[size="3"] {
          font-size: 1em;
        }
        
        .article-content font[size="5"] {
          font-size: 1.3em;
          font-weight: 600;
          color: #1f2937;
        }
        
        .article-content font[size="7"] {
          font-size: 1.6em;
          font-weight: 700;
          color: #111827;
        }

        /* Animações suaves */
        .article-content * {
          transition: all 0.2s ease;
        }

        /* Melhorar legibilidade em dispositivos móveis */
        @media (max-width: 768px) {
          .article-content {
            font-size: 16px;
            line-height: 1.7;
          }
          
          .article-content h1 { font-size: 2em; }
          .article-content h2 { font-size: 1.6em; }
          .article-content h3 { font-size: 1.3em; }
          
          .article-content p {
            text-indent: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default NoticiaModal;