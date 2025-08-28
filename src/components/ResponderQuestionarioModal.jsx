import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  buscarQuestionarioPorTreinamento,
  buscarQuestionarioCompleto, 
  verificarQuestionarioRespondido, 
  iniciarSessaoQuestionario, 
  salvarResposta, 
  finalizarQuestionario 
} from '../services/questionariosService';

const ResponderQuestionarioModal = ({ 
  treinamento, 
  isOpen, 
  onClose, 
  onComplete 
}) => {
  const { user } = useAuth();
  const [questionario, setQuestionario] = useState(null);
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submetendo, setSubmetendo] = useState(false);
  const [sessaoId, setSessaoId] = useState(null);
  const [jaRespondido, setJaRespondido] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [tempoInicio, setTempoInicio] = useState(Date.now());

  // Helper para fazer parse seguro das opções de resposta
  const parseOpcoes = (opcoes_resposta) => {
    try {
      if (typeof opcoes_resposta === 'string') {
        return JSON.parse(opcoes_resposta);
      } else if (Array.isArray(opcoes_resposta)) {
        return opcoes_resposta;
      }
      return [];
    } catch (e) {
      console.error('Erro ao fazer parse das opções:', e);
      return [];
    }
  };

  useEffect(() => {
    if (isOpen && treinamento && user) {
      carregarQuestionario();
    }
  }, [isOpen, treinamento, user]);

  const carregarQuestionario = async () => {
    setLoading(true);
    setError('');

    try {
      // Verificar se já respondeu
      const { jaRespondido: respondido, data: dadosResposta } = await verificarQuestionarioRespondido(
        treinamento.id, 
        user.id
      );

      if (respondido) {
        setJaRespondido(true);
        setResultado(dadosResposta);
        setMostrarResultado(true);
        setLoading(false);
        return;
      }

      // Buscar questionário do treinamento
      const { data: questionarioData, error: questionarioError } = await buscarQuestionarioPorTreinamento(
        treinamento.id
      );

      if (questionarioError) throw questionarioError;

      if (!questionarioData) {
        setError('Questionário não encontrado para este treinamento.');
        setLoading(false);
        return;
      }

      setQuestionario(questionarioData);

      // Iniciar sessão
      const { data: sessao, error: sessaoError } = await iniciarSessaoQuestionario(
        questionarioData.id, 
        user.id
      );

      if (sessaoError) throw sessaoError;

      setSessaoId(sessao.id);
      setTempoInicio(Date.now());

    } catch (error) {
      console.error('Erro ao carregar questionário:', error);
      setError('Erro ao carregar questionário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };



  const handleRespostaChange = (perguntaId, resposta) => {
    setRespostas(prev => ({
      ...prev,
      [perguntaId]: resposta
    }));
  };

  const proximaPergunta = async () => {
    // Salvar resposta atual
    const pergunta = questionario.perguntas_questionarios[perguntaAtual];
    const resposta = respostas[pergunta.id];

    if (pergunta.obrigatoria && (!resposta || (Array.isArray(resposta) && resposta.length === 0))) {
      alert('Esta pergunta é obrigatória. Por favor, responda antes de continuar.');
      return;
    }

    if (resposta) {
      const tempoResposta = Date.now() - tempoInicio;
      await salvarResposta(questionario.id, pergunta.id, user.id, resposta, tempoResposta);
    }

    if (perguntaAtual < questionario.perguntas_questionarios.length - 1) {
      setPerguntaAtual(prev => prev + 1);
      setTempoInicio(Date.now());
    } else {
      // Finalizar questionário
      await finalizarQuestionarioCompleto();
    }
  };

  const perguntaAnterior = () => {
    if (perguntaAtual > 0) {
      setPerguntaAtual(prev => prev - 1);
    }
  };

  const finalizarQuestionarioCompleto = async () => {
    setSubmetendo(true);

    try {
      const { data: resultadoFinal, error } = await finalizarQuestionario(
        questionario.id, 
        user.id
      );

      if (error) throw error;

      setResultado(resultadoFinal);
      setMostrarResultado(true);

      if (onComplete) {
        onComplete(resultadoFinal);
      }
    } catch (error) {
      console.error('Erro ao finalizar questionário:', error);
      setError('Erro ao finalizar questionário. Tente novamente.');
    } finally {
      setSubmetendo(false);
    }
  };

  const renderPergunta = () => {
    const pergunta = questionario.perguntas_questionarios[perguntaAtual];
    const respostaAtual = respostas[pergunta.id] || '';

    return (
      <div className="space-y-6">
        {/* Progresso */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Pergunta {perguntaAtual + 1} de {questionario.perguntas_questionarios.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((perguntaAtual + 1) / questionario.perguntas_questionarios.length) * 100)}% concluído
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((perguntaAtual + 1) / questionario.perguntas_questionarios.length) * 100}%`
              }}
            ></div>
          </div>
        </div>

        {/* Pergunta */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{perguntaAtual + 1}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {pergunta.pergunta}
              </h3>
              {pergunta.obrigatoria && (
                <span className="text-red-600 text-sm">* Obrigatória</span>
              )}
              <div className="text-sm text-gray-600 mt-1">
                Pontuação: {pergunta.pontuacao} ponto{pergunta.pontuacao > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Área de resposta */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          {pergunta.tipo_resposta === 'texto' && (
            <textarea
              value={respostaAtual}
              onChange={(e) => handleRespostaChange(pergunta.id, e.target.value)}
              placeholder="Digite sua resposta..."
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={5}
            />
          )}

          {pergunta.tipo_resposta === 'unica' && (
            <div className="space-y-3">
              {parseOpcoes(pergunta.opcoes_resposta).map((opcao, index) => (
                <label key={index} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`pergunta_${pergunta.id}`}
                    value={opcao}
                    checked={respostaAtual === opcao}
                    onChange={(e) => handleRespostaChange(pergunta.id, e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-900">{opcao}</span>
                </label>
              ))}
            </div>
          )}

          {pergunta.tipo_resposta === 'multipla' && (
            <div className="space-y-3">
              {parseOpcoes(pergunta.opcoes_resposta).map((opcao, index) => (
                <label key={index} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    value={opcao}
                    checked={Array.isArray(respostaAtual) && respostaAtual.includes(opcao)}
                    onChange={(e) => {
                      const respostasAtuais = Array.isArray(respostaAtual) ? respostaAtual : [];
                      if (e.target.checked) {
                        handleRespostaChange(pergunta.id, [...respostasAtuais, opcao]);
                      } else {
                        handleRespostaChange(pergunta.id, respostasAtuais.filter(r => r !== opcao));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-900">{opcao}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Botões de navegação */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            onClick={perguntaAnterior}
            disabled={perguntaAtual === 0}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Anterior
          </button>
          <button
            onClick={proximaPergunta}
            disabled={submetendo}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {submetendo && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>
              {perguntaAtual < questionario.perguntas_questionarios.length - 1 
                ? 'Próxima →' 
                : 'Finalizar'
              }
            </span>
          </button>
        </div>
      </div>
    );
  };

  const renderResultado = () => {
    const percentual = resultado?.percentual_acerto || 0;
    const acertou = percentual >= 70; // 70% como nota mínima

    return (
      <div className="text-center space-y-6">
        {/* Ícone de resultado */}
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
          acertou ? 'bg-green-100' : 'bg-yellow-100'
        }`}>
          {acertou ? (
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Título */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {jaRespondido ? 'Questionário já Respondido' : 'Questionário Concluído!'}
          </h2>
          <p className="text-gray-600">
            {acertou 
              ? 'Parabéns! Você demonstrou bom conhecimento sobre o treinamento.'
              : 'Você completou o questionário. Recomendamos revisar o material do treinamento.'
            }
          </p>
        </div>

        {/* Estatísticas */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {resultado?.pontuacao_total || 0}
              </div>
              <div className="text-sm text-gray-600">Pontos Obtidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {resultado?.pontuacao_maxima || 0}
              </div>
              <div className="text-sm text-gray-600">Pontos Possíveis</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${acertou ? 'text-green-600' : 'text-yellow-600'}`}>
                {percentual.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Aproveitamento</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${acertou ? 'text-green-600' : 'text-yellow-600'}`}>
                {acertou ? 'APROVADO' : 'REVISAR'}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>
        </div>

        {/* Botão para fechar */}
        <button
          onClick={onClose}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          Continuar para o Treinamento
        </button>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                {jaRespondido ? 'Resultado do Questionário' : 'Questionário Obrigatório'}
              </h1>
              <p className="text-blue-100 mt-1">
                {treinamento?.titulo}
              </p>
            </div>
            {/* Não permitir fechar se não for obrigatório ou não tiver respondido */}
            {(jaRespondido || mostrarResultado) && (
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 max-h-[calc(95vh-120px)] overflow-y-auto">
          {loading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando questionário...</p>
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
                onClick={carregarQuestionario}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {!loading && !error && (mostrarResultado || jaRespondido) && renderResultado()}

          {!loading && !error && !mostrarResultado && questionario && !jaRespondido && (
            <>
              {/* Aviso de questionário obrigatório */}
              {questionario.obrigatorio && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-yellow-800 font-medium">
                      Este questionário é obrigatório e deve ser respondido antes de acessar o treinamento.
                    </p>
                  </div>
                </div>
              )}

              {/* Informações do questionário */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {questionario.titulo}
                </h2>
                {questionario.descricao && (
                  <p className="text-gray-600 mb-4">{questionario.descricao}</p>
                )}
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{questionario.perguntas_questionarios?.length || 0} perguntas</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Tempo estimado: {Math.ceil((questionario.perguntas_questionarios?.length || 0) * 1.5)} min</span>
                  </div>
                </div>
              </div>

              {/* Renderizar pergunta atual */}
              {renderPergunta()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResponderQuestionarioModal;
