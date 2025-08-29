/**
 * Configurações do sistema de sessão
 * Todos os tempos são em milissegundos
 */
export const SESSION_CONFIG = {
  // Tempo total da sessão (2 horas por padrão)
  SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 horas = 7,200,000 ms
  
  // Tempo de aviso antes da expiração (5 minutos por padrão)
  WARNING_TIME: 5 * 60 * 1000, // 5 minutos = 300,000 ms
  
  // Intervalo para verificação de atividade (30 segundos por padrão)
  CHECK_INTERVAL: 30 * 1000, // 30 segundos = 30,000 ms
  
  // Throttle para eventos de atividade (1 segundo por padrão)
  ACTIVITY_THROTTLE: 1000, // 1 segundo = 1,000 ms
};

/**
 * Configurações predefinidas para diferentes ambientes
 */
export const SESSION_PRESETS = {
  // Desenvolvimento - sessão mais curta para testes
  development: {
    SESSION_TIMEOUT: 15 * 60 * 1000, // 15 minutos
    WARNING_TIME: 2 * 60 * 1000, // 2 minutos
    CHECK_INTERVAL: 10 * 1000, // 10 segundos
    ACTIVITY_THROTTLE: 500, // 0.5 segundos
  },
  
  // Produção - configuração padrão de segurança
  production: {
    SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 horas
    WARNING_TIME: 5 * 60 * 1000, // 5 minutos
    CHECK_INTERVAL: 30 * 1000, // 30 segundos
    ACTIVITY_THROTTLE: 1000, // 1 segundo
  },
  
  // Administrativa - sessão mais longa para admins
  extended: {
    SESSION_TIMEOUT: 4 * 60 * 60 * 1000, // 4 horas
    WARNING_TIME: 10 * 60 * 1000, // 10 minutos
    CHECK_INTERVAL: 60 * 1000, // 1 minuto
    ACTIVITY_THROTTLE: 1000, // 1 segundo
  },
  
  // Teste - sessão muito curta para demonstrações
  demo: {
    SESSION_TIMEOUT: 2 * 60 * 1000, // 2 minutos
    WARNING_TIME: 30 * 1000, // 30 segundos
    CHECK_INTERVAL: 5 * 1000, // 5 segundos
    ACTIVITY_THROTTLE: 100, // 0.1 segundos
  }
};

/**
 * Obter configuração baseada no ambiente
 */
export const getSessionConfig = (preset = 'production') => {
  return SESSION_PRESETS[preset] || SESSION_PRESETS.production;
};

/**
 * Eventos que indicam atividade do usuário
 */
export const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove', 
  'keypress',
  'keydown',
  'scroll',
  'touchstart',
  'touchmove',
  'click',
  'focus',
  'blur'
];

/**
 * Mensagens padrão do sistema de sessão
 */
export const SESSION_MESSAGES = {
  WARNING_TITLE: 'Sessão Expirando',
  WARNING_MESSAGE: 'Sua sessão está prestes a expirar por inatividade.',
  TIMEOUT_MESSAGE: 'Sua sessão expirou por segurança. Faça login novamente.',
  EXTEND_SUCCESS: 'Sessão estendida com sucesso!',
  SESSION_STARTED: 'Monitoramento de sessão iniciado',
  SESSION_STOPPED: 'Monitoramento de sessão parado'
};

export default SESSION_CONFIG;
