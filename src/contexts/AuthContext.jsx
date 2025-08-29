import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { preloadUserCurtidas } from '../services/curtidasOptimizedService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);

  // Verificar se usuário está logado ao carregar a aplicação
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isLoggedIn() && authService.isSessionValid()) {
          // Renovar sessão se ainda válida
          authService.renewSession();
          
          // Atualizar dados do usuário
          const result = await authService.refreshUserData();
          if (result.success) {
            setUser(result.user);
            setIsAuthenticated(true);
            
            // Verificar se é primeiro login
            console.log('🔍 DEBUG: Dados do usuário após login:', result.user);
            console.log('🔍 DEBUG: primeiro_login =', result.user.primeiro_login);
            if (result.user.primeiro_login === true) {
              console.log('✅ DEBUG: Mostrando modal de primeiro login');
              setShowFirstLoginModal(true);
            } else {
              console.log('❌ DEBUG: Modal não será mostrado. primeiro_login =', result.user.primeiro_login);
            }
            
            // Pré-carregar curtidas do usuário
            preloadUserCurtidas(result.user.id).catch(console.error);
          } else {
            // Se falhou ao atualizar, fazer logout
            authService.logout();
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // Sessão inválida ou usuário não logado
          authService.logout();
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Função de login
  const login = async (email, password) => {
    try {
      setLoading(true);
      const result = await authService.login(email, password);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        
        // Verificar se é primeiro login
        console.log('🔍 DEBUG: Dados do usuário após refresh:', result.user);
        console.log('🔍 DEBUG: primeiro_login =', result.user.primeiro_login);
        if (result.user.primeiro_login === true) {
          console.log('✅ DEBUG: Mostrando modal de primeiro login (refresh)');
          setShowFirstLoginModal(true);
        } else {
          console.log('❌ DEBUG: Modal não será mostrado (refresh). primeiro_login =', result.user.primeiro_login);
        }
        
        // Pré-carregar curtidas do usuário
        preloadUserCurtidas(result.user.id).catch(console.error);
        
        return { success: true, error: null };
      } else {
        setUser(null);
        setIsAuthenticated(false);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro interno do servidor' };
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Função para lidar com conclusão do primeiro login
  const handleFirstLoginCompleted = () => {
    setShowFirstLoginModal(false);
    // Atualizar o status do usuário
    if (user) {
      setUser({ ...user, primeiro_login: false });
    }
  };

  // Função para alterar senha
  const changePassword = async (newPassword) => {
    try {
      const result = await authService.changePassword(newPassword);
      return result;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  // Função para atualizar dados do usuário
  const refreshUser = async () => {
    try {
      const result = await authService.refreshUserData();
      if (result.success) {
        setUser(result.user);
        return { success: true, error: null };
      } else {
        // Se falhou ao atualizar, fazer logout
        logout();
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  // Verificar se usuário é admin
  const isAdmin = user && user.tipo_usuario === 'admin';

  // Verificar se usuário pode editar conteúdo
  const canEdit = isAdmin;

  // Verificar se usuário pode ver feedbacks
  const canViewFeedbacks = isAdmin && user?.pode_ver_feedbacks;

  const value = {
    user,
    isAuthenticated,
    loading,
    isAdmin,
    canEdit,
    canViewFeedbacks,
    showFirstLoginModal,
    login,
    logout,
    signOut: logout, // Alias para logout
    changePassword,
    refreshUser,
    handleFirstLoginCompleted
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

