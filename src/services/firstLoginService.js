import { supabase } from '../lib/supabase';
import securityService from './securityService';

// Serviço para gerenciar primeiro login e alteração de senha
// (Para sistema de auth personalizado, não Supabase Auth)

class FirstLoginService {
  // Alterar senha no primeiro login
  async changePassword(userId, newPassword) {
    try {
      console.log('🔑 Alterando senha para usuário:', userId);
      
      // Validações de segurança
      if (!securityService.isValidUUID(userId)) {
        return { success: false, error: 'ID de usuário inválido' };
      }

      const passwordValidation = securityService.validatePassword(newPassword);
      if (!passwordValidation.valida) {
        return { success: false, error: 'Senha não atende aos critérios de segurança' };
      }

      // Log da tentativa
      securityService.logSecurityEvent('PASSWORD_CHANGE_ATTEMPT', userId, { 
        reason: 'first_login'
      });

      // Chamar função RPC personalizada (nova versão segura)
      const { data, error } = await supabase.rpc('update_user_password_first_login_secure', {
        p_user_id: userId,
        p_new_password: newPassword
      });

      if (error) {
        console.error('❌ Erro na RPC:', error);
        throw error;
      }

      console.log('✅ Resposta da RPC:', data);

      if (data && data.length > 0) {
        const result = data[0];
        
        if (result.success) {
          console.log('✅ Senha alterada com sucesso');
          
          // Log de sucesso
          securityService.logSecurityEvent('PASSWORD_CHANGED_SUCCESS', userId, { 
            reason: 'first_login'
          });
          
          return {
            success: true,
            message: result.message
          };
        } else {
          console.error('❌ Falha na alteração:', result.message);
          
          // Log de falha
          securityService.logSecurityEvent('PASSWORD_CHANGE_FAILED', userId, { 
            reason: 'first_login',
            error: result.message
          });
          
          return {
            success: false,
            error: result.message
          };
        }
      }

      return {
        success: false,
        error: 'Resposta inválida do servidor'
      };

    } catch (error) {
      console.error('❌ Erro ao alterar senha:', error);
      return {
        success: false,
        error: error.message || 'Erro interno do servidor'
      };
    }
  }

  // Verificar se usuário precisa alterar senha
  async needsPasswordChange(userId) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('primeiro_login')
        .eq('id', userId)
        .eq('ativo', true)
        .single();

      if (error) throw error;

      return data?.primeiro_login === true;
    } catch (error) {
      console.error('Erro ao verificar primeiro login:', error);
      return false;
    }
  }

  // Validar critérios de senha (delegando para securityService)
  validatePassword(password) {
    return securityService.validatePassword(password);
  }
}

export default new FirstLoginService();
