import { supabase } from '../lib/supabase';

export const atualizarEstatistica = async (chave, valor) => {
  try {
    console.log(`🔄 Atualizando estatística: ${chave} = ${valor}`);
    
    // Primeiro, tenta fazer UPDATE
    const { data: updateData, error: updateError } = await supabase
      .from('estatisticas_home')
      .update({ valor: valor.toString() })
      .eq('chave', chave)
      .select();

    if (updateError) {
      console.error('❌ Erro no UPDATE:', updateError);
      throw updateError;
    }

    // Se o UPDATE não afetou nenhuma linha, faz INSERT
    if (!updateData || updateData.length === 0) {
      console.log('🔄 Nenhuma linha afetada no UPDATE, tentando INSERT...');
      
      const { data: insertData, error: insertError } = await supabase
        .from('estatisticas_home')
        .insert([{
          chave: chave,
          valor: valor.toString(),
          descricao: getDescricaoEstatistica(chave)
        }])
        .select();

      if (insertError) {
        console.error('❌ Erro no INSERT:', insertError);
        throw insertError;
      }

      console.log('✅ INSERT bem-sucedido');
      return { success: true, data: insertData };
    }

    console.log('✅ UPDATE bem-sucedido');
    return { success: true, data: updateData };

  } catch (error) {
    console.error('❌ Erro na função atualizarEstatistica:', error);
    return { success: false, error: error.message };
  }
};

export const obterEstatisticas = async () => {
  try {
    const { data, error } = await supabase
      .from('estatisticas_home')
      .select('*');

    if (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      throw error;
    }

    // Converter array para objeto
    const stats = {};
    data.forEach(item => {
      stats[item.chave] = item.valor;
    });

    return { success: true, data: stats };
  } catch (error) {
    console.error('❌ Erro na função obterEstatisticas:', error);
    return { success: false, error: error.message };
  }
};

const getDescricaoEstatistica = (chave) => {
  const descricoes = {
    'treinamentos': 'Número de treinamentos disponíveis',
    'satisfacao': 'Índice de satisfação dos técnicos',
    'categorias': 'Número de categorias de conhecimento'
  };
  
  return descricoes[chave] || `Estatística: ${chave}`;
};

