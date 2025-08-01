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

  // Função para sanitizar HTML (básica - para produção, use uma biblioteca como DOMPurify)
  const sanitizeHTML = (html) => {
    if (!html) return '';
    
    // Lista básica de tags permitidas
    const allowedTags = [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote',
      'a', 'img',
      'span', 'div'
    ];
    
    // Para uma implementação mais robusta, use DOMPurify
    // Por enquanto, retornamos o HTML como está
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
                className="text-gray-700 leading-relaxed space-y-4 ql-editor"
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeHTML(noticia.conteudo) 
                }}
                style={{
                  // Estilos para compatibilidade com ReactQuill
                  fontSize: '16px',
                  lineHeight: '1.6',
                  fontFamily: 'inherit'
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
        .ql-editor {
          padding: 0;
          border: none;
        }
        
        .ql-editor h1, .ql-editor h2, .ql-editor h3, 
        .ql-editor h4, .ql-editor h5, .ql-editor h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
          line-height: 1.25;
        }
        
        .ql-editor h1 { font-size: 2em; color: #1f2937; }
        .ql-editor h2 { font-size: 1.5em; color: #1f2937; }
        .ql-editor h3 { font-size: 1.25em; color: #374151; }
        .ql-editor h4 { font-size: 1.125em; color: #374151; }
        .ql-editor h5 { font-size: 1em; color: #4b5563; }
        .ql-editor h6 { font-size: 0.875em; color: #4b5563; }
        
        .ql-editor p {
          margin-bottom: 1em;
          text-align: justify;
        }
        
        .ql-editor strong, .ql-editor b {
          font-weight: 600;
          color: #1f2937;
        }
        
        .ql-editor em, .ql-editor i {
          font-style: italic;
        }
        
        .ql-editor u {
          text-decoration: underline;
        }
        
        .ql-editor s, .ql-editor strike {
          text-decoration: line-through;
        }
        
        .ql-editor ul, .ql-editor ol {
          margin: 1em 0;
          padding-left: 1.5em;
        }
        
        .ql-editor li {
          margin-bottom: 0.5em;
        }
        
        .ql-editor blockquote {
          border-left: 4px solid #dc2626;
          padding-left: 1em;
          margin: 1.5em 0;
          font-style: italic;
          color: #4b5563;
          background-color: #f9fafb;
          padding: 1em;
          border-radius: 0.375rem;
        }
        
        .ql-editor a {
          color: #dc2626;
          text-decoration: underline;
        }
        
        .ql-editor a:hover {
          color: #b91c1c;
        }
        
        .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 1em 0;
        }
        
        .ql-editor code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875em;
        }
        
        .ql-editor pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1em;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1em 0;
        }
        
        .ql-editor pre code {
          background: none;
          color: inherit;
          padding: 0;
        }
      `}</style>
    </div>
  );
};

export default NoticiaModal;