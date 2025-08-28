import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  MessageCircle, 
  Heart, 
  BookOpen, 
  Award, 
  Calendar,
  Star,
  TrendingUp,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  Activity
} from 'lucide-react';

const UserProfile = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      loadProfileData();
    }
  }, [isOpen, user]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      // Importar o serviço dinamicamente
      const { profileService } = await import('../services/profileService');
      
      const [profile, userFeedbacks, userActivities] = await Promise.all([
        profileService.getUserProfile(user.id),
        profileService.getUserFeedbacks(user.id),
        profileService.getUserActivities(user.id, 20)
      ]);

      setProfileData(profile);
      setFeedbacks(userFeedbacks);
      setActivities(userActivities);
    } catch (error) {
      console.error('Erro ao carregar dados do perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackResponse = async (feedbackId, tipoResposta, motivo = null) => {
    try {
      const { profileService } = await import('../services/profileService');
      const result = await profileService.respondToFeedback(feedbackId, user.id, tipoResposta, motivo);
      
      if (result.success) {
        // Recarregar feedbacks
        const updatedFeedbacks = await profileService.getUserFeedbacks(user.id);
        setFeedbacks(updatedFeedbacks);
      }
    } catch (error) {
      console.error('Erro ao responder feedback:', error);
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

  const getActivityIcon = (tipo) => {
    switch (tipo) {
      case 'comentario_treinamento':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'curtida_treinamento':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'questionario_concluido':
        return <BookOpen className="w-4 h-4 text-green-500" />;
      case 'resposta_feedback':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user?.nome}</h2>
                <p className="text-blue-100">{user?.cargo || 'Colaborador'}</p>
                <p className="text-sm text-blue-200">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Visão Geral', icon: TrendingUp },
              { id: 'feedbacks', label: 'Meus Feedbacks', icon: MessageSquare },
              { id: 'activities', label: 'Atividades', icon: Activity }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Carregando...</span>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && profileData && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-700">{profileData.total_comentarios}</div>
                      <div className="text-sm text-blue-600">Comentários</div>
                    </div>
                    
                    <div className="bg-red-50 rounded-xl p-4 text-center">
                      <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-red-700">{profileData.total_curtidas}</div>
                      <div className="text-sm text-red-600">Curtidas</div>
                    </div>
                    
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-700">{profileData.total_questionarios}</div>
                      <div className="text-sm text-green-600">Questionários</div>
                    </div>
                    
                    <div className="bg-yellow-50 rounded-xl p-4 text-center">
                      <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                      <div className={`text-2xl font-bold ${getScoreColor(profileData.media_notas_questionarios)}`}>
                        {profileData.media_notas_questionarios?.toFixed(1) || '0.0'}%
                      </div>
                      <div className="text-sm text-yellow-600">Média</div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Informações
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-500">Cadastro:</span>
                          <span className="ml-2 text-gray-900">{formatDate(profileData.data_cadastro)}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Último acesso:</span>
                          <span className="ml-2 text-gray-900">
                            {profileData.ultimo_acesso ? formatDate(profileData.ultimo_acesso) : 'Nunca'}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Feedbacks recebidos:</span>
                          <span className="ml-2 text-gray-900">{profileData.total_feedbacks_recebidos}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Award className="w-5 h-5 mr-2" />
                        Engajamento
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Feedbacks - Concordo:</span>
                          <span className="text-green-600 font-medium">{profileData.feedbacks_que_concordo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Feedbacks - Discordo:</span>
                          <span className="text-red-600 font-medium">{profileData.feedbacks_que_discordo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Total de interações:</span>
                          <span className="text-blue-600 font-medium">
                            {profileData.total_comentarios + profileData.total_curtidas}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Feedbacks Tab */}
              {activeTab === 'feedbacks' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Feedbacks Recebidos</h3>
                  {feedbacks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum feedback visível ainda</p>
                    </div>
                  ) : (
                    feedbacks.map((feedback) => (
                      <FeedbackCard 
                        key={feedback.id}
                        feedback={feedback}
                        onResponse={handleFeedbackResponse}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Activities Tab */}
              {activeTab === 'activities' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Atividades Recentes</h3>
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma atividade registrada</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                          {getActivityIcon(activity.tipo)}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.descricao}</p>
                            <p className="text-sm text-gray-600">{activity.item_titulo}</p>
                            <p className="text-xs text-gray-500">{formatDate(activity.data)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para cartão de feedback
const FeedbackCard = ({ feedback, onResponse }) => {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseType, setResponseType] = useState('');
  const [motivo, setMotivo] = useState('');

  const handleSubmitResponse = () => {
    onResponse(feedback.id, responseType, responseType === 'discordo' ? motivo : null);
    setShowResponseForm(false);
    setMotivo('');
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: `${feedback.categoria_cor}20`,
                color: feedback.categoria_cor 
              }}
            >
              {feedback.categoria}
            </span>
            <span className="text-sm text-gray-500">por {feedback.autor_nome}</span>
          </div>
          <p className="text-gray-900">{feedback.feedback}</p>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(feedback.data_feedback).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Resposta existente ou formulário */}
      {feedback.tipo_resposta ? (
        <div className={`p-3 rounded-lg ${
          feedback.tipo_resposta === 'concordo' ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {feedback.tipo_resposta === 'concordo' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              feedback.tipo_resposta === 'concordo' ? 'text-green-700' : 'text-red-700'
            }`}>
              {feedback.tipo_resposta === 'concordo' ? 'Você concordou' : 'Você discordou'}
            </span>
          </div>
          {feedback.motivo_discordancia && (
            <p className="text-sm text-gray-700">{feedback.motivo_discordancia}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Respondido em {new Date(feedback.data_resposta).toLocaleDateString('pt-BR')}
          </p>
        </div>
      ) : (
        <div className="border-t pt-4">
          {!showResponseForm ? (
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setResponseType('concordo');
                  setShowResponseForm(true);
                }}
                className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Concordo</span>
              </button>
              <button
                onClick={() => {
                  setResponseType('discordo');
                  setShowResponseForm(true);
                }}
                className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Discordo</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                {responseType === 'concordo' ? 'Confirmar concordância' : 'Por que você discorda?'}
              </p>
              {responseType === 'discordo' && (
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Explique o motivo da sua discordância..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                  maxLength={500}
                />
              )}
              <div className="flex space-x-2">
                <button
                  onClick={handleSubmitResponse}
                  disabled={responseType === 'discordo' && !motivo.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => {
                    setShowResponseForm(false);
                    setMotivo('');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
