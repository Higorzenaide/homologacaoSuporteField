import React, { useState, useEffect } from 'react';
import { criarQuestionario, atualizarQuestionario, validarQuestionario } from '../services/questionariosService';

const QuestionarioModal = ({ 
  isOpen, 
  onClose, 
  treinamentoId, 
  questionarioExistente = null,
  onSave 
}) => {
  const [questionario, setQuestionario] = useState({
    titulo: '',
    descricao: '',
    obrigatorio: true,
    perguntas: []
  });

  const [novaPergunta, setNovaPergunta] = useState({
    pergunta: '',
    tipo_resposta: 'unica',
    opcoes_resposta: ['', ''],
    resposta_correta: '',
    pontuacao: 1,
    obrigatoria: true
  });

  const [editandoPergunta, setEditandoPergunta] = useState(null);
  const [erros, setErros] = useState([]);
  const [salvando, setSalvando] = useState(false);

  // Carregar dados do questionário existente se estiver editando
  useEffect(() => {
    if (questionarioExistente) {
      setQuestionario({
        titulo: questionarioExistente.titulo || '',
        descricao: questionarioExistente.descricao || '',
        obrigatorio: questionarioExistente.obrigatorio !== false,
        perguntas: questionarioExistente.perguntas_questionarios?.map(p => ({
          pergunta: p.pergunta,
          tipo_resposta: p.tipo_resposta,
          opcoes_resposta: p.opcoes_resposta ? JSON.parse(p.opcoes_resposta) : [],
          resposta_correta: p.resposta_correta ? JSON.parse(p.resposta_correta) : '',
          pontuacao: p.pontuacao || 1,
          obrigatoria: p.obrigatoria !== false
        })) || []
      });
    } else {
      // Reset para novo questionário
      setQuestionario({
        titulo: '',
        descricao: '',
        obrigatorio: true,
        perguntas: []
      });
    }
    
    setErros([]);
    setEditandoPergunta(null);
  }, [questionarioExistente, isOpen]);

  const handleInputChange = (campo, valor) => {
    setQuestionario(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handlePerguntaChange = (campo, valor) => {
    setNovaPergunta(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const adicionarOpcao = () => {
    setNovaPergunta(prev => ({
      ...prev,
      opcoes_resposta: [...prev.opcoes_resposta, '']
    }));
  };

  const removerOpcao = (index) => {
    if (novaPergunta.opcoes_resposta.length > 2) {
      setNovaPergunta(prev => ({
        ...prev,
        opcoes_resposta: prev.opcoes_resposta.filter((_, i) => i !== index)
      }));
    }
  };

  const atualizarOpcao = (index, valor) => {
    setNovaPergunta(prev => ({
      ...prev,
      opcoes_resposta: prev.opcoes_resposta.map((opcao, i) => 
        i === index ? valor : opcao
      )
    }));
  };

  const adicionarPergunta = () => {
    // Validar pergunta
    const perguntaLimpa = {
      ...novaPergunta,
      opcoes_resposta: novaPergunta.tipo_resposta === 'texto' 
        ? [] 
        : novaPergunta.opcoes_resposta.filter(o => o.trim() !== '')
    };

    if (perguntaLimpa.pergunta.trim() === '') {
      alert('Por favor, digite o texto da pergunta.');
      return;
    }

    if ((perguntaLimpa.tipo_resposta === 'unica' || perguntaLimpa.tipo_resposta === 'multipla') && 
        perguntaLimpa.opcoes_resposta.length < 2) {
      alert('Perguntas de múltipla escolha devem ter pelo menos 2 opções.');
      return;
    }

    if ((perguntaLimpa.tipo_resposta === 'unica' || perguntaLimpa.tipo_resposta === 'multipla') && 
        !perguntaLimpa.resposta_correta) {
      alert('Por favor, defina a resposta correta.');
      return;
    }

    if (editandoPergunta !== null) {
      // Editando pergunta existente
      setQuestionario(prev => ({
        ...prev,
        perguntas: prev.perguntas.map((p, index) => 
          index === editandoPergunta ? perguntaLimpa : p
        )
      }));
      setEditandoPergunta(null);
    } else {
      // Adicionando nova pergunta
      setQuestionario(prev => ({
        ...prev,
        perguntas: [...prev.perguntas, perguntaLimpa]
      }));
    }

    // Reset da nova pergunta
    setNovaPergunta({
      pergunta: '',
      tipo_resposta: 'unica',
      opcoes_resposta: ['', ''],
      resposta_correta: '',
      pontuacao: 1,
      obrigatoria: true
    });
  };

  const editarPergunta = (index) => {
    const pergunta = questionario.perguntas[index];
    setNovaPergunta({
      ...pergunta,
      opcoes_resposta: pergunta.opcoes_resposta.length > 0 ? pergunta.opcoes_resposta : ['', '']
    });
    setEditandoPergunta(index);
  };

  const removerPergunta = (index) => {
    setQuestionario(prev => ({
      ...prev,
      perguntas: prev.perguntas.filter((_, i) => i !== index)
    }));
  };

  const moverPergunta = (index, direcao) => {
    const novoIndex = direcao === 'up' ? index - 1 : index + 1;
    if (novoIndex < 0 || novoIndex >= questionario.perguntas.length) return;

    setQuestionario(prev => {
      const novasPerguntas = [...prev.perguntas];
      [novasPerguntas[index], novasPerguntas[novoIndex]] = [novasPerguntas[novoIndex], novasPerguntas[index]];
      return { ...prev, perguntas: novasPerguntas };
    });
  };

  const cancelarEdicao = () => {
    setEditandoPergunta(null);
    setNovaPergunta({
      pergunta: '',
      tipo_resposta: 'unica',
      opcoes_resposta: ['', ''],
      resposta_correta: '',
      pontuacao: 1,
      obrigatoria: true
    });
  };

  const salvarQuestionario = async () => {
    // Validar questionário
    const validacao = validarQuestionario(questionario);
    if (!validacao.valido) {
      setErros(validacao.erros);
      return;
    }

    setSalvando(true);
    setErros([]);

    try {
      if (questionarioExistente && questionarioExistente.id) {
        // Se está editando um questionário existente, salvar no banco
        console.log('🔍 Atualizando questionário existente:', questionarioExistente.id);
        const resultado = await atualizarQuestionario(questionarioExistente.id, questionario);
        if (resultado.error) {
          console.error('❌ Erro ao atualizar questionário:', resultado.error);
          throw resultado.error;
        }

        if (onSave) {
          onSave(resultado.data);
        }
      } else {
        // Se está criando um novo questionário, apenas salvar os dados localmente
        // O questionário será criado no banco quando o treinamento for salvo
        if (onSave) {
          onSave(questionario);
        }
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar questionário:', error);
      setErros(['Erro ao salvar questionário. Tente novamente.']);
    } finally {
      setSalvando(false);
    }
  };

  // Prevenir scroll da página quando modal aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tiposResposta = [
    { value: 'unica', label: 'Resposta Única' },
    { value: 'multipla', label: 'Múltipla Escolha' },
    { value: 'texto', label: 'Resposta por Texto' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white flex-shrink-0 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                {questionarioExistente ? 'Editar Questionário' : 'Criar Questionário'}
              </h2>
              <p className="text-red-100 mt-1">
                Configure as perguntas que os usuários devem responder
              </p>
            </div>
            <button
              onClick={() => {
                if (questionario.perguntas.length > 0) {
                  const confirmar = window.confirm(
                    'Você tem perguntas não salvas. Deseja realmente fechar sem salvar o questionário?'
                  );
                  if (confirmar) {
                    onClose();
                  }
                } else {
                  onClose();
                }
              }}
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Erros */}
          {erros.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-red-800">Corrija os seguintes erros:</span>
              </div>
              <ul className="list-disc list-inside text-red-700 text-sm">
                {erros.map((erro, index) => (
                  <li key={index}>{erro}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Configurações básicas do questionário */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações do Questionário</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título do Questionário *
                </label>
                <input
                  type="text"
                  value={questionario.titulo}
                  onChange={(e) => handleInputChange('titulo', e.target.value)}
                  placeholder="Ex: Avaliação de Conhecimento - Segurança"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={questionario.obrigatorio}
                    onChange={(e) => handleInputChange('obrigatorio', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Questionário Obrigatório</span>
                </label>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (opcional)
              </label>
              <textarea
                value={questionario.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Descreva o objetivo deste questionário..."
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Lista de perguntas */}
          {questionario.perguntas.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Perguntas ({questionario.perguntas.length})
              </h3>
              <div className="space-y-4">
                {questionario.perguntas.map((pergunta, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                            Pergunta {index + 1}
                          </span>
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                            {tiposResposta.find(t => t.value === pergunta.tipo_resposta)?.label}
                          </span>
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            {pergunta.pontuacao} ponto{pergunta.pontuacao > 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium">{pergunta.pergunta}</p>
                      </div>
                      <div className="flex space-x-1 ml-4">
                        {index > 0 && (
                          <button
                            onClick={() => moverPergunta(index, 'up')}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            title="Mover para cima"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                        )}
                        {index < questionario.perguntas.length - 1 && (
                          <button
                            onClick={() => moverPergunta(index, 'down')}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            title="Mover para baixo"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => editarPergunta(index)}
                          className="p-1 text-blue-600 hover:text-blue-800 rounded"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removerPergunta(index)}
                          className="p-1 text-red-600 hover:text-red-800 rounded"
                          title="Remover"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Mostrar opções para perguntas de múltipla escolha */}
                    {(pergunta.tipo_resposta === 'unica' || pergunta.tipo_resposta === 'multipla') && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Opções de resposta:</p>
                        <div className="space-y-1">
                          {pergunta.opcoes_resposta.map((opcao, opcaoIndex) => {
                            const isCorreta = pergunta.tipo_resposta === 'unica' 
                              ? pergunta.resposta_correta === opcao
                              : Array.isArray(pergunta.resposta_correta) && pergunta.resposta_correta.includes(opcao);
                            
                            return (
                              <div key={opcaoIndex} className={`flex items-center space-x-2 p-2 rounded ${isCorreta ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                                <span className="text-sm">{opcaoIndex + 1}.</span>
                                <span className="text-sm flex-1">{opcao}</span>
                                {isCorreta && (
                                  <span className="text-xs text-green-600 font-semibold">✓ Correta</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adicionar nova pergunta */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editandoPergunta !== null ? 'Editar Pergunta' : 'Adicionar Nova Pergunta'}
            </h3>

            <div className="space-y-4">
              {/* Texto da pergunta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto da Pergunta *
                </label>
                <textarea
                  value={novaPergunta.pergunta}
                  onChange={(e) => handlePerguntaChange('pergunta', e.target.value)}
                  placeholder="Digite a pergunta que deseja fazer..."
                  rows="2"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Configurações da pergunta */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Resposta
                  </label>
                  <select
                    value={novaPergunta.tipo_resposta}
                    onChange={(e) => handlePerguntaChange('tipo_resposta', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {tiposResposta.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pontuação
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={novaPergunta.pontuacao}
                    onChange={(e) => handlePerguntaChange('pontuacao', parseInt(e.target.value) || 1)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={novaPergunta.obrigatoria}
                      onChange={(e) => handlePerguntaChange('obrigatoria', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Obrigatória</span>
                  </label>
                </div>
              </div>

              {/* Opções de resposta (para múltipla escolha) */}
              {(novaPergunta.tipo_resposta === 'unica' || novaPergunta.tipo_resposta === 'multipla') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opções de Resposta
                  </label>
                  <div className="space-y-2">
                    {novaPergunta.opcoes_resposta.map((opcao, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-500 w-8">
                          {index + 1}.
                        </span>
                        <input
                          type="text"
                          value={opcao}
                          onChange={(e) => atualizarOpcao(index, e.target.value)}
                          placeholder={`Opção ${index + 1}`}
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {novaPergunta.opcoes_resposta.length > 2 && (
                          <button
                            onClick={() => removerOpcao(index)}
                            className="p-2 text-red-600 hover:text-red-800 rounded"
                            title="Remover opção"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={adicionarOpcao}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Adicionar Opção</span>
                  </button>

                  {/* Selecionar resposta correta */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resposta(s) Correta(s) *
                    </label>
                    {novaPergunta.tipo_resposta === 'unica' ? (
                      <select
                        value={novaPergunta.resposta_correta}
                        onChange={(e) => handlePerguntaChange('resposta_correta', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione a resposta correta</option>
                        {novaPergunta.opcoes_resposta.filter(o => o.trim()).map((opcao, index) => (
                          <option key={index} value={opcao}>
                            {opcao}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="space-y-2">
                        {novaPergunta.opcoes_resposta.filter(o => o.trim()).map((opcao, index) => (
                          <label key={index} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={Array.isArray(novaPergunta.resposta_correta) && novaPergunta.resposta_correta.includes(opcao)}
                              onChange={(e) => {
                                const respostasCorretas = Array.isArray(novaPergunta.resposta_correta) ? novaPergunta.resposta_correta : [];
                                if (e.target.checked) {
                                  handlePerguntaChange('resposta_correta', [...respostasCorretas, opcao]);
                                } else {
                                  handlePerguntaChange('resposta_correta', respostasCorretas.filter(r => r !== opcao));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">{opcao}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botões de ação da pergunta */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-blue-200">
                {editandoPergunta !== null && (
                  <button
                    onClick={cancelarEdicao}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={adicionarPergunta}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  {editandoPergunta !== null ? 'Salvar Alterações' : 'Adicionar Pergunta'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex-shrink-0 rounded-b-2xl">
          {questionario.perguntas.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 text-sm font-medium">
                  ⚠️ Não esqueça de clicar em "Salvar Questionário" antes de fechar esta janela!
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {questionario.perguntas.length} pergunta{questionario.perguntas.length !== 1 ? 's' : ''} adicionada{questionario.perguntas.length !== 1 ? 's' : ''}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  if (questionario.perguntas.length > 0) {
                    const confirmar = window.confirm(
                      'Você tem perguntas não salvas. Deseja realmente cancelar sem salvar o questionário?'
                    );
                    if (confirmar) {
                      onClose();
                    }
                  } else {
                    onClose();
                  }
                }}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarQuestionario}
                disabled={salvando || questionario.perguntas.length === 0}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {salvando && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {!salvando && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span className="font-semibold">
                  {salvando ? 'Salvando...' : (questionarioExistente ? 'Atualizar Questionário' : 'Salvar Questionário')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionarioModal;
