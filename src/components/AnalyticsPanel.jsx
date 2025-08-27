import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle, 
  CheckCircle, 
  Download,
  TrendingUp,
  Calendar,
  Filter,
  RefreshCw,
  Bell
} from 'lucide-react';
import analyticsService from '../services/analyticsService';
import NotificationAnalytics from './NotificationAnalytics';

const AnalyticsPanel = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [topNoticias, setTopNoticias] = useState([]);
  const [topTreinamentos, setTopTreinamentos] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemAnalytics, setItemAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30'); // dias

  useEffect(() => {
    if (isOpen) {
      loadAnalytics();
    }
  }, [isOpen, dateRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [summary, noticias, treinamentos] = await Promise.all([
        analyticsService.getAnalyticsSummary(),
        analyticsService.getTopNoticiasByEngagement(10),
        analyticsService.getTopTreinamentosByEngagement(10)
      ]);

      setAnalytics(summary);
      setTopNoticias(noticias);
      setTopTreinamentos(treinamentos);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadItemAnalytics = async (type, itemId) => {
    setIsLoading(true);
    try {
      let data;
      if (type === 'noticia') {
        data = await analyticsService.getNoticiaAnalytics(itemId);
      } else if (type === 'treinamento') {
        data = await analyticsService.getTreinamentoAnalytics(itemId);
      } else if (type === 'notification') {
        data = await analyticsService.getNotificationAnalytics(itemId);
      }

      setItemAnalytics(data);
      setSelectedItem({ type, id: itemId });
    } catch (error) {
      console.error('Erro ao carregar analytics do item:', error);
    } finally {
      setIsLoading(false);
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

  const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const EngagementCard = ({ item, type, onClick }) => (
    <div 
      className="bg-white rounded-lg p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onClick(type, item[type]?.id)}
    >
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {item[type]?.titulo}
      </h3>
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            {item.views}
          </span>
          <span className="flex items-center">
            <Heart className="w-4 h-4 mr-1" />
            {item.likes}
          </span>
          <span className="flex items-center">
            <MessageCircle className="w-4 h-4 mr-1" />
            {item.comments}
          </span>
          {type === 'treinamento' && (
            <span className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              {item.completed}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {formatDate(item[type]?.created_at)}
        </span>
      </div>
    </div>
  );

  const UserInteractionList = ({ interactions, actionType }) => (
    <div className="space-y-3">
      {interactions.map((interaction, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {interaction.usuarios?.nome?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {interaction.usuarios?.nome || 'Usuário'}
              </p>
              <p className="text-sm text-gray-500">
                {interaction.usuarios?.email}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {actionType === 'read' ? 'Leu' : 
               actionType === 'liked' ? 'Curtiu' : 
               actionType === 'commented' ? 'Comentou' : 
               actionType === 'viewed' ? 'Visualizou' : 
               actionType === 'completed' ? 'Concluiu' : actionType}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(interaction.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Painel de Analytics</h2>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-1 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>
              <button
                onClick={loadAnalytics}
                disabled={isLoading}
                className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Visão Geral', icon: TrendingUp },
            { id: 'noticias', label: 'Notícias', icon: MessageCircle },
            { id: 'treinamentos', label: 'Treinamentos', icon: CheckCircle },
            { id: 'notifications', label: 'Notificações', icon: Eye }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Carregando analytics...</span>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && analytics && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Resumo dos Últimos {dateRange} Dias</h3>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      title="Notificações Lidas"
                      value={analytics.notifications.read}
                      icon={Eye}
                      color="blue"
                      subtitle={`${analytics.notifications.clicked} clicadas`}
                    />
                    <StatCard
                      title="Visualizações de Notícias"
                      value={analytics.noticias.viewed}
                      icon={Eye}
                      color="green"
                      subtitle={`${analytics.noticias.liked} curtidas`}
                    />
                    <StatCard
                      title="Visualizações de Treinamentos"
                      value={analytics.treinamentos.viewed}
                      icon={CheckCircle}
                      color="purple"
                      subtitle={`${analytics.treinamentos.completed} concluídos`}
                    />
                    <StatCard
                      title="Total de Interações"
                      value={analytics.noticias.total + analytics.treinamentos.total + analytics.notifications.total}
                      icon={TrendingUp}
                      color="orange"
                      subtitle="Todas as ações"
                    />
                  </div>

                  {/* Top Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Top Notícias por Engajamento</h4>
                      <div className="space-y-3">
                        {topNoticias.slice(0, 5).map((item, index) => (
                          <EngagementCard
                            key={index}
                            item={item}
                            type="noticia"
                            onClick={loadItemAnalytics}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Top Treinamentos por Engajamento</h4>
                      <div className="space-y-3">
                        {topTreinamentos.slice(0, 5).map((item, index) => (
                          <EngagementCard
                            key={index}
                            item={item}
                            type="treinamento"
                            onClick={loadItemAnalytics}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'noticias' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Analytics de Notícias</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topNoticias.map((item, index) => (
                      <EngagementCard
                        key={index}
                        item={item}
                        type="noticia"
                        onClick={loadItemAnalytics}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'treinamentos' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Analytics de Treinamentos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topTreinamentos.map((item, index) => (
                      <EngagementCard
                        key={index}
                        item={item}
                        type="treinamento"
                        onClick={loadItemAnalytics}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <NotificationAnalytics />
              )}
            </>
          )}
        </div>

        {/* Item Details Modal */}
        {selectedItem && itemAnalytics && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-500 to-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">
                    Analytics Detalhados - {selectedItem.type === 'noticia' ? 'Notícia' : 
                                           selectedItem.type === 'treinamento' ? 'Treinamento' : 'Notificação'}
                  </h3>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {Object.entries(itemAnalytics).filter(([key]) => key !== 'total').map(([action, interactions]) => (
                    <div key={action} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 capitalize mb-2">
                        {action === 'viewed' ? 'Visualizações' :
                         action === 'liked' ? 'Curtidas' :
                         action === 'commented' ? 'Comentários' :
                         action === 'completed' ? 'Conclusões' :
                         action === 'read' ? 'Leituras' :
                         action === 'clicked' ? 'Cliques' : action}
                      </h4>
                      <p className="text-2xl font-bold text-blue-600">{interactions.length}</p>
                    </div>
                  ))}
                </div>

                {Object.entries(itemAnalytics).filter(([key, value]) => key !== 'total' && value.length > 0).map(([action, interactions]) => (
                  <div key={action} className="mb-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-3 capitalize">
                      {action === 'viewed' ? 'Quem Visualizou' :
                       action === 'liked' ? 'Quem Curtiu' :
                       action === 'commented' ? 'Quem Comentou' :
                       action === 'completed' ? 'Quem Concluiu' :
                       action === 'read' ? 'Quem Leu' :
                       action === 'clicked' ? 'Quem Clicou' : action} ({interactions.length})
                    </h4>
                    <UserInteractionList interactions={interactions} actionType={action} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPanel;
