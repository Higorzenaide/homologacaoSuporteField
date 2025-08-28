import React, { useState, useEffect } from 'react';
import ComentariosSection from './ComentariosSection';
import CurtidasButton from './CurtidasButton';

import ResponderQuestionarioModal from './ResponderQuestionarioModal';
import { contarComentarios } from '../services/comentariosService';
import { contarCurtidas } from '../services/curtidasService';
import { verificarSeTemQuestionario, verificarQuestionarioRespondido } from '../services/questionariosService';
import { useAuth } from '../contexts/AuthContext';

const TreinamentoModal = ({ treinamento, isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('detalhes');
  const [totalComentarios, setTotalComentarios] = useState(0);
  const [totalCurtidas, setTotalCurtidas] = useState(0);
  const [showQuestionarioModal, setShowQuestionarioModal] = useState(false);
  const [temQuestionario, setTemQuestionario] = useState(false);
  const [questionarioObrigatorio, setQuestionarioObrigatorio] = useState(false);
  const [jaRespondeuQuestionario, setJaRespondeuQuestionario] = useState(false);

  // Carregar contadores quando o modal abrir
  useEffect(() => {
    const carregarContadores = async () => {
      if (isOpen && treinamento?.id && user) {
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

          // Verificar se tem questionário
          console.log('🔍 Verificando questionário para treinamento:', treinamento.id);
          const { temQuestionario: hasQuestionario, obrigatorio } = await verificarSeTemQuestionario(treinamento.id);
          console.log('🔍 Resultado verificação:', { hasQuestionario, obrigatorio });
          setTemQuestionario(hasQuestionario);
          setQuestionarioObrigatorio(obrigatorio);

          // Se tem questionário, verificar se já respondeu
          if (hasQuestionario) {
            console.log('🔍 Verificando se usuário já respondeu questionário');
            const { jaRespondido } = await verificarQuestionarioRespondido(treinamento.id, user.id);
            console.log('🔍 Já respondeu:', jaRespondido);
            setJaRespondeuQuestionario(jaRespondido);
          }
        } catch (error) {
          console.error('Erro ao carregar contadores:', error);
          setTotalComentarios(0);
          setTotalCurtidas(0);
        }
      }
    };

    carregarContadores();
  }, [isOpen, treinamento?.id, user]);

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
    console.log('🔍 handleViewPDF - Estado atual:', {
      temQuestionario,
      questionarioObrigatorio,
      jaRespondeuQuestionario,
      arquivo_url: treinamento.arquivo_url
    });

    // Se tem questionário obrigatório e não respondeu, mostrar questionário primeiro
    if (temQuestionario && questionarioObrigatorio && !jaRespondeuQuestionario) {
      console.log('🎯 Abrindo modal do questionário');
      setShowQuestionarioModal(true);
      return;
    }
    
    console.log('🎯 Abrindo PDF em nova aba');
    // Apenas abrir em nova aba, sem visualizador interno
    if (treinamento.arquivo_url) {
      window.open(treinamento.arquivo_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleQuestionarioComplete = (resultado) => {
    setJaRespondeuQuestionario(true);
    setShowQuestionarioModal(false);
    // Após completar o questionário, abrir o PDF apenas em nova aba
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
      'Outros': 'from-indigo-500 to-indigo-600',
      'Ticket': 'from-cyan-500 to-cyan-600',
      'default': 'from-gray-700 to-gray-800'
    };
    return colors[categoria] || colors.default;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-gray-100 transform transition-all duration-300">
          {/* Header Corporativo Melhorado */}
          <div className={`relative bg-gradient-to-br ${getCategoriaColor(treinamento.categoria)} p-8 text-white overflow-hidden`}>
            {/* Padrões geométricos de fundo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
              <div className="absolute top-12 right-12 w-24 h-24 bg-white rounded-full opacity-60"></div>
              <div className="absolute top-20 right-32 w-12 h-12 bg-white rounded-full opacity-40"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
              <div className="absolute bottom-8 left-8 w-16 h-16 bg-white rounded-full opacity-50"></div>
              <div className="absolute bottom-16 left-24 w-8 h-8 bg-white rounded-full opacity-30"></div>
            </div>

            {/* Gradiente overlay para melhor legibilidade */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/20"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-start space-x-6 flex-1 pr-4">
                  {/* Logo do treinamento melhorado */}
                  <div className="flex-shrink-0">
                    {treinamento.logo_url ? (
                      <div className="w-24 h-24 bg-white/20 rounded-2xl p-4 backdrop-blur-sm border border-white/30 shadow-lg">
                        <img 
                          src={treinamento.logo_url} 
                          alt="Logo do treinamento"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg">
                        <svg className="w-12 h-12 text-white/90" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Badges melhorados */}
                    <div className="flex items-center flex-wrap gap-3 mb-4">
                      <span className="bg-white/20 text-white text-sm px-4 py-2 rounded-full font-semibold backdrop-blur-sm border border-white/30 uppercase tracking-wide">
                        {treinamento.tipo || 'PDF'}
                      </span>
                      {treinamento.categoria && (
                        <span className="bg-white/20 text-white text-sm px-4 py-2 rounded-full font-semibold backdrop-blur-sm border border-white/30">
                          {treinamento.categoria}
                        </span>
                      )}
                    </div>
                    
                    {/* Título melhorado */}
                    <h2 className="text-4xl font-bold leading-tight mb-4 text-white drop-shadow-sm">
                      {treinamento.titulo}
                    </h2>
                    
                    {/* Informações básicas em grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white/90">
                      <div className="flex items-center space-x-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{formatarData(treinamento.created_at)}</div>
                          <div className="text-xs text-white/70">Data de criação</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold">
                            {treinamento.arquivo_tamanho 
                              ? `${(treinamento.arquivo_tamanho / (1024 * 1024)).toFixed(1)} MB`
                              : '1.3 MB'
                            }
                          </div>
                          <div className="text-xs text-white/70">Tamanho do arquivo</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{treinamento.visualizacoes || 0}</div>
                          <div className="text-xs text-white/70">Visualizações</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Botão de fechar melhorado */}
                <button
                  onClick={onClose}
                  className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-all duration-300 backdrop-blur-sm border border-white/30 flex-shrink-0 group"
                >
                  <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Tabs Melhoradas */}
          <div className="border-b border-gray-200 bg-gray-50/50">
            <nav className="flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('detalhes')}
                className={`py-4 px-4 border-b-3 font-semibold text-base transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === 'detalhes'
                    ? 'border-red-500 text-red-600 bg-white rounded-t-xl -mb-px'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Detalhes</span>
              </button>
              <button
                onClick={() => setActiveTab('comentarios')}
                className={`py-4 px-4 border-b-3 font-semibold text-base transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === 'comentarios'
                    ? 'border-red-500 text-red-600 bg-white rounded-t-xl -mb-px'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Comentários</span>
                {totalComentarios > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-bold border border-red-200">
                    {totalComentarios}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Conteúdo Melhorado */}
          <div className="p-8 max-h-[60vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50/30">
            {activeTab === 'detalhes' && (
              <div className="space-y-8">
                {/* Descrição melhorada */}
                {treinamento.descricao && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Descrição</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {treinamento.descricao}
                    </p>
                  </div>
                )}
                
                {/* Tags melhoradas */}
                {(() => {
                  const tags = Array.isArray(treinamento.tags)
                    ? treinamento.tags
                    : typeof treinamento.tags === "string"
                    ? treinamento.tags.split(",").map((tag) => tag.trim())
                    : [];

                  return tags.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Tags</h3>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {tags.map((tag, index) => {
                          const colors = [
                            "bg-blue-50 text-blue-700 border-blue-200",
                            "bg-green-50 text-green-700 border-green-200",
                            "bg-purple-50 text-purple-700 border-purple-200",
                            "bg-orange-50 text-orange-700 border-orange-200",
                            "bg-pink-50 text-pink-700 border-pink-200",
                            "bg-indigo-50 text-indigo-700 border-indigo-200",
                          ];
                          const colorClass = colors[index % colors.length];
                          
                          return (
                            <span 
                              key={index}
                              className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 hover:scale-105 hover:shadow-md ${colorClass}`}
                            >
                              #{tag}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                
                {/* Estatísticas melhoradas */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Estatísticas</h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center border border-blue-200">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-blue-700 mb-1">{treinamento.visualizacoes || 0}</div>
                      <div className="text-sm font-semibold text-blue-600">Visualizações</div>
                    </div>
                    
                    
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 text-center border border-red-200">
                      <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-red-700 mb-1">{totalCurtidas}</div>
                      <div className="text-sm font-semibold text-red-600">Curtidas</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center border border-purple-200">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-purple-700 mb-1">{totalComentarios}</div>
                      <div className="text-sm font-semibold text-purple-600">Comentários</div>
                    </div>
                  </div>
                </div>

                {/* Seção do Questionário */}
                {temQuestionario && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Questionário de Avaliação</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          jaRespondeuQuestionario 
                            ? 'bg-green-100 text-green-800' 
                            : questionarioObrigatorio 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {jaRespondeuQuestionario 
                            ? '✓ Concluído' 
                            : questionarioObrigatorio 
                              ? '⚠ Obrigatório' 
                              : '📝 Opcional'
                          }
                        </span>
                      </div>
                      
                      {questionarioObrigatorio && !jaRespondeuQuestionario && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-yellow-800 text-sm">
                            <strong>Atenção:</strong> Este questionário é obrigatório e deve ser respondido antes de acessar o treinamento.
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => setShowQuestionarioModal(true)}
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${
                          jaRespondeuQuestionario
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {jaRespondeuQuestionario ? 'Ver Resultado' : 'Responder Questionário'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'comentarios' && (
              <ComentariosSection 
                treinamentoId={treinamento.id} 
                onComentarioChange={setTotalComentarios}
              />
            )}
          </div>

          {/* Footer com ações melhorado */}
          <div className="border-t border-gray-200 p-6 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CurtidasButton 
                  treinamentoId={treinamento.id} 
                  onCurtidaChange={setTotalCurtidas}
                />
                
                <button
                  onClick={() => setActiveTab('comentarios')}
                  className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-blue-50 text-blue-600 border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-300 font-semibold transform hover:scale-105"
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
                  className="flex items-center space-x-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-semibold border-2 border-gray-200 hover:border-gray-300 transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Baixar</span>
                </a>
                
                <button
                  onClick={handleViewPDF}
                  className="flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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



      {/* Questionário Modal */}
      {showQuestionarioModal && (
        <ResponderQuestionarioModal
          treinamento={treinamento}
          isOpen={showQuestionarioModal}
          onClose={() => setShowQuestionarioModal(false)}
          onComplete={handleQuestionarioComplete}
        />
      )}
    </>
  );
};

export default TreinamentoModal;