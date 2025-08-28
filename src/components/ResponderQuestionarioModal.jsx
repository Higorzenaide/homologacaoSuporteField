import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  buscarQuestionarioPorTreinamento,
  buscarQuestionarioCompleto, 
  verificarQuestionarioRespondido, 
  iniciarSessaoQuestionario, 
  salvarResposta, 
  finalizarQuestionario,
  recusarQuestionario
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
  const [modoRefazer, setModoRefazer] = useState(false);
  const [forcarQuestionario, setForcarQuestionario] = useState(false);

  // Função para fechar modal e resetar estados
  const handleCloseModal = () => {
    setForcarQuestionario(false);
    onClose();
  };

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

  // Prevenir scroll da página quando modal aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  const carregarQuestionario = async (forceModoRefazer = false) => {
    setLoading(true);
    setError('');

    try {
      // Verificar se já respondeu (mas só se não estiver no modo refazer)
      if (!forceModoRefazer && !modoRefazer) {
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
      } else {
        // Se está refazendo, resetar states
        console.log('🔄 Modo refazer ativado - iniciando novo questionário');
        setJaRespondido(false);
        setResultado(null);
        setMostrarResultado(false);
        setPerguntaAtual(0);
        setRespostas({});
        setSessaoId(null);
        setModoRefazer(false); // Resetar o flag
        console.log('🔄 Estados resetados para novo questionário');
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
      
      // Se estava no modo refazer, ativar forçar questionário agora que carregou
      if (forceModoRefazer || modoRefazer) {
        setForcarQuestionario(true);
      }

    } catch (error) {
      console.error('Erro ao carregar questionário:', error);
      setError('Erro ao carregar questionário. Tente novamente.');
    } finally {
      setLoading(false);
      // Não resetar forcarQuestionario aqui se estava em modo refazer
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

  const handleRecusarQuestionario = async () => {
    const confirmar = window.confirm(
      'Tem certeza que não deseja responder o questionário? Esta ação será registrada.'
    );
    
    if (!confirmar) return;

    setSubmetendo(true);
    try {
      const { data, error } = await recusarQuestionario(questionario.id, user.id);
      
      if (error) throw error;

      console.log('✅ Recusa registrada');
      if (onComplete) {
        onComplete({ recusou: true });
      }
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao registrar recusa:', error);
      setError('Erro ao registrar recusa. Tente novamente.');
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
              className="bg-red-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((perguntaAtual + 1) / questionario.perguntas_questionarios.length) * 100}%`
              }}
            ></div>
          </div>
        </div>

        {/* Pergunta */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
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
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
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
                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
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
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
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
            className="px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
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
    const aprovado = percentual >= 90; // 90% como nota mínima
    const tentativa = resultado?.tentativa || 1;

    return (
      <div className="text-center space-y-6">
        {/* Ícone de resultado */}
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
          aprovado ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {aprovado ? (
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        {/* Título */}
        <div>
          <h2 className={`text-2xl font-bold mb-2 ${aprovado ? 'text-green-700' : 'text-red-700'}`}>
            {aprovado ? '🎉 APROVADO!' : '❌ REPROVADO'}
          </h2>
          <p className="text-gray-600">
            {aprovado 
              ? `Parabéns! Você atingiu ${percentual.toFixed(1)}% de acertos e foi aprovado no questionário.`
              : `Você obteve ${percentual.toFixed(1)}% de acertos. É necessário 90% ou mais para aprovação.`
            }
          </p>
          {tentativa > 1 && (
            <p className="text-sm text-gray-500 mt-2">
              Tentativa #{tentativa}
            </p>
          )}
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
              <div className={`text-2xl font-bold ${aprovado ? 'text-green-600' : 'text-red-600'}`}>
                {percentual.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Aproveitamento</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${aprovado ? 'text-green-600' : 'text-red-600'}`}>
                {aprovado ? 'APROVADO' : 'REPROVADO'}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col space-y-3">
          {!aprovado && (
            <button
              onClick={() => {
                // Reset para refazer
                console.log('🔄 Iniciando refazer questionário');
                
                // Reset todos os estados
                setMostrarResultado(false);
                setJaRespondido(false);
                setPerguntaAtual(0);
                setRespostas({});
                setResultado(null);
                setTempoInicio(Date.now());
                setSessaoId(null);
                setModoRefazer(true);
                
                // Carregar questionário forçando modo refazer
                carregarQuestionario(true);
              }}
              className="px-8 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-semibold"
            >
              🔄 Refazer Questionário
            </button>
          )}
          <button
            onClick={handleCloseModal}
            className={`px-8 py-3 rounded-xl transition-colors font-semibold ${
              aprovado 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            {aprovado ? '✅ Continuar para o Treinamento' : '📖 Acessar Treinamento Mesmo Assim'}
          </button>
        </div>
      </div>
    );
  };

  console.log('🔍 ResponderQuestionarioModal - isOpen:', isOpen, 'treinamento:', treinamento?.id);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                {jaRespondido ? 'Resultado do Questionário' : 'Questionário Obrigatório'}
              </h1>
              <p className="text-red-100 mt-1">
                {treinamento?.titulo}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Botão "Não quero responder" - só aparece se não respondeu ainda */}
              {!jaRespondido && !mostrarResultado && questionario && (
                <button
                  onClick={handleRecusarQuestionario}
                  disabled={submetendo}
                  className="px-4 py-2 bg-red-500/20 text-red-100 border border-red-400 rounded-xl hover:bg-red-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submetendo ? 'Registrando...' : 'Não quero responder'}
                </button>
              )}
              
              {/* Botão fechar - só aparece se já respondeu */}
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
        </div>

        {/* Conteúdo */}
        <div className="p-6 flex-1 overflow-y-auto overscroll-contain">
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

          {!loading && !error && (mostrarResultado || jaRespondido) && !forcarQuestionario && renderResultado()}

          {!loading && !error && questionario && ((!mostrarResultado && !jaRespondido) || forcarQuestionario) && (
            <>
              {/* Indicador de modo questionário */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-800 font-medium">
                    ✅ Modo Questionário Ativo - Responda as perguntas abaixo
                  </p>
                </div>
              </div>

              {/* Aviso de questionário obrigatório */}
              {questionario?.obrigatorio && (
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
                  {questionario?.titulo || 'Questionário'}
                </h2>
                {questionario?.descricao && (
                  <p className="text-gray-600 mb-4">{questionario.descricao}</p>
                )}
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{questionario?.perguntas_questionarios?.length || 0} perguntas</span>
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
