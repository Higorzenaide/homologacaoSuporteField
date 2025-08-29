import { supabase } from '../lib/supabase';

// Serviço para gerenciar primeiro login e alteração de senha
// (Para sistema de auth personalizado, não Supabase Auth)

class FirstLoginService {
  // Alterar senha no primeiro login
  async changePassword(userId, newPassword) {
    try {
      console.log('🔑 Alterando senha para usuário:', userId);
      
      // Chamar função RPC personalizada
      const { data, error } = await supabase.rpc('update_user_password_first_login', {
        user_id_param: userId,
        new_password: newPassword
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
          return {
            success: true,
            message: result.message
          };
        } else {
          console.error('❌ Falha na alteração:', result.message);
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

  // Validar critérios de senha
  validatePassword(password) {
    const criterios = {
      tamanho: password.length >= 6,
      maiuscula: /[A-Z]/.test(password),
      numero: /[0-9]/.test(password),
      especial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const valida = Object.values(criterios).every(criterio => criterio);
    return { valida, criterios };
  }
}

export default new FirstLoginService();
