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
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          ...settings
        });

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

              {/* Configurações de Notificação */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Tipos de Notificação</span>
                </h3>

                <div className="space-y-4">
                  {/* Notificações por Email */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Notificações por Email</h4>
                        <p className="text-sm text-gray-600">Receber notificações por email</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.email_notifications}
                        onChange={(e) => handleChange('email_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>

                  {/* Notificações Push */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-5 h-5 text-gray-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Notificações Push</h4>
                        <p className="text-sm text-gray-600">Receber notificações no navegador</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.push_notifications}
                        onChange={(e) => handleChange('push_notifications', e.target.checked)}
                        className="sr-only peer"
                        disabled={permissionStatus !== 'granted'}
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 ${permissionStatus !== 'granted' ? 'opacity-50' : ''}`}></div>
                    </label>
                  </div>

                  {/* Lembretes de Treinamento */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-gray-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Lembretes de Treinamento</h4>
                        <p className="text-sm text-gray-600">Lembretes sobre treinamentos pendentes</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.training_reminders}
                        onChange={(e) => handleChange('training_reminders', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>

                  {/* Notificações do Sistema */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Settings className="w-5 h-5 text-gray-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Notificações do Sistema</h4>
                        <p className="text-sm text-gray-600">Atualizações e manutenções do sistema</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.system_notifications}
                        onChange={(e) => handleChange('system_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Configurações Avançadas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Configurações Avançadas</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Frequência de Lembretes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequência de Lembretes
                    </label>
                    <select
                      value={settings.reminder_frequency}
                      onChange={(e) => handleChange('reminder_frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="daily">Diário</option>
                      <option value="weekly">Semanal</option>
                      <option value="never">Nunca</option>
                    </select>
                  </div>

                  {/* Horário Silencioso - Início */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Início do Horário Silencioso
                    </label>
                    <input
                      type="time"
                      value={settings.quiet_hours_start}
                      onChange={(e) => handleChange('quiet_hours_start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  {/* Horário Silencioso - Fim */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fim do Horário Silencioso
                    </label>
                    <input
                      type="time"
                      value={settings.quiet_hours_end}
                      onChange={(e) => handleChange('quiet_hours_end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
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
