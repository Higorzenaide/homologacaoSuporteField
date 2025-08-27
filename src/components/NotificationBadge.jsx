import React, { useState, useEffect } from 'react';
import { Bell, X, Settings, Check, AlertCircle, Clock, BookOpen, Newspaper } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import NotificationSettings from './NotificationSettings';
import analyticsService from '../services/analyticsService';
import useNetworkRetry from '../hooks/useNetworkRetry';

const NotificationBadge = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const { executeWithRetry, isRetrying } = useNetworkRetry();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Carregar notificações
  useEffect(() => {
    if (user) {
      loadNotifications();
      setupRealtimeSubscription();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Mostrar notificação do navegador se permitido
        if (Notification.permission === 'granted') {
          new Notification(payload.new.title, {
            body: payload.new.message,
            icon: '/logo.jpeg',
            tag: payload.new.id
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId) => {
    try {
      // Primeiro, otimisticamente atualiza a UI
      const notificationToUpdate = notifications.find(n => n.id === notificationId);
      const wasUnread = notificationToUpdate && !notificationToUpdate.read;
      
      if (wasUnread) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Tentar atualizar no servidor com retry
      await executeWithRetry(
        async () => {
          // Atualizar notificação como lida
          const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

          if (error) throw error;

          // Registrar analytics (dentro do retry)
          if (user) {
            try {
              await analyticsService.markNotificationAsRead(notificationId, user.id);
            } catch (analyticsError) {
              console.warn('Erro ao registrar analytics (não crítico):', analyticsError);
            }
          }
        },
        {
          onError: (error) => {
            // Reverter mudanças na UI em caso de erro
            if (notificationToUpdate && wasUnread) {
              setNotifications(prev => 
                prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
              );
              setUnreadCount(prev => prev + 1);
            }
            showError('Erro ao marcar notificação como lida. Verifique sua conexão.');
          }
        }
      );
      
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // Primeiro, otimisticamente atualiza a UI
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);

      // Tentar atualizar no servidor com retry
      await executeWithRetry(
        async () => {
          const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false);

          if (error) throw error;

          // Registrar analytics para todas as notificações não lidas
          if (user) {
            for (const notification of unreadNotifications) {
              try {
                await analyticsService.markNotificationAsRead(notification.id, user.id);
              } catch (analyticsError) {
                console.warn('Erro ao registrar analytics (não crítico):', analyticsError);
              }
            }
          }
        },
        {
          onError: (error) => {
            // Reverter mudanças na UI em caso de erro
            setNotifications(prev => 
              prev.map(n => ({ ...n, read: n.read }))
            );
            setUnreadCount(unreadNotifications.length);
            showError('Erro ao marcar todas como lidas. Verifique sua conexão.');
          }
        }
      );
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      // Primeiro, otimisticamente remove da UI
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      const wasUnread = notificationToDelete && !notificationToDelete.read;
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Tentar deletar no servidor com retry
      await executeWithRetry(
        async () => {
          const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

          if (error) throw error;
        },
        {
          onError: (error) => {
            // Reverter mudanças na UI em caso de erro
            if (notificationToDelete) {
              setNotifications(prev => [...prev, notificationToDelete].sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
              ));
              if (wasUnread) {
                setUnreadCount(prev => prev + 1);
              }
            }
            showError('Erro ao deletar notificação. Verifique sua conexão.');
          }
        }
      );
      
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Registrar analytics de clique na notificação com retry
      if (user) {
        await executeWithRetry(
          async () => {
            await analyticsService.markNotificationAsClicked(notification.id, user.id);
          },
          {
            onError: (error) => {
              console.warn('Erro ao registrar analytics de clique (não crítico):', error);
            }
          }
        );
      }

      // Se a notificação tem uma URL de ação, navegar para ela
      if (notification.data?.action_url) {
        window.location.href = notification.data.action_url;
      }
    } catch (error) {
      console.error('Erro ao processar clique na notificação:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'training_required':
        return <BookOpen className="w-4 h-4 text-orange-500" />;
      case 'training_reminder':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'training_new':
        return <BookOpen className="w-4 h-4 text-green-500" />;
      case 'news':
        return <Newspaper className="w-4 h-4 text-purple-500" />;
      case 'system':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'custom_reminder':
        return <Bell className="w-4 h-4 text-indigo-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'training_required':
        return 'border-l-orange-500 bg-orange-50';
      case 'training_reminder':
        return 'border-l-blue-500 bg-blue-50';
      case 'training_new':
        return 'border-l-green-500 bg-green-50';
      case 'news':
        return 'border-l-purple-500 bg-purple-50';
      case 'system':
        return 'border-l-red-500 bg-red-50';
      case 'custom_reminder':
        return 'border-l-indigo-500 bg-indigo-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Botão do Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-red-600 transition-colors duration-200"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de Notificações */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Painel de Notificações */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-500 to-red-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-white" />
                  <h3 className="text-white font-semibold">Notificações</h3>
                  {unreadCount > 0 && (
                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                      {unreadCount} não lidas
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="text-white/80 hover:text-white transition-colors"
                    title="Configurações"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-white/80 hover:text-white text-sm transition-colors"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Notificações */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Carregando...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 transition-all duration-200 hover:bg-gray-50 cursor-pointer ${
                      notification.read ? 'opacity-60' : 'bg-white'
                    } ${getNotificationColor(notification.type)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium ${
                              notification.read ? 'text-gray-600' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </h4>
                            <p className={`text-sm mt-1 ${
                              notification.read ? 'text-gray-500' : 'text-gray-700'
                            }`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                title="Marcar como lida"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              disabled={isRetrying}
                              className={`p-1 text-gray-400 hover:text-red-600 transition-colors ${
                                isRetrying ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title={isRetrying ? "Deletando..." : "Excluir"}
                            >
                              <X className={`w-4 h-4 ${isRetrying ? 'animate-pulse' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button className="w-full text-center text-sm text-red-600 hover:text-red-700 font-medium transition-colors">
                Ver todas as notificações
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal de Configurações */}
      <NotificationSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
};

export default NotificationBadge;
