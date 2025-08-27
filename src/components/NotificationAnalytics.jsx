import React, { useState, useEffect } from 'react';
import { Eye, Users, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
import analyticsService from '../services/analyticsService';

const NotificationAnalytics = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getAllNotificationsWithAnalytics(50);
      setNotifications(data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'training_required':
        return <CheckCircle className="w-4 h-4 text-orange-500" />;
      case 'training_reminder':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'system':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      case 'custom_reminder':
        return <Clock className="w-4 h-4 text-purple-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Carregando analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics de Notificações</h2>
        <button
          onClick={loadNotifications}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Atualizar
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma notificação encontrada</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getNotificationIcon(notification.type)}
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      notification.read ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {notification.read ? 'Lida' : 'Não lida'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{notification.message}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{formatDate(notification.created_at)}</span>
                    <span className="capitalize">{notification.type}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Estatísticas */}
                  <div className="text-center">
                    <div className="flex items-center space-x-1 text-green-600">
                      <Eye className="w-4 h-4" />
                      <span className="font-semibold">{notification.analytics.read.length}</span>
                    </div>
                    <p className="text-xs text-gray-500">Lidas</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center space-x-1 text-blue-600">
                      <Users className="w-4 h-4" />
                      <span className="font-semibold">{notification.analytics.clicked.length}</span>
                    </div>
                    <p className="text-xs text-gray-500">Clicadas</p>
                  </div>

                  <button
                    onClick={() => setSelectedNotification(notification)}
                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getNotificationIcon(selectedNotification.type)}
                  <h2 className="text-xl font-bold text-white">Detalhes da Notificação</h2>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedNotification.title}
                </h3>
                <p className="text-gray-600 mb-4">{selectedNotification.message}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Enviada em: {formatDate(selectedNotification.created_at)}</span>
                  <span className="capitalize">Tipo: {selectedNotification.type}</span>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">Lidas</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {selectedNotification.analytics.read.length}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Clicadas</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {selectedNotification.analytics.clicked.length}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-600 mt-1">
                    {selectedNotification.analytics.total}
                  </p>
                </div>
              </div>

              {/* Lista de usuários que leram */}
              {selectedNotification.analytics.read.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">
                    Quem Leu ({selectedNotification.analytics.read.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedNotification.analytics.read.map((interaction, index) => (
                      <div key={index} className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold text-sm">
                              {interaction.usuarios?.nome?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {interaction.usuarios?.nome || 'Usuário'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {interaction.usuarios?.email || 'Email não disponível'}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(interaction.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de usuários que clicaram */}
              {selectedNotification.analytics.clicked.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">
                    Quem Clicou ({selectedNotification.analytics.clicked.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedNotification.analytics.clicked.map((interaction, index) => (
                      <div key={index} className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {interaction.usuarios?.nome?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {interaction.usuarios?.nome || 'Usuário'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {interaction.usuarios?.email || 'Email não disponível'}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(interaction.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationAnalytics;
