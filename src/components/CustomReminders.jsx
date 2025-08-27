import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Bell, Edit, Trash2, Repeat } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import notificationService from '../services/notificationService';

const CustomReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    scheduled_for: '',
    repeat_interval: '',
    action_url: '',
    priority: 'medium'
  });

  useEffect(() => {
    if (user) {
      loadReminders();
      // Verificar lembretes personalizados que devem gerar notificações
      checkCustomReminders();
    }
  }, [user]);

  const checkCustomReminders = async () => {
    if (!user) return;
    
    try {
      await notificationService.checkCustomReminders(user.id);
    } catch (error) {
      console.error('Erro ao verificar lembretes personalizados:', error);
    }
  };

  const loadReminders = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Erro ao carregar lembretes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const reminderData = {
        ...formData,
        user_id: user.id,
        scheduled_for: new Date(formData.scheduled_for).toISOString()
      };

      if (editingReminder) {
        // Atualizar lembrete existente
        const { error } = await supabase
          .from('custom_reminders')
          .update(reminderData)
          .eq('id', editingReminder.id);

        if (error) throw error;
      } else {
        // Criar novo lembrete
        const { error } = await supabase
          .from('custom_reminders')
          .insert([reminderData]);

        if (error) throw error;
      }

      // Limpar formulário e recarregar
      setFormData({
        title: '',
        message: '',
        scheduled_for: '',
        repeat_interval: '',
        action_url: '',
        priority: 'medium'
      });
      setShowForm(false);
      setEditingReminder(null);
      await loadReminders();
      
      // Verificar se o lembrete deve gerar notificação imediatamente
      if (!editingReminder) {
        const scheduledDate = new Date(formData.scheduled_for);
        const now = new Date();
        
        // Se o lembrete é para agora ou no passado, criar notificação imediatamente
        if (scheduledDate <= now) {
          try {
            await notificationService.checkCustomReminders(user.id);
          } catch (error) {
            console.error('Erro ao verificar lembretes personalizados:', error);
          }
        }
      }
      
      alert(editingReminder ? 'Lembrete atualizado com sucesso!' : 'Lembrete criado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar lembrete:', error);
      alert('Erro ao salvar lembrete');
    }
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      message: reminder.message,
      scheduled_for: new Date(reminder.scheduled_for).toISOString().slice(0, 16),
      repeat_interval: reminder.repeat_interval || '',
      action_url: reminder.action_url || '',
      priority: reminder.priority
    });
    setShowForm(true);
  };

  const handleDelete = async (reminderId) => {
    if (!confirm('Tem certeza que deseja excluir este lembrete?')) return;

    try {
      const { error } = await supabase
        .from('custom_reminders')
        .update({ active: false })
        .eq('id', reminderId);

      if (error) throw error;
      await loadReminders();
      alert('Lembrete excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir lembrete:', error);
      alert('Erro ao excluir lembrete');
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-orange-600 bg-orange-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRepeatLabel = (interval) => {
    switch (interval) {
      case 'daily':
        return 'Diário';
      case 'weekly':
        return 'Semanal';
      case 'monthly':
        return 'Mensal';
      case 'yearly':
        return 'Anual';
      default:
        return 'Único';
    }
  };

  const isOverdue = (scheduledFor) => {
    return new Date(scheduledFor) < new Date();
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Lembretes Personalizados</h3>
            <p className="text-sm text-gray-600">Crie lembretes personalizados para suas tarefas</p>
          </div>
        </div>
        
        <button
          onClick={() => {
            setShowForm(true);
            setEditingReminder(null);
            setFormData({
              title: '',
              message: '',
              scheduled_for: '',
              repeat_interval: '',
              action_url: '',
              priority: 'medium'
            });
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Lembrete</span>
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            {editingReminder ? 'Editar Lembrete' : 'Novo Lembrete'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Reunião importante"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem *
              </label>
              <textarea
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="3"
                placeholder="Descrição do lembrete..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data e Hora *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduled_for}
                  onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repetir
                </label>
                <select
                  value={formData.repeat_interval}
                  onChange={(e) => setFormData({ ...formData, repeat_interval: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Não repetir</option>
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de Ação (opcional)
              </label>
              <input
                type="url"
                value={formData.action_url}
                onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://exemplo.com"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {editingReminder ? 'Atualizar' : 'Criar'} Lembrete
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingReminder(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Lembretes */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum lembrete criado</h4>
          <p className="text-gray-600">Crie seu primeiro lembrete personalizado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                isOverdue(reminder.scheduled_for) 
                  ? 'border-red-200 bg-red-50' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{reminder.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(reminder.priority)}`}>
                      {reminder.priority === 'high' ? 'Alta' : 
                       reminder.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                    {isOverdue(reminder.scheduled_for) && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                        Atrasado
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{reminder.message}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDateTime(reminder.scheduled_for)}</span>
                    </div>
                    
                    {reminder.repeat_interval && (
                      <div className="flex items-center space-x-1">
                        <Repeat className="w-3 h-3" />
                        <span>{getRepeatLabel(reminder.repeat_interval)}</span>
                      </div>
                    )}
                    
                    {reminder.action_url && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Com ação</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(reminder)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(reminder.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomReminders;
