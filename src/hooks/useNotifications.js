import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import notificationService from '../services/notificationService';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState(Notification.permission);

  // Carregar notificações
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const data = await notificationService.getUserNotifications(user.id);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Solicitar permissão para notificações
  const requestPermission = useCallback(async () => {
    try {
      const granted = await notificationService.requestNotificationPermission();
      setPermission(Notification.permission);
      return granted;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  }, []);

  // Marcar como lida
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }, [user]);

  // Deletar notificação
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  }, []);

  // Enviar notificação push
  const sendPushNotification = useCallback((title, options = {}) => {
    return notificationService.sendBrowserNotification(title, options);
  }, []);

  // Verificar lembretes de treinamentos
  const checkTrainingReminders = useCallback(async () => {
    if (!user) return;
    
    try {
      const reminderCount = await notificationService.checkAndCreateReminders(user.id);
      if (reminderCount > 0) {
        // Recarregar notificações para mostrar os novos lembretes
        await loadNotifications();
      }
      return reminderCount;
    } catch (error) {
      console.error('Erro ao verificar lembretes:', error);
      return 0;
    }
  }, [user, loadNotifications]);

  // Configurar notificações push
  const setupPushNotifications = useCallback(async () => {
    if (!user) return false;

    try {
      // Solicitar permissão se ainda não foi concedida
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      // Configurar service worker se disponível
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registrado:', registration);
        } catch (error) {
          console.log('Service Worker não disponível:', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao configurar push notifications:', error);
      return false;
    }
  }, [user, permission, requestPermission]);

  // Efeito para carregar notificações quando o usuário muda
  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, loadNotifications]);

  // Efeito para configurar push notifications
  useEffect(() => {
    if (user && permission === 'default') {
      setupPushNotifications();
    }
  }, [user, permission, setupPushNotifications]);

  // Efeito para verificar lembretes periodicamente
  useEffect(() => {
    if (!user) return;

    // Verificar lembretes imediatamente
    checkTrainingReminders();

    // Verificar lembretes a cada 30 minutos
    const interval = setInterval(checkTrainingReminders, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, checkTrainingReminders]);

  return {
    notifications,
    unreadCount,
    isLoading,
    permission,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendPushNotification,
    checkTrainingReminders,
    setupPushNotifications,
    requestPermission
  };
};

export default useNotifications;
