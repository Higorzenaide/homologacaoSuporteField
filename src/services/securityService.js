// 🔒 Serviço de Segurança - Validações e Sanitização
import { supabase } from '../lib/supabase';

class SecurityService {
  constructor() {
    this.rateLimitMap = new Map();
    this.maxAttempts = 5;
    this.windowMs = 15 * 60 * 1000; // 15 minutos
  }

  // ================================
  // SANITIZAÇÃO DE ENTRADA
  // ================================

  /**
   * Sanitiza entrada de texto para prevenir XSS
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // Remove tags básicas
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/data:/gi, '') // Remove data URLs
      .replace(/vbscript:/gi, '') // Remove vbscript
      .replace(/eval\(/gi, '') // Remove eval
      .trim();
  }

  /**
   * Sanitiza objeto recursivamente
   */
  sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value);
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  // ================================
  // VALIDAÇÕES ROBUSTAS
  // ================================

  /**
   * Valida email de forma robusta
   */
  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email) && 
           email.length <= 254 && 
           !email.includes('..') && 
           !email.startsWith('.') && 
           !email.endsWith('.');
  }

  /**
   * Valida senha com critérios de segurança
   */
  validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { valida: false, criterios: {}, error: 'Senha é obrigatória' };
    }

    const criterios = {
      tamanho: password.length >= 8,
      maiuscula: /[A-Z]/.test(password),
      minuscula: /[a-z]/.test(password),
      numero: /[0-9]/.test(password),
      especial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      semEspacos: !/\s/.test(password),
      semSequencial: !this.hasSequentialChars(password),
      semComuns: !this.isCommonPassword(password)
    };

    const valida = Object.values(criterios).every(criterio => criterio);
    
    return { valida, criterios };
  }

  /**
   * Verifica caracteres sequenciais
   */
  hasSequentialChars(password) {
    const sequential = ['123456', '654321', 'abcdef', 'fedcba', 'qwerty', 'asdfgh'];
    return sequential.some(seq => password.toLowerCase().includes(seq));
  }

  /**
   * Verifica senhas comuns
   */
  isCommonPassword(password) {
    const common = [
      'password', '123456', 'admin', 'user', 'teste', 'senha',
      '123456789', 'qwerty', 'abc123', 'password123'
    ];
    return common.includes(password.toLowerCase());
  }

  /**
   * Valida nome/texto
   */
  validateName(name) {
    if (!name || typeof name !== 'string') return false;
    
    const trimmed = name.trim();
    return trimmed.length >= 2 && 
           trimmed.length <= 100 && 
           /^[a-zA-ZÀ-ÿ\s\-'\.]+$/.test(trimmed);
  }

  /**
   * Valida telefone brasileiro
   */
  validatePhone(phone) {
    if (!phone) return true; // Opcional
    
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
  }

  /**
   * Valida UUID
   */
  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // ================================
  // RATE LIMITING
  // ================================

  /**
   * Verifica rate limit por IP/usuário
   */
  checkRateLimit(identifier, maxAttempts = this.maxAttempts, windowMs = this.windowMs) {
    const now = Date.now();
    const userAttempts = this.rateLimitMap.get(identifier) || { 
      count: 0, 
      resetTime: now + windowMs,
      firstAttempt: now
    };
    
    // Reset se janela expirou
    if (now > userAttempts.resetTime) {
      userAttempts.count = 0;
      userAttempts.resetTime = now + windowMs;
      userAttempts.firstAttempt = now;
    }
    
    userAttempts.count++;
    this.rateLimitMap.set(identifier, userAttempts);
    
    const allowed = userAttempts.count <= maxAttempts;
    const timeLeft = Math.max(0, userAttempts.resetTime - now);
    
    return {
      allowed,
      count: userAttempts.count,
      maxAttempts,
      timeLeftMs: timeLeft,
      timeLeftMin: Math.ceil(timeLeft / 60000)
    };
  }

  /**
   * Limpa rate limit para usuário
   */
  clearRateLimit(identifier) {
    this.rateLimitMap.delete(identifier);
  }

  /**
   * Limpeza automática de rate limits expirados
   */
  cleanupRateLimits() {
    const now = Date.now();
    for (const [key, value] of this.rateLimitMap.entries()) {
      if (now > value.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }
  }

  // ================================
  // VALIDAÇÃO DE DADOS COMPLETOS
  // ================================

  /**
   * Valida dados de usuário completos
   */
  validateUserData(userData, isEdit = false) {
    const errors = [];
    const sanitized = this.sanitizeObject(userData);

    // Email
    if (!isEdit || sanitized.email) {
      if (!this.isValidEmail(sanitized.email)) {
        errors.push('Email inválido ou em formato incorreto');
      }
    }

    // Nome
    if (!isEdit || sanitized.nome) {
      if (!this.validateName(sanitized.nome)) {
        errors.push('Nome deve ter entre 2-100 caracteres e conter apenas letras, espaços, hífens e apostrofes');
      }
    }

    // Senha
    if (!isEdit || sanitized.senha) {
      const senhaValidation = this.validatePassword(sanitized.senha);
      if (!senhaValidation.valida) {
        errors.push('Senha não atende aos critérios de segurança');
      }
    }

    // Tipo de usuário
    if (!isEdit || sanitized.tipo_usuario) {
      if (!['admin', 'usuario'].includes(sanitized.tipo_usuario)) {
        errors.push('Tipo de usuário deve ser "admin" ou "usuario"');
      }
    }

    // Telefone
    if (sanitized.telefone && !this.validatePhone(sanitized.telefone)) {
      errors.push('Telefone deve ter 10 ou 11 dígitos');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedData: sanitized
    };
  }

  // ================================
  // AUDITORIA E LOGGING
  // ================================

  /**
   * Log de evento de segurança
   */
  async logSecurityEvent(event, userId = null, details = {}) {
    try {
      const logData = {
        event,
        user_id: userId,
        details: this.sanitizeObject(details),
        ip_address: this.getClientIP(),
        user_agent: this.getUserAgent(),
        timestamp: new Date().toISOString()
      };

      // Log local
      console.log('SECURITY_EVENT:', JSON.stringify(logData));

      // Log no banco (se configurado)
      if (supabase) {
        try {
          await supabase.from('user_actions').insert({
            user_id: userId,
            action: event,
            details: logData.details,
            ip_address: logData.ip_address,
            user_agent: logData.user_agent
          });
        } catch (err) {
          console.warn('Failed to log to database:', err);
        }
      }

      return true;
    } catch (error) {
      console.error('Error logging security event:', error);
      return false;
    }
  }

  /**
   * Obtém IP do cliente (básico)
   */
  getClientIP() {
    // Em ambiente browser, não é possível obter IP real
    // Isso seria feito no backend
    return 'browser';
  }

  /**
   * Obtém User Agent
   */
  getUserAgent() {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  }

  // ================================
  // VERIFICAÇÕES DE PERMISSÃO
  // ================================

  /**
   * Verifica se usuário pode executar ação
   */
  canUserPerformAction(user, action, resource = null) {
    if (!user || !user.ativo) return false;

    // Logs de auditoria
    this.logSecurityEvent('PERMISSION_CHECK', user.id, { action, resource });

    switch (action) {
      case 'create_user':
      case 'delete_user':
      case 'manage_system':
        return user.tipo_usuario === 'admin';
      
      case 'edit_user':
        return user.tipo_usuario === 'admin' || (resource && resource.id === user.id);
      
      case 'view_feedbacks':
        return user.tipo_usuario === 'admin' && user.pode_ver_feedbacks;
      
      case 'view_analytics':
        return user.tipo_usuario === 'admin';
      
      default:
        return true; // Ações básicas permitidas
    }
  }

  /**
   * Middleware de autorização
   */
  requirePermission(user, action, resource = null) {
    if (!this.canUserPerformAction(user, action, resource)) {
      this.logSecurityEvent('PERMISSION_DENIED', user?.id, { action, resource });
      throw new Error('Permissão insuficiente para executar esta ação');
    }
    return true;
  }

  // ================================
  // INICIALIZAÇÃO E LIMPEZA
  // ================================

  /**
   * Inicializa limpeza automática
   */
  startCleanupInterval() {
    // Limpar rate limits a cada 5 minutos
    setInterval(() => {
      this.cleanupRateLimits();
    }, 5 * 60 * 1000);
  }

  /**
   * Para limpeza automática
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Instância singleton
const securityService = new SecurityService();

// Iniciar limpeza automática
securityService.startCleanupInterval();

export default securityService;
