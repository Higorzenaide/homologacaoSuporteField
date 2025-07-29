import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CurtidasButtonNoticia from './CurtidasButtonNoticia';
import EditDeleteActions from './EditDeleteActions';
import { contarComentariosNoticia } from '../services/comentariosNoticiasService';

const NoticiaCard = ({ 
  noticia, 
  onEdit, 
  onDelete, 
  onOpenComments,
  isDestaque = false
}) => {
  const { isAdmin } = useAuth();
  const [comentariosCount, setComentariosCount] = useState(0);

  // Carregar contador de comentários
  useEffect(() => {
    const carregarContadorComentarios = async () => {
      try {
        const result = await contarComentariosNoticia(noticia.id);
        if (result.count !== undefined) {
          setComentariosCount(result.count);
        }
      } catch (error) {
        console.error('Erro ao carregar contador de comentários:', error);
        setComentariosCount(0);
      }
    };

    if (noticia.id) {
      carregarContadorComentarios();
    }
  }, [noticia.id]);

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isDestaque) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-yellow-50 rounded-lg shadow-md overflow-hidden border-l-4 border-red-600">
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                DESTAQUE
              </span>
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                {noticia.categoria_nome}
              </span>
            </div>
            {isAdmin && (
              <EditDeleteActions
                onEdit={() => onEdit(noticia)}
                onDelete={() => onDelete(noticia)}
              />
            )}
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {noticia.titulo}
          </h3>
          
          <p className="text-gray-700 mb-4 line-clamp-3">
            {noticia.conteudo}
          </p>
          
          <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
            <span>Por: {noticia.autor}</span>
            <span>{formatarData(noticia.data_publicacao)}</span>
          </div>

          {/* Ações e interações */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              {/* Botão de curtidas */}
              <CurtidasButtonNoticia noticiaId={noticia.id} />
              
              {/* Botão de comentários */}
              <button
                onClick={() => onOpenComments(noticia)}
                className="flex items-center space-x-1 px-2 py-1.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:shadow-sm transition-all duration-200 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="font-medium">{comentariosCount}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {noticia.categoria_nome}
            </span>
          </div>
          {isAdmin && (
            <EditDeleteActions
              onEdit={() => onEdit(noticia)}
              onDelete={() => onDelete(noticia)}
            />
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {noticia.titulo}
        </h3>
        
        <p className="text-gray-600 mb-4 line-clamp-2">
          {noticia.conteudo}
        </p>
        
        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
          <span>Por: {noticia.autor}</span>
          <span>{formatarData(noticia.data_publicacao)}</span>
        </div>

        {/* Ações e interações */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            {/* Botão de curtidas */}
            <CurtidasButtonNoticia noticiaId={noticia.id} />
            
            {/* Botão de comentários */}
            <button
              onClick={() => onOpenComments(noticia)}
              className="flex items-center space-x-1 px-2 py-1.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:shadow-sm transition-all duration-200 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-medium">{comentariosCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticiaCard;

