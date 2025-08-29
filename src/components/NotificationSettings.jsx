import React, { useState, useEffect } from 'react';
import { X, Bell, Mail, Smartphone, Clock, Settings, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import notificationService from '../services/notificationService';

const NotificationSettings = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    training_reminders: true,
    system_notifications: true,
    reminder_frequency: 'daily',
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(Notification.permission);

  useEffect(() => {
    if (isOpen && user) {
      loadSettings();
      checkNotificationPermission();
    }
  }, [isOpen, user]);

  const loadSettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setSettings({
          email_notifications: data.email_notifications,
          push_notifications: data.push_notifications,
          training_reminders: data.training_reminders,
          system_notifications: data.system_notifications,
          reminder_frequency: data.reminder_frequency,
          quiet_hours_start: data.quiet_hours_start,
          quiet_hours_end: data.quiet_hours_end
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkNotificationPermission = () => {
    setPermissionStatus(Notification.permission);
  };

  const requestNotificationPermission = async () => {
    try {
      const granted = await notificationService.requestNotificationPermission();
      setPermissionStatus(Notification.permission);
      return granted;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Sempre salvar com todas as configurações ativadas (exceto as que o usuário controla)
      const settingsToSave = {
        user_id: user.id,
        email_notifications: true,        // Sempre ativo
        push_notifications: settings.push_notifications, // Controlado pelo usuário
        training_reminders: true,         // Sempre ativo
        system_notifications: true,       // Sempre ativo
        reminder_frequency: 'daily',      // Padrão
        quiet_hours_start: '22:00',       // Padrão
        quiet_hours_end: '08:00'          // Padrão
      };

      const { error } = await supabase
        .from('notification_settings')
        .upsert(settingsToSave);

      if (error) throw error;

      alert('Configurações salvas com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    if (permissionStatus !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('Permissão para notificações foi negada');
        return;
      }
    }

    notificationService.sendBrowserNotification('Teste de Notificação', {
      body: 'Esta é uma notificação de teste do Suporte Field',
      icon: '/logo.jpeg'
    });
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-500 to-red-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Configurações de Notificações</h2>
                <p className="text-red-100 text-sm">Personalize como você recebe notificações</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status da Permissão */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">Notificações do Navegador</h3>
                      <p className="text-sm text-gray-600">
                        Status: {permissionStatus === 'granted' ? 'Permitido' : 
                                permissionStatus === 'denied' ? 'Negado' : 'Não solicitado'}
                      </p>
                    </div>
                  </div>
                  {permissionStatus !== 'granted' && (
                    <button
                      onClick={requestNotificationPermission}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Solicitar Permissão
                    </button>
                  )}
                </div>
              </div>

              {/* Informação sobre configurações automáticas */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Settings className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-900">Configurações Automáticas</h4>
                    <p className="text-sm text-green-700">
                      Suas outras preferências de notificação estão ativadas automaticamente e funcionando em segundo plano.
                    </p>
                  </div>
                </div>
              </div>

              {/* Teste de Notificação */}
              {permissionStatus === 'granted' && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">Teste de Notificação</h4>
                      <p className="text-sm text-blue-700">Teste se as notificações estão funcionando</p>
                    </div>
                    <button
                      onClick={handleTestNotification}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Enviar Teste
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
