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
    console.error('❌ Erro ao criar questionário:', error);
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

    const resultado = { 
      temQuestionario: !!data, 
      obrigatorio: data?.obrigatorio || false,
      questionarioId: data?.id || null,
      error: null 
    };


    return resultado;
  } catch (error) {
    console.error('❌ Erro ao verificar questionário:', error);
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
export const verificarQuestionarioRespondido = async (treinamentoId, usuarioId) => {
  try {

    
    // Primeiro buscar o questionário pelo treinamento
    const { data: questionario, error: questionarioError } = await supabase
      .from('questionarios_treinamentos')
      .select('id')
      .eq('treinamento_id', treinamentoId)
      .eq('ativo', true)
      .single();

    if (questionarioError && questionarioError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar questionário:', questionarioError);
      throw questionarioError;
    }

    if (!questionario) {

      return { data: null, jaRespondido: false, error: null };
    }



    // Agora verificar se o usuário já respondeu

    
    const { data, error } = await supabase
      .from('sessoes_questionarios')
      .select('id, status, data_conclusao, percentual_acerto, pontuacao_total, pontuacao_maxima, created_at')
      .eq('questionario_id', questionario.id)
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });




    if (error && error.code !== 'PGRST116') throw error;

    // Pegar a sessão mais recente
    const sessaoRecente = data && data.length > 0 ? data[0] : null;
    const jaRespondido = sessaoRecente?.status === 'concluido';
    




    return { 
      data: sessaoRecente || null, 
      jaRespondido,
      error: null 
    };
  } catch (error) {
    console.error('❌ Erro ao verificar questionário respondido:', error);
    return { data: null, jaRespondido: false, error };
  }
};

/**
 * Registrar recusa em responder questionário
 */
export const recusarQuestionario = async (questionarioId, usuarioId) => {
  try {

    
    // Primeiro, verificar se já existe uma sessão para este usuário e questionário
    const { data: sessoesExistentes, error: consultaError } = await supabase
      .from('sessoes_questionarios')
      .select('*')
      .eq('questionario_id', questionarioId)
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });

    if (consultaError && consultaError.code !== 'PGRST116') {
      throw consultaError;
    }

    let data;
    let error;

    if (sessoesExistentes && sessoesExistentes.length > 0) {
      // Se existe sessão, atualizar a mais recente para "recusado"
      const sessaoMaisRecente = sessoesExistentes[0];

      
      const resultado = await supabase
        .from('sessoes_questionarios')
        .update({
          status: 'recusado',
          recusou_responder: true,
          data_conclusao: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessaoMaisRecente.id)
        .select()
        .single();
      
      data = resultado.data;
      error = resultado.error;
    } else {
      // Se não existe sessão, criar uma nova

      
      const resultado = await supabase
        .from('sessoes_questionarios')
        .insert([{
          questionario_id: questionarioId,
          usuario_id: usuarioId,
          status: 'recusado',
          recusou_responder: true,
          tentativa: 1,
          data_conclusao: new Date().toISOString()
        }])
        .select()
        .single();
      
      data = resultado.data;
      error = resultado.error;
    }

    if (error) throw error;
    

    return { data, error: null };
  } catch (error) {
    console.error('❌ Erro ao registrar recusa:', error);
    return { data: null, error };
  }
};

/**
 * Iniciar sessão de questionário
 */
export const iniciarSessaoQuestionario = async (questionarioId, usuarioId) => {
  try {

    
    // Buscar todas as sessões para contar tentativas
    const { data: sessoesAnteriores } = await supabase
      .from('sessoes_questionarios')
      .select('*')
      .eq('questionario_id', questionarioId)
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });

    // Verificar se já existe uma sessão ativa (não concluída)
    const sessaoAtiva = sessoesAnteriores?.find(s => s.status === 'iniciado');
    if (sessaoAtiva) {

      return { data: sessaoAtiva, error: null };
    }

    // Contar tentativas (incluir só tentativas concluídas ou reprovadas)
    const tentativasAnteriores = sessoesAnteriores?.filter(s => 
      s.status === 'concluido' && (s.percentual_acerto < 90 || s.percentual_acerto >= 90)
    ).length || 0;

    const novaTentativa = tentativasAnteriores + 1;


    // Criar nova sessão
    const { data, error } = await supabase
      .from('sessoes_questionarios')
      .insert([{
        questionario_id: questionarioId,
        usuario_id: usuarioId,
        status: 'iniciado',
        tentativa: novaTentativa
      }])
      .select()
      .single();

    if (error) throw error;
    

    return { data, error: null };
  } catch (error) {
    console.error('❌ Erro ao iniciar sessão:', error);
    return { data: null, error };
  }
};

/**
 * Salvar resposta do usuário
 */
export const salvarResposta = async (questionarioId, perguntaId, usuarioId, resposta, tempoResposta = null) => {
  try {

    
    // Buscar dados da pergunta para verificar se está correta

    const { data: pergunta, error: perguntaError } = await supabase
      .from('perguntas_questionarios')
      .select('resposta_correta, pontuacao, tipo_resposta')
      .eq('id', perguntaId)
      .single();
      


    if (perguntaError) {
      console.error('❌ Erro ao buscar pergunta:', perguntaError);
      throw perguntaError;
    }

    if (!pergunta) {
      throw new Error(`Pergunta com ID ${perguntaId} não encontrada`);
    }

    // Verificar se a resposta está correta
    let correta = false;
    let respostaStr = typeof resposta === 'string' ? resposta : JSON.stringify(resposta);
    let respostaCorretaStr = typeof pergunta.resposta_correta === 'string' ? pergunta.resposta_correta : JSON.stringify(pergunta.resposta_correta);
    
    if (pergunta.tipo_resposta === 'multipla') {
      // Para múltipla escolha, comparar arrays
      const respostaArray = Array.isArray(resposta) ? resposta.sort() : [resposta].sort();
      const corretaArray = Array.isArray(pergunta.resposta_correta) ? pergunta.resposta_correta.sort() : [pergunta.resposta_correta].sort();
      correta = JSON.stringify(respostaArray) === JSON.stringify(corretaArray);
    } else {
      // Para outras, comparar strings
      correta = respostaStr.toLowerCase().trim() === respostaCorretaStr.toLowerCase().trim();
    }

    const pontosObtidos = correta ? (pergunta.pontuacao || 1) : 0;
    


    const { data, error } = await supabase
      .from('respostas_questionarios')
      .upsert([{
        questionario_id: questionarioId,
        pergunta_id: perguntaId,
        usuario_id: usuarioId,
        resposta: resposta,
        correta: correta,
        pontos_obtidos: pontosObtidos,
        tempo_resposta: tempoResposta
      }], {
        onConflict: 'questionario_id,pergunta_id,usuario_id'
      })
      .select()
      .single();

    if (error) throw error;
    

    return { data, error: null };
  } catch (error) {
    console.error('❌ Erro ao salvar resposta:', error);
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

    
    let { data, error } = await supabase
      .from('relatorio_questionarios')
      .select('*')
      .eq('questionario_id', questionarioId)
      .single();

    // Se a view não existir, criar dados básicos
    if (error && error.code === '42P01') { // Tabela não existe

      
      const { data: questionario, error: questionarioError } = await supabase
        .from('questionarios_treinamentos')
        .select('*')
        .eq('id', questionarioId)
        .single();

      if (questionarioError) throw questionarioError;

      data = {
        questionario_id: questionario.id,
        questionario_titulo: questionario.titulo,
        total_usuarios_responderam: 0,
        usuarios_concluiram: 0,
        media_acertos: 0,
        taxa_conclusao: 0,
        data_criacao: questionario.created_at
      };
    } else if (error && error.code !== 'PGRST116') {
      throw error;
    }


    return { data: data || null, error: null };
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    return { data: null, error };
  }
};

/**
 * Buscar performance dos usuários
 */
export const buscarPerformanceUsuarios = async (questionarioId) => {
  try {

    
    let { data, error } = await supabase
      .from('performance_usuarios_questionarios')
      .select('*')
      .eq('questionario_id', questionarioId)
      .order('percentual_acerto', { ascending: false });

    // Se a view não existir, buscar dados das tabelas básicas
    if (error && error.code === '42P01') { // Tabela não existe

      
      const { data: sessoes, error: sessoesError } = await supabase
        .from('sessoes_questionarios')
        .select(`
          *,
          usuarios(id, nome, email)
        `)
        .eq('questionario_id', questionarioId);

      if (sessoesError) throw sessoesError;

      // Transformar dados para formato esperado
      data = sessoes.map(s => ({
        usuario_nome: s.usuarios?.nome || 'Usuário sem nome',
        usuario_email: s.usuarios?.email || 'sem-email@exemplo.com',
        data_conclusao: s.data_conclusao,
        pontuacao_total: s.pontuacao_total || 0,
        pontuacao_maxima: s.pontuacao_maxima || 0,
        percentual_acerto: s.percentual_acerto || 0,
        status: s.status
      }));
    } else if (error) {
      throw error;
    }


    return { data: data || [], error: null };
  } catch (error) {
    console.error('❌ Erro ao buscar performance dos usuários:', error);
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

    if (perguntasError) {
      console.error('❌ Erro ao buscar perguntas:', perguntasError);
      throw perguntasError;
    }

    if (!perguntas || perguntas.length === 0) {

      return { data: [], error: null };
    }

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
          try {
            let opcoes = [];
            
            // Tentar fazer parse das opções
            if (typeof pergunta.opcoes_resposta === 'string') {
              opcoes = JSON.parse(pergunta.opcoes_resposta);
            } else if (Array.isArray(pergunta.opcoes_resposta)) {
              opcoes = pergunta.opcoes_resposta;
            }
            
            opcoes.forEach(opcao => {
              analiseOpcoes[opcao] = respostas.filter(r => {
                try {
                  const resposta = typeof r.resposta === 'string' ? r.resposta : JSON.stringify(r.resposta);
                  return resposta.includes(opcao);
                } catch (e) {
                  return false;
                }
              }).length;
            });
          } catch (e) {

            // Se der erro no parse, continuar sem análise de opções
          }
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

    
    // Tentar buscar dados da view primeiro, se não existir, buscar dados básicos
    let { data, error } = await supabase
      .from('relatorio_questionarios')
      .select('*')
      .order('data_criacao', { ascending: false });

    // Se a view não existir, buscar dados das tabelas básicas
    if (error && error.code === '42P01') { // Tabela não existe

      
      const { data: questionarios, error: questionariosError } = await supabase
        .from('questionarios_treinamentos')
        .select(`
          id,
          titulo,
          created_at,
          treinamentos(id, titulo, categoria_nome)
        `)
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (questionariosError) throw questionariosError;

      // Transformar dados para formato esperado
      data = questionarios.map(q => ({
        questionario_id: q.id,
        questionario_titulo: q.titulo,
        treinamento_titulo: q.treinamentos?.titulo || 'Sem título',
        categoria: q.treinamentos?.categoria_nome || 'Sem categoria',
        data_criacao: q.created_at,
        total_usuarios_responderam: 0,
        usuarios_concluiram: 0,
        media_acertos: 0,
        taxa_conclusao: 0
      }));
    } else if (error) {
      throw error;
    }


    return { data: data || [], error: null };
  } catch (error) {
    console.error('❌ Erro ao buscar questionários:', error);
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
  recusarQuestionario,
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
