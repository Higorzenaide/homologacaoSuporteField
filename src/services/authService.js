import { supabase } from '../lib/supabase';

// Serviço de autenticação personalizada usando tabela de usuários
export class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.loadUserFromStorage();
  }

  // Carregar usuário do localStorage
  loadUserFromStorage() {
    try {
      const userData = localStorage.getItem('portfolio_user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
        this.isAuthenticated = true;
      }
    } catch (error) {
      console.error('Erro ao carregar usuário do storage:', error);
      this.clearUserData();
    }
  }

  // Salvar usuário no localStorage
  saveUserToStorage(user) {
    try {
      localStorage.setItem('portfolio_user', JSON.stringify(user));
      this.currentUser = user;
      this.isAuthenticated = true;
    } catch (error) {
      console.error('Erro ao salvar usuário no storage:', error);
    }
  }

  // Limpar dados do usuário
  clearUserData() {
    localStorage.removeItem('portfolio_user');
    this.currentUser = null;
    this.isAuthenticated = false;
  }

  // Fazer login
  async login(email, password) {
    try {
      // Chamar função do Supabase para autenticar
      const { data, error } = await supabase
        .rpc('authenticate_user', {
          user_email: email,
          user_password: password
        });

      if (error) {
        throw error;
      }

      // Verificar se a autenticação foi bem-sucedida
      if (data && data.length > 0) {
        const user = data[0];
        
        if (user.success && user.ativo) {
          // Atualizar último acesso
          await supabase.rpc('update_last_access_by_id', {
            user_id: user.id
          });

          // Salvar dados do usuário
          const userData = {
            id: user.id,
            email: user.email,
            nome: user.nome,
            cargo: user.cargo,
            tipo_usuario: user.tipo_usuario,
            ativo: user.ativo,
            isAdmin: user.tipo_usuario === 'admin',
            pode_ver_feedbacks: user.pode_ver_feedbacks, // Adicionado
            loginTime: new Date().toISOString()
          };

          this.saveUserToStorage(userData);

          return {
            success: true,
            user: userData,
            error: null
          };
        } else {
          return {
            success: false,
            user: null,
            error: user.ativo ? 'Email ou senha incorretos' : 'Usuário inativo'
          };
        }
      } else {
        return {
          success: false,
          user: null,
          error: 'Email ou senha incorretos'
        };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return {
        success: false,
        user: null,
        error: 'Erro interno do servidor'
      };
    }
  }

  // Fazer logout
  logout() {
    this.clearUserData();
    return {
      success: true,
      error: null
    };
  }

  // Verificar se usuário está logado
  isLoggedIn() {
    return this.isAuthenticated && this.currentUser && this.currentUser.ativo;
  }

  // Obter usuário atual
  getCurrentUser() {
    return this.currentUser;
  }

  // Verificar se usuário é admin
  isAdmin() {
    return this.isLoggedIn() && this.currentUser.tipo_usuario === 'admin';
  }

  // Atualizar dados do usuário atual
  async refreshUserData() {
    if (!this.currentUser || !this.currentUser.id) {
      return { success: false, error: 'Usuário não logado' };
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_by_id', {
          user_id: this.currentUser.id
        });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const user = data[0];
        const userData = {
          ...this.currentUser,
          nome: user.nome,
          cargo: user.cargo,
          tipo_usuario: user.tipo_usuario,
          ativo: user.ativo,
          isAdmin: user.tipo_usuario === 'admin',
          pode_ver_feedbacks: user.pode_ver_feedbacks, // Adicionado
        };

        this.saveUserToStorage(userData);

        return {
          success: true,
          user: userData,
          error: null
        };
      } else {
        // Usuário não encontrado ou inativo
        this.logout();
        return {
          success: false,
          error: 'Usuário não encontrado ou inativo'
        };
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      return {
        success: false,
        error: 'Erro ao atualizar dados do usuário'
      };
    }
  }

  // Alterar senha do usuário atual
  async changePassword(newPassword) {
    if (!this.currentUser || !this.currentUser.id) {
      return { success: false, error: 'Usuário não logado' };
    }

    try {
      const { data, error } = await supabase
        .rpc('update_user_password', {
          user_id: this.currentUser.id,
          new_password: newPassword
        });

      if (error) {
        throw error;
      }

      return {
        success: data,
        error: data ? null : 'Erro ao alterar senha'
      };
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // Verificar se sessão ainda é válida (opcional - para sessões com tempo limite)
  isSessionValid() {
    if (!this.currentUser || !this.currentUser.loginTime) {
      return false;
    }

    // Verificar se a sessão não expirou (24 horas)
    const loginTime = new Date(this.currentUser.loginTime);
    const now = new Date();
    const diffHours = (now - loginTime) / (1000 * 60 * 60);

    return diffHours < 24;
  }

  // Renovar sessão
  renewSession() {
    if (this.currentUser) {
      this.currentUser.loginTime = new Date().toISOString();
      this.saveUserToStorage(this.currentUser);
    }
  }
}

// Instância singleton do serviço de autenticação
export const authService = new AuthService();

// Funções auxiliares para uso nos componentes
export const login = (email, password) => authService.login(email, password);
export const logout = () => authService.logout();
export const getCurrentUser = () => authService.getCurrentUser();
export const isLoggedIn = () => authService.isLoggedIn();
export const isAdmin = () => authService.isAdmin();
export const refreshUserData = () => authService.refreshUserData();
export const changePassword = (newPassword) => authService.changePassword(newPassword);

export default authService;

