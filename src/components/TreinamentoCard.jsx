import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toggleCurtidaTreinamento, verificarCurtida, adicionarComentario, getComentariosTreinamento } from '../services/interacaoService';
import EditDeleteActions from './EditDeleteActions';

const TreinamentoCard = ({ 
  treinamento, 
  isAdmin, 
  onEdit, 
  onDelete, 
  onViewPDF,
  index = 0 
}) => {
  const { user } = useAuth();
  const [curtido, setCurtido] = useState(false);
  const [totalCurtidas, setTotalCurtidas] = useState(treinamento.total_curtidas || 0);
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [loadingCurtida, setLoadingCurtida] = useState(false);
  const [loadingComentario, setLoadingComentario] = useState(false);

  useEffect(() => {
    if (user) {
      verificarCurtidaUsuario();
      carregarComentarios();
    }
  }, [user, treinamento.id]);

  const verificarCurtidaUsuario = async () => {
    try {
      const jasCurtiu = await verificarCurtida(treinamento.id, user.id);
      setCurtido(jasCurtiu);
    } catch (error) {
      console.error('Erro ao verificar curtida:', error);
    }
  };

  const carregarComentarios = async () => {
    try {
      const comentariosData = await getComentariosTreinamento(treinamento.id);
      setComentarios(comentariosData);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    }
  };

  const handleCurtir = async () => {
    if (!user || loadingCurtida) return;
    
    setLoadingCurtida(true);
    try {
      const resultado = await toggleCurtidaTreinamento(treinamento.id, user.id);
      setCurtido(resultado.curtido);
      setTotalCurtidas(resultado.total_curtidas);
    } catch (error) {
      console.error('Erro ao curtir:', error);
    } finally {
      setLoadingCurtida(false);
    }
  };

  const handleAdicionarComentario = async (e) => {
    e.preventDefault();
    if (!user || !novoComentario.trim() || loadingComentario) return;

    setLoadingComentario(true);
    try {
      const comentario = await adicionarComentario(treinamento.id, user.id, novoComentario);
      setComentarios([comentario, ...comentarios]);
      setNovoComentario('');
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    } finally {
      setLoadingComentario(false);
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatarDataHora = (data) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 overflow-hidden border border-gray-100 relative"
      style={{
        animationDelay: `${index * 100}ms`,
        animation: 'fadeInUp 0.6s ease-out forwards'
      }}
    >
      {/* Efeito de brilho no hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-15 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
      
      {/* Header do Card com Gradiente Dinâmico */}
      <div className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-6 text-white overflow-hidden">
        {/* Elementos decorativos animados */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -ml-12 -mb-12 group-hover:scale-110 transition-transform duration-500"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white bg-opacity-5 rounded-full group-hover:animate-pulse"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              {/* Logo do treinamento */}
              {treinamento.logo_url ? (
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl p-2 backdrop-blur-sm">
                  <img 
                    src={treinamento.logo_url} 
                    alt="Logo do treinamento"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              
              <div className="flex flex-col space-y-1">
                <span className="bg-white bg-opacity-25 text-white text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-sm">
                  {treinamento.tipo?.toUpperCase()}
                </span>
                <div className="flex items-center text-red-100 text-xs">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatarData(treinamento.dataUpload || treinamento.created_at)}
                </div>
              </div>
            </div>
            
            {isAdmin && (
              <EditDeleteActions
                item={treinamento}
                type="treinamento"
                onEdit={onEdit}
                onDelete={onDelete}
              />
            )}
          </div>
          
          <h3 className="text-xl font-bold mb-3 line-clamp-2 cursor-pointer hover:text-red-100 transition-colors leading-tight"
              onClick={() => treinamento.tipo === 'pdf' && onViewPDF(treinamento)}>
            {treinamento.titulo}
          </h3>
          
          {/* Estatísticas rápidas */}
          <div className="flex items-center space-x-4 text-red-100 text-sm">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{totalCurtidas}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{comentarios.length}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{treinamento.visualizacoes || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo do Card */}
      <div className="p-6">
        {/* Badge da Categoria com ícone */}
        <div className="mb-4">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200 shadow-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {treinamento.categoria}
          </span>
        </div>
        
        {/* Descrição */}
        {treinamento.descricao && (
          <p className="text-gray-600 text-sm mb-5 line-clamp-3 leading-relaxed">
            {treinamento.descricao}
          </p>
        )}
        
        {/* Tags */}
        {treinamento.tags && treinamento.tags.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {treinamento.tags.slice(0, 4).map((tag, index) => (
                <span 
                  key={index} 
                  className="bg-gray-50 text-gray-700 text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-default"
                >
                  #{tag}
                </span>
              ))}
              {treinamento.tags.length > 4 && (
                <span className="text-gray-400 text-xs flex items-center px-2">
                  +{treinamento.tags.length - 4} mais
                </span>
              )}
            </div>
          </div>
        )}

        {/* Botões de Ação Principais */}
        <div className="space-y-3 mb-6">
          {treinamento.tipo === 'pdf' ? (
            <>
              <button
                onClick={() => onViewPDF(treinamento)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Visualizar Treinamento</span>
              </button>
              <a
                href={treinamento.arquivo_url}
                download
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm text-center flex items-center justify-center space-x-2 border border-gray-200 hover:border-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Baixar PDF</span>
              </a>
            </>
          ) : (
            <a
              href={treinamento.arquivo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Visualizar Treinamento</span>
            </a>
          )}
        </div>

        {/* Seção de Interações Sociais */}
        {user && (
          <div className="border-t border-gray-100 pt-4">
            {/* Botões de Curtir e Comentar */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleCurtir}
                disabled={loadingCurtida}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                  curtido 
                    ? 'bg-red-50 text-red-600 border border-red-200' 
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                }`}
              >
                <svg 
                  className={`w-5 h-5 ${loadingCurtida ? 'animate-pulse' : ''} ${curtido ? 'fill-current' : ''}`} 
                  fill={curtido ? 'currentColor' : 'none'} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="font-medium">{totalCurtidas}</span>
              </button>

              <button
                onClick={() => setMostrarComentarios(!mostrarComentarios)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="font-medium">{comentarios.length}</span>
              </button>
            </div>

            {/* Seção de Comentários */}
            {mostrarComentarios && (
              <div className="space-y-4">
                {/* Formulário para novo comentário */}
                <form onSubmit={handleAdicionarComentario} className="space-y-3">
                  <textarea
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    placeholder="Escreva um comentário..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200"
                    rows="3"
                  />
                  <button
                    type="submit"
                    disabled={!novoComentario.trim() || loadingComentario}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                  >
                    {loadingComentario ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                    <span>Comentar</span>
                  </button>
                </form>

                {/* Lista de comentários */}
                {comentarios.length > 0 && (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {comentarios.map((comentario) => (
                      <div key={comentario.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">
                                {comentario.nome_usuario.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-gray-900">{comentario.nome_usuario}</p>
                              <p className="text-xs text-gray-500">{formatarDataHora(comentario.created_at)}</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{comentario.comentario}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// CSS para animação (adicionar ao arquivo CSS global)
const styles = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
`;

export default TreinamentoCard;

