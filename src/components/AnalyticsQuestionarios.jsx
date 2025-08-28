import React, { useState, useEffect } from 'react';
import { 
  buscarTodosQuestionarios, 
  buscarPerformanceUsuarios, 
  buscarRelatorioPorPergunta,
  exportarDadosQuestionario 
} from '../services/questionariosService';

const AnalyticsQuestionarios = ({ isOpen, onClose }) => {
  const [questionarios, setQuestionarios] = useState([]);
  const [questionarioSelecionado, setQuestionarioSelecionado] = useState(null);
  const [performanceUsuarios, setPerformanceUsuarios] = useState([]);
  const [relatorioPorPergunta, setRelatorioPorPergunta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aba, setAba] = useState('visao-geral');

  useEffect(() => {
    if (isOpen) {
      carregarQuestionarios();
    }
  }, [isOpen]);

  useEffect(() => {
    if (questionarioSelecionado) {
      carregarDadosQuestionario(questionarioSelecionado.questionario_id);
    }
  }, [questionarioSelecionado]);

  const carregarQuestionarios = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: questionariosError } = await buscarTodosQuestionarios();
      if (questionariosError) throw questionariosError;

      setQuestionarios(data || []);

      // Selecionar o primeiro questionário por padrão
      if (data && data.length > 0) {
        setQuestionarioSelecionado(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar questionários:', error);
      setError('Erro ao carregar dados dos questionários');
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosQuestionario = async (questionarioId) => {
    try {
      const [performanceResult, relatorioResult] = await Promise.all([
        buscarPerformanceUsuarios(questionarioId),
        buscarRelatorioPorPergunta(questionarioId)
      ]);

      if (performanceResult.error) throw performanceResult.error;
      if (relatorioResult.error) throw relatorioResult.error;

      setPerformanceUsuarios(performanceResult.data || []);
      setRelatorioPorPergunta(relatorioResult.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados do questionário:', error);
      setError('Erro ao carregar dados detalhados');
    }
  };

  const exportarRelatorio = async () => {
    if (!questionarioSelecionado) return;

    try {
      const { data, error } = await exportarDadosQuestionario(questionarioSelecionado.questionario_id);
      if (error) throw error;

      // Converter dados para CSV e fazer download
      const csvContent = gerarCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_questionario_${questionarioSelecionado.questionario_titulo}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório');
    }
  };

  const gerarCSV = (dados) => {
    const headers = ['Usuario', 'Email', 'Data_Conclusao', 'Pontuacao_Total', 'Pontuacao_Maxima', 'Percentual_Acerto', 'Status'];
    const rows = dados.performance_usuarios.map(p => [
      p.usuario_nome,
      p.usuario_email,
      p.data_conclusao ? new Date(p.data_conclusao).toLocaleDateString('pt-BR') : '',
      p.pontuacao_total || 0,
      p.pontuacao_maxima || 0,
      p.percentual_acerto ? p.percentual_acerto.toFixed(2) + '%' : '0%',
      p.status
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const renderVisaoGeral = () => (
    <div className="space-y-6">
      {/* Cards de estatísticas globais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-700 mb-1">
            {questionarios.length}
          </div>
          <div className="text-sm font-semibold text-blue-600">
            Questionários Ativos
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-700 mb-1">
            {questionarios.reduce((sum, q) => sum + (q.total_usuarios_responderam || 0), 0)}
          </div>
          <div className="text-sm font-semibold text-green-600">
            Usuários Participaram
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-700 mb-1">
            {questionarios.length > 0 
              ? (questionarios.reduce((sum, q) => sum + (q.media_acertos || 0), 0) / questionarios.length).toFixed(1)
              : 0
            }%
          </div>
          <div className="text-sm font-semibold text-purple-600">
            Média de Acertos
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-orange-700 mb-1">
            {questionarios.length > 0 
              ? (questionarios.reduce((sum, q) => sum + (q.taxa_conclusao || 0), 0) / questionarios.length).toFixed(1)
              : 0
            }%
          </div>
          <div className="text-sm font-semibold text-orange-600">
            Taxa de Conclusão
          </div>
        </div>
      </div>

      {/* Lista de questionários */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Questionários por Treinamento</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Treinamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questionário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Respondidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Concluídos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Média
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {questionarios.map((questionario) => (
                <tr 
                  key={questionario.questionario_id}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    questionarioSelecionado?.questionario_id === questionario.questionario_id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setQuestionarioSelecionado(questionario)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {questionario.treinamento_titulo}
                      </div>
                      <div className="text-sm text-gray-500">
                        {questionario.categoria}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {questionario.questionario_titulo}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {questionario.total_usuarios_responderam || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {questionario.usuarios_concluiram || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      (questionario.media_acertos || 0) >= 70 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {(questionario.media_acertos || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuestionarioSelecionado(questionario);
                        setAba('detalhes');
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDetalhes = () => {
    if (!questionarioSelecionado) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Selecione um questionário para ver os detalhes</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header do questionário selecionado */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {questionarioSelecionado.questionario_titulo}
              </h3>
              <p className="text-gray-600">
                Treinamento: {questionarioSelecionado.treinamento_titulo}
              </p>
            </div>
            <button
              onClick={exportarRelatorio}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Exportar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {questionarioSelecionado.total_usuarios_responderam || 0}
              </div>
              <div className="text-sm text-gray-600">Responderam</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {questionarioSelecionado.usuarios_concluiram || 0}
              </div>
              <div className="text-sm text-gray-600">Concluíram</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(questionarioSelecionado.media_acertos || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Média de Acertos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(questionarioSelecionado.taxa_conclusao || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Taxa de Conclusão</div>
            </div>
          </div>
        </div>

        {/* Performance dos usuários */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Performance dos Usuários</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Conclusão
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pontuação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aproveitamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {performanceUsuarios.map((usuario, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {usuario.usuario_nome}
                        </div>
                        <div className="text-sm text-gray-500">
                          {usuario.usuario_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {usuario.data_conclusao 
                        ? new Date(usuario.data_conclusao).toLocaleDateString('pt-BR') 
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {usuario.pontuacao_total || 0} / {usuario.pontuacao_maxima || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        (usuario.percentual_acerto || 0) >= 70 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(usuario.percentual_acerto || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        usuario.status === 'concluido' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {usuario.status === 'concluido' ? 'Concluído' : 'Em Progresso'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Análise por pergunta */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Análise por Pergunta</h4>
          </div>
          <div className="p-6 space-y-6">
            {relatorioPorPergunta.map((pergunta, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">
                    Pergunta {index + 1}: {pergunta.pergunta}
                  </h5>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    pergunta.percentual_acerto >= 70 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {pergunta.percentual_acerto}% acertos
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total de Respostas:</span>
                    <div className="font-semibold">{pergunta.total_respostas}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Respostas Corretas:</span>
                    <div className="font-semibold text-green-600">{pergunta.respostas_corretas}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Pontuação Máxima:</span>
                    <div className="font-semibold">{pergunta.pontuacao_maxima}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Média de Pontos:</span>
                    <div className="font-semibold">{pergunta.media_pontos.toFixed(1)}</div>
                  </div>
                </div>

                {/* Barra de progresso visual */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        pergunta.percentual_acerto >= 70 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${pergunta.percentual_acerto}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Analytics de Questionários</h1>
              <p className="text-indigo-100 mt-1">
                Análise completa da performance dos questionários de treinamento
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navegação */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setAba('visao-geral')}
              className={`py-4 px-4 border-b-3 font-semibold text-base transition-all duration-300 ${
                aba === 'visao-geral'
                  ? 'border-indigo-500 text-indigo-600 bg-white rounded-t-xl -mb-px'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setAba('detalhes')}
              className={`py-4 px-4 border-b-3 font-semibold text-base transition-all duration-300 ${
                aba === 'detalhes'
                  ? 'border-indigo-500 text-indigo-600 bg-white rounded-t-xl -mb-px'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Detalhes por Questionário
            </button>
          </nav>
        </div>

        {/* Conteúdo */}
        <div className="p-6 max-h-[calc(95vh-200px)] overflow-y-auto">
          {loading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando analytics...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Erro</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={carregarQuestionarios}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {aba === 'visao-geral' && renderVisaoGeral()}
              {aba === 'detalhes' && renderDetalhes()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsQuestionarios;
