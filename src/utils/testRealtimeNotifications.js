import { supabase } from '../lib/supabase';
import notificationService from '../services/notificationService';

/**
 * Utilitário para testar notificações em tempo real
 * Use no console do navegador: window.testNotifications()
 */

// Função para testar criação de notificação
export const createTestNotification = async (userId) => {
  try {
    const testNotification = {
      user_id: userId,
      type: 'system',
      title: '🧪 Teste de Notificação em Tempo Real',
      message: `Notificação de teste criada em ${new Date().toLocaleTimeString()}`,
      data: {
        test: true,
        timestamp: new Date().toISOString()
      },
      priority: 'medium'
    };

    console.log('📤 Criando notificação de teste:', testNotification);

    const { data, error } = await supabase
      .from('notifications')
      .insert([testNotification])
      .select('*')
      .single();

    if (error) throw error;

    console.log('✅ Notificação de teste criada:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao criar notificação de teste:', error);
    return null;
  }
};

// Função para testar notificação de feedback
export const createTestFeedbackNotification = async (userId) => {
  try {
    const feedbackNotification = {
      user_id: userId,
      type: 'feedback',
      title: '📝 Teste - Você recebeu um feedback',
      message: 'Você recebeu um feedback de teste na categoria "Teste". Verifique em seu perfil.',
      data: {
        feedback_id: 999,
        categoria_nome: 'Teste',
        categoria_cor: '#3B82F6',
        nome_avaliador: 'Sistema de Teste',
        action_url: '/perfil'
      },
      priority: 'high'
    };

    console.log('📤 Criando notificação de feedback de teste:', feedbackNotification);

    const { data, error } = await supabase
      .from('notifications')
      .insert([feedbackNotification])
      .select('*')
      .single();

    if (error) throw error;

    console.log('✅ Notificação de feedback de teste criada:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao criar notificação de feedback de teste:', error);
    return null;
  }
};

// Função para verificar subscription ativa
export const checkRealtimeStatus = async () => {
  try {
    console.log('🔍 Verificando status do Realtime...');
    
    // Verificar conexão do Supabase
    const { data: { session } } = await supabase.auth.getSession();
    console.log('👤 Sessão ativa:', !!session);
    
    // Verificar channels ativos
    const channels = supabase.getChannels();
    console.log('📡 Channels ativos:', channels.length);
    
    channels.forEach((channel, index) => {
      console.log(`📺 Channel ${index + 1}:`, {
        topic: channel.topic,
        state: channel.state,
        joinedAt: channel.joinedAt
      });
    });

    return {
      session: !!session,
      channelsCount: channels.length,
      channels: channels.map(c => ({ topic: c.topic, state: c.state }))
    };
  } catch (error) {
    console.error('❌ Erro ao verificar status do Realtime:', error);
    return null;
  }
};

// Função para monitorar eventos realtime
export const monitorRealtimeEvents = (duration = 30000) => {
  console.log(`🔄 Monitorando eventos realtime por ${duration/1000} segundos...`);
  
  const events = [];
  
  // Interceptar logs do Supabase (se possível)
  const originalLog = console.log;
  console.log = (...args) => {
    const message = args.join(' ');
    if (message.includes('realtime') || message.includes('subscription') || message.includes('📨')) {
      events.push({
        timestamp: new Date().toISOString(),
        message: message
      });
    }
    originalLog.apply(console, args);
  };

  setTimeout(() => {
    console.log = originalLog;
    console.log('⏰ Monitoramento concluído. Eventos capturados:');
    console.table(events);
  }, duration);

  return events;
};

// Função principal de teste
export const testRealtimeNotifications = async () => {
  console.log('🧪 ===== TESTE DE NOTIFICAÇÕES EM TEMPO REAL =====');
  
  try {
    // 1. Verificar status
    const status = await checkRealtimeStatus();
    console.log('📊 Status atual:', status);

    // 2. Obter usuário atual
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ Usuário não está logado');
      return;
    }

    const userId = session.user.id;
    console.log('👤 Testando para usuário:', userId);

    // 3. Monitorar eventos
    const events = monitorRealtimeEvents(10000);

    // 4. Criar notificação de teste
    await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1s
    await createTestNotification(userId);

    // 5. Aguardar um pouco e criar notificação de feedback
    await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2s
    await createTestFeedbackNotification(userId);

    console.log('✅ Testes iniciados. Verifique se as notificações aparecem em tempo real.');
    console.log('💡 Se não aparecerem, execute: sql/habilitar_realtime_notifications.sql');

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
};

// Expor funções globalmente para facilitar testes
if (typeof window !== 'undefined') {
  window.testNotifications = testRealtimeNotifications;
  window.createTestNotification = createTestNotification;
  window.createTestFeedbackNotification = createTestFeedbackNotification;
  window.checkRealtimeStatus = checkRealtimeStatus;
  window.monitorRealtimeEvents = monitorRealtimeEvents;
}
