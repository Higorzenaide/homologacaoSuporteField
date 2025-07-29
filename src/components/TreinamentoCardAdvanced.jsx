import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CurtidasButton from './CurtidasButton';
import EditDeleteActions from './EditDeleteActions';
import { contarComentarios } from '../services/comentariosService';

const TreinamentoCardAdvanced = ({ 
  treinamento, 
  onEdit, 
  onDelete, 
  onViewPDF, 
  onOpenComments 
}) => {
  const { isAdmin } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [comentariosCount, setComentariosCount] = useState(0);

  // Carregar contador de comentários
  useEffect(() => {
    const carregarContadorComentarios = async () => {
      try {
        const result = await contarComentarios(treinamento.id);
        if (result.count !== undefined) {
          setComentariosCount(result.count);
        }
      } catch (error) {
        console.error('Erro ao carregar contador de comentários:', error);
        setComentariosCount(0);
      }
    };

    if (treinamento.id) {
      carregarContadorComentarios();
    }
  }, [treinamento.id]);

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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

  const getTipoIcon = (tipo) => {
    if (tipo?.toLowerCase() === 'pdf') {
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
      </svg>
    );
  };

  return (
    <div 
      className={`
        group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl 
        transition-all duration-500 transform hover:-translate-y-3 
        overflow-hidden border border-gray-100 cursor-pointer
        ${isHovered ? 'scale-[1.02]' : 'scale-100'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header com gradiente e logo */}
      <div className={`relative bg-gradient-to-br ${getCategoriaColor(treinamento.categoria)} p-4 text-white overflow-hidden`}>
        {/* Elementos decorativos animados */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-110"></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 bg-white bg-opacity-10 rounded-full -ml-6 -mb-6 transition-transform duration-700 group-hover:scale-110"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2 flex-1 min-w-0 pr-3">
              {/* Logo do treinamento */}
              {treinamento.logo_url ? (
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-md p-1 backdrop-blur-sm flex-shrink-0">
                  <img 
                    src={treinamento.logo_url} 
                    alt="Logo"
                    className={`w-full h-full object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageLoaded(false)}
                  />
                  {!imageLoaded && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-5 h-5">
                        {getTipoIcon(treinamento.tipo)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-md flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                  <div className="w-5 h-5">
                    {getTipoIcon(treinamento.tipo)}
                  </div>
                </div>
              )}
              
              {/* Badge do tipo */}
              <div className="bg-white bg-opacity-20 text-white text-xs px-3 py-1 rounded-full font-medium backdrop-blur-sm flex-shrink-0">
                {treinamento.tipo?.toUpperCase()}
              </div>
            </div>
            
            {/* Ações do admin */}
            {isAdmin && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0">
                <EditDeleteActions
                  item={treinamento}
                  type="treinamento"
                  onEdit={() => onEdit(treinamento)}
                  onDelete={() => onDelete(treinamento)}
                />
              </div>
            )}
          </div>
          
          {/* Título */}
          <h3 className="text-lg font-bold mb-3 line-clamp-2 leading-tight">
            {treinamento.titulo}
          </h3>
          
          {/* Data e categoria */}
          <div className="flex items-center justify-between text-white text-opacity-90 text-sm">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">{formatarData(treinamento.created_at)}</span>
            </div>
            {/* Badge da categoria */}
            {treinamento.categoria && (
              <div className="bg-white bg-opacity-20 text-white text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm">
                {treinamento.categoria}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo do card */}
      <div className="p-6">
        {/* Descrição */}
        {treinamento.descricao && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
            {treinamento.descricao}
          </p>
        )}

        {/* Categoria - sempre exibir se disponível */}
        {(treinamento.categoria || treinamento.categoria_nome || treinamento.tipo) && (
          <div className="mb-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
              📁 {treinamento.categoria || treinamento.categoria_nome || treinamento.tipo}
            </span>
          </div>
        )}
        
        {/* Tags coloridas - com fallback para dados de exemplo */}
        {(() => {
          const tags = treinamento.tags || ['Treinamento', 'Educação']; // Tags de exemplo se não houver
          return tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.slice(0, 4).map((tag, index) => {
                const colors = [
                  'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
                  'bg-gradient-to-r from-green-500 to-green-600 text-white',
                  'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
                  'bg-gradient-to-r from-pink-500 to-pink-600 text-white',
                  'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white',
                  'bg-gradient-to-r from-red-500 to-red-600 text-white'
                ];
                const colorClass = colors[index % colors.length];
                
                return (
                  <span 
                    key={index}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 ${colorClass}`}
                  >
                    #{tag}
                  </span>
                );
              })}
              {tags.length > 4 && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm">
                  +{tags.length - 4}
                </span>
              )}
            </div>
          );
        })()}
        
        {/* Estatísticas */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{treinamento.visualizacoes || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{treinamento.downloads || 0}</span>
            </div>
          </div>
          
          {/* Tamanho do arquivo */}
          {treinamento.arquivo_tamanho && (
            <span className="text-xs text-gray-400">
              {(treinamento.arquivo_tamanho / (1024 * 1024)).toFixed(1)} MB
            </span>
          )}
        </div>
        
        {/* Ações e interações */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            {/* Botão de curtidas */}
            <CurtidasButton treinamentoId={treinamento.id} />
            
            {/* Botão de comentários */}
            <button
              onClick={() => onOpenComments(treinamento)}
              className="flex items-center space-x-1 px-2 py-1.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:shadow-sm transition-all duration-200 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-medium">{comentariosCount}</span>
            </button>
          </div>
          
          {/* Botão de visualizar */}
          <button
            onClick={() => onViewPDF(treinamento)}
            className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Visualizar</span>
          </button>
        </div>
      </div>
      
      {/* Efeito de brilho no hover */}
      <div className={`
        absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 
        transform -skew-x-12 transition-all duration-700 pointer-events-none
        ${isHovered ? 'opacity-20 translate-x-full' : '-translate-x-full'}
      `}></div>
    </div>
  );
};

export default TreinamentoCardAdvanced;

