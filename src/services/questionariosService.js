import { supabase } from '../lib/supabase';

// ========================================
// GESTÃO DE QUESTIONÁRIOS
// ========================================

/**
 * Criar um novo questionário para um treinamento
 */
export const criarQuestionario = async (treinamentoId, dadosQuestionario) => {
  try {
    const { titulo, descricao, obrigatorio = true, perguntas = [] } = dadosQuestionario;

    // Criar o questionário
    const { data: questionario, error: questionarioError } = await supabase
      .from('questionarios_treinamentos')
      .insert([{
        treinamento_id: treinamentoId,
        titulo,
        descricao,
        obrigatorio,
        ativo: true
      }])
      .select()
      .single();

    if (questionarioError) throw questionarioError;

    // Inserir as perguntas
    if (perguntas.length > 0) {
      const perguntasData = perguntas.map((pergunta, index) => ({
        questionario_id: questionario.id,
        pergunta: pergunta.pergunta,
        tipo_resposta: pergunta.tipo_resposta,
        opcoes_resposta: pergunta.opcoes_resposta || null,
        resposta_correta: pergunta.resposta_correta || null,
        pontuacao: pergunta.pontuacao || 1,
        ordem: index + 1,
        obrigatoria: pergunta.obrigatoria !== false
      }));

      const { error: perguntasError } = await supabase
        .from('perguntas_questionarios')
        .insert(perguntasData);

      if (perguntasError) throw perguntasError;
    }

    return { data: questionario, error: null };
  } catch (error) {
    console.error('Erro ao criar questionário:', error);
    return { data: null, error };
  }
};

/**
 * Buscar questionário por ID do treinamento
 */
export const buscarQuestionarioPorTreinamento = async (treinamentoId) => {
  try {
    const { data, error } = await supabase
      .from('questionarios_treinamentos')
      .select(`
        *,
        perguntas_questionarios(*)
      `)
      .eq('treinamento_id', treinamentoId)
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = No rows found

    // Ordenar perguntas por ordem
    if (data && data.perguntas_questionarios) {
      data.perguntas_questionarios.sort((a, b) => a.ordem - b.ordem);
    }

    return { data: data || null, error: null };
  } catch (error) {
    console.error('Erro ao buscar questionário:', error);
    return { data: null, error };
  }
};

/**
 * Verificar se treinamento tem questionário
 */
export const verificarSeTemQuestionario = async (treinamentoId) => {
  try {
    const { data, error } = await supabase
      .from('questionarios_treinamentos')
      .select('id, obrigatorio')
      .eq('treinamento_id', treinamentoId)
      .eq('ativo', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { 
      temQuestionario: !!data, 
      obrigatorio: data?.obrigatorio || false,
      questionarioId: data?.id || null,
      error: null 
    };
  } catch (error) {
    console.error('Erro ao verificar questionário:', error);
    return { temQuestionario: false, obrigatorio: false, questionarioId: null, error };
  }
};

/**
 * Buscar questionário completo por ID
 */
export const buscarQuestionarioCompleto = async (questionarioId) => {
  try {
    const { data, error } = await supabase
      .from('questionarios_treinamentos')
      .select(`
        *,
        treinamentos(titulo, categoria_nome),
        perguntas_questionarios(*)
      `)
      .eq('id', questionarioId)
      .eq('ativo', true)
      .single();

    if (error) throw error;

    // Ordenar perguntas por ordem
    if (data.perguntas_questionarios) {
      data.perguntas_questionarios.sort((a, b) => a.ordem - b.ordem);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar questionário completo:', error);
    return { data: null, error };
  }
};

/**
 * Atualizar questionário
 */
export const atualizarQuestionario = async (questionarioId, dadosQuestionario) => {
  try {
    const { titulo, descricao, obrigatorio, perguntas = [] } = dadosQuestionario;

    // Atualizar questionário
    const { data: questionario, error: questionarioError } = await supabase
      .from('questionarios_treinamentos')
      .update({
        titulo,
        descricao,
        obrigatorio,
        updated_at: new Date().toISOString()
      })
      .eq('id', questionarioId)
      .select()
      .single();

    if (questionarioError) throw questionarioError;

    // Deletar perguntas antigas
    const { error: deleteError } = await supabase
      .from('perguntas_questionarios')
      .delete()
      .eq('questionario_id', questionarioId);

    if (deleteError) throw deleteError;

    // Inserir novas perguntas
    if (perguntas.length > 0) {
      const perguntasData = perguntas.map((pergunta, index) => ({
        questionario_id: questionarioId,
        pergunta: pergunta.pergunta,
        tipo_resposta: pergunta.tipo_resposta,
        opcoes_resposta: pergunta.opcoes_resposta || null,
        resposta_correta: pergunta.resposta_correta || null,
        pontuacao: pergunta.pontuacao || 1,
        ordem: index + 1,
        obrigatoria: pergunta.obrigatoria !== false
      }));

      const { error: perguntasError } = await supabase
        .from('perguntas_questionarios')
        .insert(perguntasData);

      if (perguntasError) throw perguntasError;
    }

    return { data: questionario, error: null };
  } catch (error) {
    console.error('Erro ao atualizar questionário:', error);
    return { data: null, error };
  }
};

/**
 * Excluir questionário (soft delete)
 */
export const excluirQuestionario = async (questionarioId) => {
  try {
    const { data, error } = await supabase
      .from('questionarios_treinamentos')
      .update({ ativo: false })
      .eq('id', questionarioId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao excluir questionário:', error);
    return { data: null, error };
  }
};

// ========================================
// RESPOSTAS DOS USUÁRIOS
// ========================================

/**
 * Verificar se usuário já respondeu o questionário
 */
export const verificarQuestionarioRespondido = async (questionarioId, usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('sessoes_questionarios')
      .select('status, data_conclusao, percentual_acerto, pontuacao_total, pontuacao_maxima')
      .eq('questionario_id', questionarioId)
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { 
      data: data || null, 
      jaRespondido: data?.status === 'concluido',
      error: null 
    };
  } catch (error) {
    console.error('Erro ao verificar questionário respondido:', error);
    return { data: null, jaRespondido: false, error };
  }
};

/**
 * Iniciar sessão de questionário
 */
export const iniciarSessaoQuestionario = async (questionarioId, usuarioId) => {
  try {
    // Verificar se já existe uma sessão ativa
    const { data: sessaoExistente } = await supabase
      .from('sessoes_questionarios')
      .select('*')
      .eq('questionario_id', questionarioId)
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Se já existe uma sessão não concluída, retornar ela
    if (sessaoExistente && sessaoExistente.status !== 'concluido') {
      return { data: sessaoExistente, error: null };
    }

    // Criar nova sessão
    const { data, error } = await supabase
      .from('sessoes_questionarios')
      .insert([{
        questionario_id: questionarioId,
        usuario_id: usuarioId,
        status: 'iniciado',
        tentativa: (sessaoExistente?.tentativa || 0) + 1
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao iniciar sessão:', error);
    return { data: null, error };
  }
};

/**
 * Salvar resposta do usuário
 */
export const salvarResposta = async (questionarioId, perguntaId, usuarioId, resposta, tempoResposta = null) => {
  try {
    const { data, error } = await supabase
      .from('respostas_questionarios')
      .upsert([{
        questionario_id: questionarioId,
        pergunta_id: perguntaId,
        usuario_id: usuarioId,
        resposta: resposta,
        tempo_resposta: tempoResposta
      }], {
        onConflict: 'questionario_id,pergunta_id,usuario_id'
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao salvar resposta:', error);
    return { data: null, error };
  }
};

/**
 * Buscar respostas do usuário para um questionário
 */
export const buscarRespostasUsuario = async (questionarioId, usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('respostas_questionarios')
      .select(`
        *,
        perguntas_questionarios(pergunta, tipo_resposta, opcoes_resposta, resposta_correta, pontuacao)
      `)
      .eq('questionario_id', questionarioId)
      .eq('usuario_id', usuarioId);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erro ao buscar respostas do usuário:', error);
    return { data: [], error };
  }
};

/**
 * Finalizar questionário
 */
export const finalizarQuestionario = async (questionarioId, usuarioId) => {
  try {
    // Calcular estatísticas finais
    const { data: respostas } = await buscarRespostasUsuario(questionarioId, usuarioId);
    
    const pontuacaoTotal = respostas.reduce((sum, r) => sum + (r.pontos_obtidos || 0), 0);
    const pontuacaoMaxima = respostas.reduce((sum, r) => sum + (r.perguntas_questionarios.pontuacao || 0), 0);
    const percentualAcerto = pontuacaoMaxima > 0 ? (pontuacaoTotal / pontuacaoMaxima) * 100 : 0;

    // Atualizar sessão
    const { data, error } = await supabase
      .from('sessoes_questionarios')
      .update({
        status: 'concluido',
        data_conclusao: new Date().toISOString(),
        pontuacao_total: pontuacaoTotal,
        pontuacao_maxima: pontuacaoMaxima,
        percentual_acerto: percentualAcerto
      })
      .eq('questionario_id', questionarioId)
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(1)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao finalizar questionário:', error);
    return { data: null, error };
  }
};

// ========================================
// ANALYTICS E RELATÓRIOS
// ========================================

/**
 * Buscar estatísticas do questionário
 */
export const buscarEstatisticasQuestionario = async (questionarioId) => {
  try {
    const { data, error } = await supabase
      .from('relatorio_questionarios')
      .select('*')
      .eq('questionario_id', questionarioId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { data: data || null, error: null };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return { data: null, error };
  }
};

/**
 * Buscar performance dos usuários
 */
export const buscarPerformanceUsuarios = async (questionarioId) => {
  try {
    const { data, error } = await supabase
      .from('performance_usuarios_questionarios')
      .select('*')
      .eq('questionario_id', questionarioId)
      .order('percentual_acerto', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erro ao buscar performance dos usuários:', error);
    return { data: [], error };
  }
};

/**
 * Buscar relatório detalhado por pergunta
 */
export const buscarRelatorioPorPergunta = async (questionarioId) => {
  try {
    // Buscar todas as perguntas
    const { data: perguntas, error: perguntasError } = await supabase
      .from('perguntas_questionarios')
      .select('*')
      .eq('questionario_id', questionarioId)
      .order('ordem');

    if (perguntasError) throw perguntasError;

    // Para cada pergunta, buscar estatísticas de resposta
    const relatorio = await Promise.all(
      perguntas.map(async (pergunta) => {
        const { data: respostas, error: respostasError } = await supabase
          .from('respostas_questionarios')
          .select('resposta, correta, pontos_obtidos')
          .eq('pergunta_id', pergunta.id);

        if (respostasError) throw respostasError;

        const totalRespostas = respostas.length;
        const respostasCorretas = respostas.filter(r => r.correta).length;
        const percentualAcerto = totalRespostas > 0 ? (respostasCorretas / totalRespostas) * 100 : 0;

        // Análise de respostas por opção (para múltipla escolha)
        const analiseOpcoes = {};
        if (pergunta.tipo_resposta !== 'texto' && pergunta.opcoes_resposta) {
          const opcoes = JSON.parse(pergunta.opcoes_resposta);
          opcoes.forEach(opcao => {
            analiseOpcoes[opcao] = respostas.filter(r => {
              const resposta = typeof r.resposta === 'string' ? r.resposta : JSON.stringify(r.resposta);
              return resposta.includes(opcao);
            }).length;
          });
        }

        return {
          pergunta: pergunta.pergunta,
          tipo_resposta: pergunta.tipo_resposta,
          total_respostas: totalRespostas,
          respostas_corretas: respostasCorretas,
          percentual_acerto: Math.round(percentualAcerto * 100) / 100,
          pontuacao_maxima: pergunta.pontuacao,
          media_pontos: totalRespostas > 0 ? respostas.reduce((sum, r) => sum + (r.pontos_obtidos || 0), 0) / totalRespostas : 0,
          analise_opcoes: analiseOpcoes
        };
      })
    );

    return { data: relatorio, error: null };
  } catch (error) {
    console.error('Erro ao buscar relatório por pergunta:', error);
    return { data: [], error };
  }
};

/**
 * Buscar todos os questionários com estatísticas básicas
 */
export const buscarTodosQuestionarios = async () => {
  try {
    const { data, error } = await supabase
      .from('relatorio_questionarios')
      .select('*')
      .order('data_criacao', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erro ao buscar questionários:', error);
    return { data: [], error };
  }
};

/**
 * Exportar dados do questionário para CSV
 */
export const exportarDadosQuestionario = async (questionarioId) => {
  try {
    // Buscar dados completos
    const [questionarioResult, performanceResult, relatorioResult] = await Promise.all([
      buscarQuestionarioCompleto(questionarioId),
      buscarPerformanceUsuarios(questionarioId),
      buscarRelatorioPorPergunta(questionarioId)
    ]);

    if (questionarioResult.error || performanceResult.error || relatorioResult.error) {
      throw new Error('Erro ao buscar dados para exportação');
    }

    const dados = {
      questionario: questionarioResult.data,
      performance_usuarios: performanceResult.data,
      relatorio_perguntas: relatorioResult.data
    };

    return { data: dados, error: null };
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return { data: null, error };
  }
};

// ========================================
// UTILITÁRIOS
// ========================================

/**
 * Validar estrutura de pergunta
 */
export const validarPergunta = (pergunta) => {
  const erros = [];

  if (!pergunta.pergunta || pergunta.pergunta.trim() === '') {
    erros.push('Texto da pergunta é obrigatório');
  }

  if (!['unica', 'multipla', 'texto'].includes(pergunta.tipo_resposta)) {
    erros.push('Tipo de resposta inválido');
  }

  if (pergunta.tipo_resposta === 'unica' || pergunta.tipo_resposta === 'multipla') {
    if (!pergunta.opcoes_resposta || pergunta.opcoes_resposta.length < 2) {
      erros.push('Perguntas de múltipla escolha devem ter pelo menos 2 opções');
    }

    if (!pergunta.resposta_correta) {
      erros.push('Resposta correta é obrigatória para perguntas de múltipla escolha');
    }
  }

  if (pergunta.pontuacao && (pergunta.pontuacao < 1 || pergunta.pontuacao > 10)) {
    erros.push('Pontuação deve estar entre 1 e 10');
  }

  return {
    valida: erros.length === 0,
    erros
  };
};

/**
 * Validar estrutura de questionário
 */
export const validarQuestionario = (questionario) => {
  const erros = [];

  if (!questionario.titulo || questionario.titulo.trim() === '') {
    erros.push('Título do questionário é obrigatório');
  }

  if (!questionario.perguntas || questionario.perguntas.length === 0) {
    erros.push('Questionário deve ter pelo menos uma pergunta');
  }

  // Validar cada pergunta
  if (questionario.perguntas) {
    questionario.perguntas.forEach((pergunta, index) => {
      const validacao = validarPergunta(pergunta);
      if (!validacao.valida) {
        erros.push(`Pergunta ${index + 1}: ${validacao.erros.join(', ')}`);
      }
    });
  }

  return {
    valido: erros.length === 0,
    erros
  };
};

export default {
  // Gestão de questionários
  criarQuestionario,
  buscarQuestionarioPorTreinamento,
  verificarSeTemQuestionario,
  buscarQuestionarioCompleto,
  atualizarQuestionario,
  excluirQuestionario,
  
  // Respostas dos usuários
  verificarQuestionarioRespondido,
  iniciarSessaoQuestionario,
  salvarResposta,
  buscarRespostasUsuario,
  finalizarQuestionario,
  
  // Analytics e relatórios
  buscarEstatisticasQuestionario,
  buscarPerformanceUsuarios,
  buscarRelatorioPorPergunta,
  buscarTodosQuestionarios,
  exportarDadosQuestionario,
  
  // Utilitários
  validarPergunta,
  validarQuestionario
};
