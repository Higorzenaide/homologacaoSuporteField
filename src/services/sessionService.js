import { authService } from './authService';
import { getSessionConfig, ACTIVITY_EVENTS } from '../config/sessionConfig';

/**
 * Serviço para gerenciar sessões de usuário e tempo de inatividade
 */
class SessionService {
  constructor() {
    // Carregar configurações baseadas no ambiente
    const config = getSessionConfig(import.meta.env.MODE || 'production');
    
    // Configurações de tempo (em milissegundos)
    this.SESSION_TIMEOUT = config.SESSION_TIMEOUT;
    this.WARNING_TIME = config.WARNING_TIME;
    this.CHECK_INTERVAL = config.CHECK_INTERVAL;
    this.ACTIVITY_THROTTLE = config.ACTIVITY_THROTTLE;
    
    // Timers
    this.timeoutTimer = null;
    this.warningTimer = null;
    this.checkTimer = null;
    
    // Callbacks
    this.onWarning = null;
    this.onTimeout = null;
    
    // Estado
    this.isActive = false;
    this.lastActivity = Date.now();
    
    this.bindEvents();
  }

  /**
   * Inicializar o monitoramento de sessão
   */
  startSession(onWarning, onTimeout) {
    console.log('🕐 Iniciando monitoramento de sessão...');
    
    this.onWarning = onWarning;
    this.onTimeout = onTimeout;
    this.isActive = true;
    this.lastActivity = Date.now();
    
    this.resetTimers();
    this.startActivityCheck();
  }

  /**
   * Parar o monitoramento de sessão
   */
  stopSession() {
    console.log('🛑 Parando monitoramento de sessão...');
    
    this.isActive = false;
    this.clearAllTimers();
    this.onWarning = null;
    this.onTimeout = null;
  }

  /**
   * Registrar atividade do usuário
   */
  recordActivity() {
    if (!this.isActive) return;
    
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;
    
    // Só registrar se passou pelo menos 1 segundo desde a última atividade
    if (timeSinceLastActivity > 1000) {
      this.lastActivity = now;
      this.resetTimers();
    }
  }

  /**
   * Estender a sessão (quando usuário confirma que quer continuar)
   */
  extendSession() {
    console.log('⏰ Estendendo sessão...');
    this.recordActivity();
  }

  /**
   * Obter tempo restante até o timeout
   */
  getTimeUntilTimeout() {
    if (!this.isActive) return 0;
    
    const elapsed = Date.now() - this.lastActivity;
    const remaining = this.SESSION_TIMEOUT - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Obter tempo restante até o aviso
   */
  getTimeUntilWarning() {
    if (!this.isActive) return 0;
    
    const elapsed = Date.now() - this.lastActivity;
    const warningTime = this.SESSION_TIMEOUT - this.WARNING_TIME;
    const remaining = warningTime - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Verificar se a sessão está próxima do timeout
   */
  isNearTimeout() {
    return this.getTimeUntilTimeout() <= this.WARNING_TIME;
  }

  /**
   * Verificar se a sessão expirou
   */
  isExpired() {
    return this.getTimeUntilTimeout() <= 0;
  }

  /**
   * Configurar eventos para detectar atividade do usuário
   */
  bindEvents() {
    // Throttle para evitar muitas chamadas
    let throttleTimer = null;
    const throttledActivity = () => {
      if (throttleTimer) return;
      
      throttleTimer = setTimeout(() => {
        this.recordActivity();
        throttleTimer = null;
      }, this.ACTIVITY_THROTTLE);
    };

    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, throttledActivity, true);
    });

    // Detectar quando a aba perde/ganha foco
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.recordActivity();
      }
    });

    // Detectar quando a janela ganha foco
    window.addEventListener('focus', () => {
      this.recordActivity();
    });
  }

  /**
   * Resetar todos os timers
   */
  resetTimers() {
    this.clearAllTimers();
    
    if (!this.isActive) return;

    // Timer para mostrar aviso
    const warningDelay = this.SESSION_TIMEOUT - this.WARNING_TIME;
    this.warningTimer = setTimeout(() => {
      if (this.isActive && this.onWarning) {
        console.log('⚠️ Sessão próxima do timeout - mostrando aviso');
        this.onWarning();
      }
    }, warningDelay);

    // Timer para fazer logout automático
    this.timeoutTimer = setTimeout(() => {
      if (this.isActive) {
        console.log('⏰ Sessão expirada - fazendo logout automático');
        this.handleTimeout();
      }
    }, this.SESSION_TIMEOUT);
  }

  /**
   * Iniciar verificação periódica do estado da sessão
   */
  startActivityCheck() {
    if (this.checkTimer) return;

    this.checkTimer = setInterval(() => {
      if (!this.isActive) return;

      // Verificar se a sessão expirou
      if (this.isExpired()) {
        this.handleTimeout();
        return;
      }

      // Log periódico do tempo restante (apenas para debug)
      const remaining = this.getTimeUntilTimeout();
      const minutes = Math.floor(remaining / (60 * 1000));
      
      if (minutes <= 10 && minutes > 0) {
        console.log(`⏱️ Sessão expira em ${minutes} minutos`);
      }
    }, this.CHECK_INTERVAL);
  }

  /**
   * Limpar todos os timers
   */
  clearAllTimers() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * Lidar com timeout da sessão
   */
  handleTimeout() {
    console.log('🚪 Sessão expirada - executando logout...');
    
    this.stopSession();
    
    if (this.onTimeout) {
      this.onTimeout();
    } else {
      // Fallback: logout direto
      authService.logout();
      window.location.reload();
    }
  }

  /**
   * Obter informações da sessão atual
   */
  getSessionInfo() {
    return {
      isActive: this.isActive,
      lastActivity: this.lastActivity,
      timeUntilTimeout: this.getTimeUntilTimeout(),
      timeUntilWarning: this.getTimeUntilWarning(),
      isNearTimeout: this.isNearTimeout(),
      isExpired: this.isExpired(),
      sessionTimeout: this.SESSION_TIMEOUT,
      warningTime: this.WARNING_TIME
    };
  }

  /**
   * Formatar tempo em formato legível
   */
  formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Instância singleton
export const sessionService = new SessionService();
export default sessionService;
