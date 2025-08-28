import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTreinamentosComEstatisticas } from '../services/interacaoService';
import { getTreinamentos, deleteTreinamento } from '../services/treinamentosService';
import { criarQuestionario } from '../services/questionariosService';
import { getCategoriasAtivas } from '../services/categoriasTreinamentosService';
import AdminModal from '../components/AdminModal';
import TreinamentoCardAdvanced from '../components/TreinamentoCardAdvanced';
import TreinamentoModal from '../components/TreinamentoModal';
import ResponderQuestionarioModal from '../components/ResponderQuestionarioModal';
import GerenciadorCategorias from '../components/GerenciadorCategorias';
import GerenciadorCategoriasFeedback from '../components/GerenciadorCategoriasFeedback';
import AnalyticsQuestionarios from '../components/AnalyticsQuestionarios';
import AnimatedBackground from '../components/AnimatedBackground';
import { FullPageLoader, InlineLoader } from '../components/LoadingSpinner';

import ConfirmModal from '../components/ConfirmModal';

const Treinamentos = () => {
  const { isAdmin } = useAuth();
  const [treinamentos, setTreinamentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busca, setBusca] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showTreinamentoModal, setShowTreinamentoModal] = useState(false);
  const [selectedTreinamento, setSelectedTreinamento] = useState(null);
  const [showGerenciadorCategorias, setShowGerenciadorCategorias] = useState(false);
  const [showGerenciadorCategoriasFeedback, setShowGerenciadorCategoriasFeedback] = useState(false);
  const [showAnalyticsQuestionarios, setShowAnalyticsQuestionarios] = useState(false);
  const [showQuestionarioModal, setShowQuestionarioModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  // Timer para o modal de sucesso
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 10000); // 10 segundos

      return () => clearTimeout(timer);
    }
  }, [success]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [treinamentosResult, categoriasResult] = await Promise.all([
        getTreinamentos(),
        getCategoriasAtivas()
      ]);

      // Processar resultado dos treinamentos
      const treinamentosData = treinamentosResult?.data || treinamentosResult || [];
      const categoriasData = categoriasResult || [];

      setTreinamentos(treinamentosData);
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPDF = async (treinamento) => {
    console.log('🔍 handleViewPDF do card - Verificação em tempo real');

    // Verificar se há dados suficientes
    if (!treinamento?.id || !user?.id) {
      console.log('❌ Dados insuficientes para verificação');
      if (treinamento.arquivo_url) {
        window.open(treinamento.arquivo_url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    try {
      // Incrementar contador de visualizações
      const { incrementVisualizacoes } = await import('../services/treinamentosService');
      await incrementVisualizacoes(treinamento.id);
      
      // Atualizar o estado local para refletir a mudança imediatamente
      setTreinamentos(prev => 
        prev.map(t => 
          t.id === treinamento.id 
            ? { ...t, visualizacoes: (t.visualizacoes || 0) + 1 }
            : t
        )
      );

      // Verificar em tempo real se tem questionário
      console.log('🔍 Verificando questionário em tempo real...');
      const { verificarSeTemQuestionario, verificarQuestionarioRespondido } = await import('../services/questionariosService');
      
      const verificacaoQuestionario = await verificarSeTemQuestionario(treinamento.id);
      console.log('🔍 Resultado verificação em tempo real:', verificacaoQuestionario);

      // SEMPRE abrir o PDF em nova aba primeiro
      console.log('🎯 Abrindo PDF em nova aba');
      if (treinamento.arquivo_url) {
        window.open(treinamento.arquivo_url, '_blank', 'noopener,noreferrer');
      }

      // Se tem questionário obrigatório e não respondeu, abrir modal também
      if (verificacaoQuestionario.temQuestionario && verificacaoQuestionario.obrigatorio) {
        console.log('🔍 Verificando se já respondeu...');
        const verificacaoResposta = await verificarQuestionarioRespondido(treinamento.id, user.id);
        console.log('🔍 Resultado verificação resposta:', verificacaoResposta);

        if (!verificacaoResposta.jaRespondido) {
          console.log('🎯 ABRINDO QUESTIONÁRIO DO CARD - não respondeu ainda');
          // Definir o treinamento e abrir modal
          setSelectedTreinamento(treinamento);
          setShowQuestionarioModal(true);
        } else {
          console.log('ℹ️ Usuário já respondeu o questionário');
        }
      }
    } catch (error) {
      console.error('❌ Erro na verificação:', error);
      // Em caso de erro, abrir o PDF mesmo assim
      if (treinamento.arquivo_url) {
        window.open(treinamento.arquivo_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleOpenComments = (treinamento) => {
    setSelectedTreinamento(treinamento);
    setShowTreinamentoModal(true);
  };

  const handleSave = async (formData, file, questionarioData = null) => {
    try {
      const { createTreinamento, editTreinamento } = await import('../services/treinamentosService');
      
      let treinamentoResult;
      
      if (editingItem) {
        treinamentoResult = await editTreinamento(editingItem.id, formData, file);
        setSuccess('Treinamento editado com sucesso!');
      } else {
        treinamentoResult = await createTreinamento(formData, file);
        setSuccess('Treinamento criado com sucesso!');
      }
      
      // Se foi criado/editado um questionário, criar ele agora
      if (questionarioData && treinamentoResult.data) {
        console.log('🔍 Dados do questionário:', questionarioData);
        console.log('🔍 ID do treinamento:', treinamentoResult.data.id);
        
        try {
          const questionarioResult = await criarQuestionario(treinamentoResult.data.id, questionarioData);
          console.log('🔍 Resultado do questionário:', questionarioResult);
          
          if (questionarioResult.error) {
            console.error('❌ Erro ao criar questionário:', questionarioResult.error);
            setError('Treinamento salvo, mas houve erro ao criar o questionário: ' + JSON.stringify(questionarioResult.error));
          } else {
            console.log('✅ Questionário criado com sucesso!');
            setSuccess(prev => prev + ' Questionário criado com sucesso!');
          }
        } catch (questionarioError) {
          console.error('❌ Erro ao criar questionário (catch):', questionarioError);
          setError('Treinamento salvo, mas houve erro ao criar o questionário: ' + questionarioError.message);
        }
      } else {
        console.log('🔍 Sem dados de questionário para criar', { questionarioData, treinamentoResult: treinamentoResult?.data });
      }
      
      // Fechar modal e limpar estado de edição
      setShowModal(false);
      setEditingItem(null);
      
      // Recarregar dados
      await carregarDados();
      return true;
    } catch (error) {
      console.error('Erro ao salvar treinamento:', error);
      setError('Erro ao salvar treinamento');
      return false;
    }
  };

  const handleEdit = (treinamento) => {
    setEditingItem(treinamento);
    setShowModal(true);
  };

  const handleDelete = async (treinamento) => {
    try {
      await deleteTreinamento(treinamento.id);
      setSuccess('Treinamento excluído com sucesso!');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir treinamento:', error);
      setError('Erro ao excluir treinamento');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setError('');
    setSuccess('');
  };

  const treinamentosFiltrados = treinamentos.filter(treinamento => {
    console.log('Debug filtro - Treinamento:', treinamento.titulo, 'Categoria:', treinamento.categoria, 'Filtro:', filtroCategoria);
    
    // Filtro por categoria - comparação mais flexível
    const matchCategoria = !filtroCategoria || 
      treinamento.categoria === filtroCategoria ||
      treinamento.categoria?.toLowerCase() === filtroCategoria.toLowerCase() ||
      treinamento.tipo === filtroCategoria ||
      treinamento.tipo?.toLowerCase() === filtroCategoria.toLowerCase();
    
    const matchBusca = !busca || 
      treinamento.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      treinamento.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
      treinamento.tags?.some(tag => tag.toLowerCase().includes(busca.toLowerCase()));
    
    console.log('Debug filtro - Match categoria:', matchCategoria, 'Match busca:', matchBusca);
    return matchCategoria && matchBusca;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex justify-center items-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-200 border-t-red-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-red-100 animate-pulse mx-auto"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Carregando Treinamentos</h3>
          <p className="text-gray-600">Preparando o melhor conteúdo para você...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header da Página com Design Sofisticado */}
      <div className="relative bg-white shadow-lg border-b border-gray-200 overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-orange-50 opacity-50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-100 to-orange-100 rounded-full -mr-48 -mt-48 opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full -ml-32 -mb-32 opacity-30"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-8 lg:mb-0">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                    Treinamentos
                  </h1>
                  <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
                </div>
              </div>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mb-4">
                Explore nosso repositório completo de materiais de treinamento, recursos educacionais e conteúdos especializados
              </p>
              
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">
                    {treinamentos.length} {treinamentos.length === 1 ? 'treinamento disponível' : 'treinamentos disponíveis'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Atualizado em tempo real</span>
                </div>
              </div>
            </div>
            
            {isAdmin && (
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowGerenciadorCategorias(true)}
                  className="group relative bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold flex items-center space-x-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="relative z-10">Gerenciar Categorias</span>
                </button>
                
                <button
                  onClick={() => setShowGerenciadorCategoriasFeedback(true)}
                  className="group relative bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 font-semibold flex items-center space-x-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="relative z-10">Categorias Feedback</span>
                </button>

                <button
                  onClick={() => setShowAnalyticsQuestionarios(true)}
                  className="group relative bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-4 rounded-2xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 font-semibold flex items-center space-x-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="relative z-10">Analytics Questionários</span>
                </button>
                
                <button
                  onClick={() => setShowModal(true)}
                  className="group relative bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-semibold flex items-center space-x-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="relative z-10">Novo Treinamento</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Mensagens de Erro e Sucesso */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-2xl shadow-sm">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-8 p-6 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-2xl shadow-sm">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Filtros Modernos e Sofisticados */}
        <div className="mb-10 bg-white rounded-2xl shadow-lg border border-gray-200 p-8 backdrop-blur-sm">
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Buscar treinamentos
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-6 w-6 text-gray-400 group-focus-within:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nome, descrição ou tags..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-lg placeholder-gray-400"
                />
              </div>
            </div>
            
            <div className="xl:w-80">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Filtrar por categoria
              </label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="block w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white text-lg"
              >
                <option value="">Todas as categorias</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.nome}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Estatísticas dos Filtros */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">
                    Mostrando {treinamentosFiltrados.length} de {treinamentos.length} treinamentos
                  </span>
                </div>
                {(busca || filtroCategoria) && (
                  <button
                    onClick={() => {
                      setBusca('');
                      setFiltroCategoria('');
                    }}
                    className="text-red-600 hover:text-red-700 font-medium flex items-center space-x-1 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Limpar filtros</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Treinamentos com Animações */}
        {treinamentosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Nenhum treinamento encontrado</h3>
            <p className="text-gray-600 mb-6">
              {busca || filtroCategoria 
                ? 'Tente ajustar os filtros para encontrar o que procura'
                : 'Ainda não há treinamentos disponíveis'
              }
            </p>
            {isAdmin && !busca && !filtroCategoria && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium"
              >
                Adicionar Primeiro Treinamento
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {treinamentosFiltrados.map((treinamento, index) => (
              <div
                key={treinamento.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TreinamentoCardAdvanced
                  treinamento={treinamento}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewPDF={handleViewPDF}
                  onOpenComments={handleOpenComments}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modais */}
      {showModal && (
        <AdminModal
          isOpen={showModal}
          onClose={handleCloseModal}
          type="treinamento"
          onSave={handleSave}
          editingItem={editingItem}
          categorias={categorias}
        />
      )}



      {showTreinamentoModal && (
        <TreinamentoModal
          treinamento={selectedTreinamento}
          isOpen={showTreinamentoModal}
          onClose={() => setShowTreinamentoModal(false)}
        />
      )}

      {showGerenciadorCategorias && (
        <GerenciadorCategorias
          isOpen={showGerenciadorCategorias}
          onClose={() => {
            setShowGerenciadorCategorias(false);
            carregarDados(); // Recarregar dados após fechar o gerenciador
          }}
        />
      )}

      {showGerenciadorCategoriasFeedback && (
        <GerenciadorCategoriasFeedback
          isOpen={showGerenciadorCategoriasFeedback}
          onClose={() => {
            setShowGerenciadorCategoriasFeedback(false);
          }}
        />
      )}

      {showQuestionarioModal && selectedTreinamento && (
        <ResponderQuestionarioModal
          treinamento={selectedTreinamento}
          isOpen={showQuestionarioModal}
          onClose={() => {
            setShowQuestionarioModal(false);
            setSelectedTreinamento(null);
          }}
          onComplete={(resultado) => {
            console.log('✅ Questionário concluído do card!', resultado);
            setShowQuestionarioModal(false);
            setSelectedTreinamento(null);
          }}
        />
      )}

      {showAnalyticsQuestionarios && (
        <AnalyticsQuestionarios
          isOpen={showAnalyticsQuestionarios}
          onClose={() => setShowAnalyticsQuestionarios(false)}
        />
      )}

      {/* CSS para animações */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default Treinamentos;

