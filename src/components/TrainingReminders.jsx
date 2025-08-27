import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, BookOpen, Calendar, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import notificationService from '../services/notificationService';

const TrainingReminders = () => {
  const { user } = useAuth();
  const [pendingTrainings, setPendingTrainings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (user) {
      loadPendingTrainings();
    }
  }, [user]);

  const loadPendingTrainings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const trainings = await notificationService.getPendingTrainings(user.id);
      setPendingTrainings(trainings);
    } catch (error) {
      console.error('Erro ao carregar treinamentos pendentes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrainingStatus = (training) => {
    if (!training.prazo_limite) {
      return { type: 'pending', label: 'Pendente', color: 'blue' };
    }

    const now = new Date();
    const deadline = new Date(training.prazo_limite);
    const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    if (daysUntilDeadline < 0) {
      return { type: 'overdue', label: 'Atrasado', color: 'red' };
    } else if (daysUntilDeadline <= 3) {
      return { type: 'due_soon', label: 'Prazo próximo', color: 'orange' };
    } else {
      return { type: 'pending', label: 'Pendente', color: 'blue' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status.type) {
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'due_soon':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status.color) {
      case 'red':
        return 'border-l-red-500 bg-red-50';
      case 'orange':
        return 'border-l-orange-500 bg-orange-50';
      case 'blue':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'Sem prazo definido';
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilDeadline < 0) {
      return `Atrasado há ${Math.abs(daysUntilDeadline)} dias`;
    } else if (daysUntilDeadline === 0) {
      return 'Vence hoje';
    } else if (daysUntilDeadline === 1) {
      return 'Vence amanhã';
    } else {
      return `Vence em ${daysUntilDeadline} dias`;
    }
  };

  const createReminder = async (training) => {
    try {
      const status = getTrainingStatus(training);
      await notificationService.notifyTrainingReminder(training, user.id, status.type);
      
      // Mostrar feedback
      alert('Lembrete criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar lembrete:', error);
      alert('Erro ao criar lembrete');
    }
  };

  const displayedTrainings = showAll ? pendingTrainings : pendingTrainings.slice(0, 3);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Treinamentos Pendentes</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (pendingTrainings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Treinamentos Pendentes</h3>
        </div>
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Parabéns!</h4>
          <p className="text-gray-600">Você completou todos os treinamentos obrigatórios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Treinamentos Pendentes</h3>
            <p className="text-sm text-gray-600">{pendingTrainings.length} treinamento(s) pendente(s)</p>
          </div>
        </div>
        
        {pendingTrainings.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            {showAll ? 'Ver menos' : `Ver todos (${pendingTrainings.length})`}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayedTrainings.map((training) => {
          const status = getTrainingStatus(training);
          
          return (
            <div
              key={training.id}
              className={`p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md ${getStatusColor(status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(status)}
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      status.color === 'red' ? 'bg-red-100 text-red-800' :
                      status.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {status.label}
                    </span>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-1">{training.titulo}</h4>
                  
                  {training.descricao && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {training.descricao}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDeadline(training.prazo_limite)}</span>
                    </div>
                    
                    {training.categoria && (
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        <span>{training.categoria}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => createReminder(training)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Criar lembrete"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                  
                  <a
                    href={`/treinamentos/${training.id}`}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Acessar
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pendingTrainings.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-800">
            <Bell className="w-4 h-4" />
            <span className="text-sm font-medium">
              Lembretes automáticos são enviados diariamente para treinamentos pendentes
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingReminders;
