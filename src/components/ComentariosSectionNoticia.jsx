import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getComentariosNoticia, 
  criarComentarioNoticia, 
  editarComentarioNoticia, 
  deletarComentarioNoticia 
} from '../services/comentariosNoticiasService';

const ComentariosSectionNoticia = ({ noticiaId, onComentarioChange }) => {
  const { user } = useAuth();
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [comentarioEditado, setComentarioEditado] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    carregarComentarios();
  }, [noticiaId]);

  const carregarComentarios = async () => {
    setLoading(true);
    try {
      const result = await getComentariosNoticia(noticiaId);
      if (result.error) {
        setError(result.error);
      } else {
        setComentarios(result.data);
        if (onComentarioChange) {
          onComentarioChange(result.data.length);
        }
      }
    } catch (error) {
      setError('Erro ao carregar comentários');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarComentario = async (e) => {
    e.preventDefault();
    if (!novoComentario.trim() || !user) return;

    setEnviando(true);
    try {
      const result = await criarComentarioNoticia(noticiaId, novoComentario, user.id);
      if (result.error) {
        setError(result.error);
      } else {
        setComentarios(prev => [result.data, ...prev]);
        setNovoComentario('');
        if (onComentarioChange) {
          onComentarioChange(comentarios.length + 1);
        }
      }
    } catch (error) {
      setError('Erro ao enviar comentário');
    } finally {
      setEnviando(false);
    }
  };

  const handleEditarComentario = async (comentarioId) => {
    if (!comentarioEditado.trim()) return;

    try {
      const result = await editarComentarioNoticia(comentarioId, comentarioEditado, user.id);
      if (result.error) {
        setError(result.error);
      } else {
        setComentarios(prev => 
          prev.map(c => c.id === comentarioId ? result.data : c)
        );
        setEditandoId(null);
        setComentarioEditado('');
      }
    } catch (error) {
      setError('Erro ao editar comentário');
    }
  };

  const handleDeletarComentario = async (comentarioId) => {
    if (!window.confirm('Tem certeza que deseja excluir este comentário?')) return;

    try {
      const result = await deletarComentarioNoticia(comentarioId, user.id);
      if (result.error) {
        setError(result.error);
      } else {
        setComentarios(prev => prev.filter(c => c.id !== comentarioId));
        if (onComentarioChange) {
          onComentarioChange(comentarios.length - 1);
        }
      }
    } catch (error) {
      setError('Erro ao excluir comentário');
    }
  };

  const iniciarEdicao = (comentario) => {
    setEditandoId(comentario.id);
    setComentarioEditado(comentario.comentario);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setComentarioEditado('');
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Comentários</h3>
          <p className="text-sm text-gray-500">
            {comentarios.length} {comentarios.length === 1 ? 'comentário' : 'comentários'}
          </p>
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Formulário para novo comentário */}
      {user && (
        <form onSubmit={handleEnviarComentario} className="mb-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">
                {user.nome?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <textarea
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                placeholder="Escreva um comentário..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows="3"
                disabled={enviando}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {novoComentario.length}/500 caracteres
                </span>
                <button
                  type="submit"
                  disabled={!novoComentario.trim() || enviando || novoComentario.length > 500}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
                >
                  {enviando ? 'Enviando...' : 'Comentar'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Lista de comentários */}
      <div className="space-y-4">
        {comentarios.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500">Nenhum comentário ainda</p>
            <p className="text-gray-400 text-sm">Seja o primeiro a comentar!</p>
          </div>
        ) : (
          comentarios.map((comentario) => (
            <div key={comentario.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">
                  {comentario.usuarios?.nome?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 text-sm">
                      {comentario.usuarios?.nome || 'Usuário'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatarData(comentario.created_at)}
                      {comentario.updated_at !== comentario.created_at && ' (editado)'}
                    </span>
                  </div>
                  {user && user.id === comentario.usuario_id && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => iniciarEdicao(comentario)}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                        title="Editar comentário"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeletarComentario(comentario.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Excluir comentário"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                
                {editandoId === comentario.id ? (
                  <div className="mt-2">
                    <textarea
                      value={comentarioEditado}
                      onChange={(e) => setComentarioEditado(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                      rows="2"
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={cancelarEdicao}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleEditarComentario(comentario.id)}
                        disabled={!comentarioEditado.trim()}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {comentario.comentario}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ComentariosSectionNoticia;

