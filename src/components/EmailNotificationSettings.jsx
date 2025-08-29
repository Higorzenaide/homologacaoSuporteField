import React, { useState, useEffect } from 'react';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import notificationService from '../services/notificationService';
import emailService from '../services/emailService';
import { Mail, Settings, Bell, Clock } from 'lucide-react';

export default function EmailNotificationSettings() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  
  const [preferences, setPreferences] = useState({
    emailEnabled: true,        // Sempre TRUE
    frequency: 'immediate',    // Sempre IMEDIATO
    types: ['training_required', 'training_reminder', 'training_new', 'news', 'system', 'feedback'] // Sempre TODOS ATIVADOS
  });

  const notificationTypes = [
    { 
      id: 'training_required', 
      label: 'Treinamentos Obrigatórios', 
      description: 'Quando um novo treinamento obrigatório for criado',
      icon: '🎓'
    },
    { 
      id: 'training_reminder', 
      label: 'Lembretes de Treinamento', 
      description: 'Lembretes de treinamentos pendentes ou próximos do vencimento',
      icon: '⏰'
    },
    { 
      id: 'training_new', 
      label: 'Novos Treinamentos', 
      description: 'Quando novos treinamentos (não obrigatórios) forem disponibilizados',
      icon: '📚'
    },
    { 
      id: 'news', 
      label: 'Notícias', 
      description: 'Quando novas notícias forem publicadas',
      icon: '📰'
    },
    { 
      id: 'system', 
      label: 'Sistema', 
      description: 'Notificações importantes do sistema',
      icon: '⚙️'
    },
    { 
      id: 'feedback', 
      label: 'Feedbacks', 
      description: 'Quando você receber novos feedbacks',
      icon: '📝'
    }
  ];

  const frequencyOptions = [
    { value: 'immediate', label: 'Imediato', description: 'Receber emails assim que as notificações forem criadas' },
    { value: 'daily', label: 'Diário', description: 'Receber um resumo diário das notificações' },
    { value: 'weekly', label: 'Semanal', description: 'Receber um resumo semanal das notificações' }
  ];

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const userPreferences = await notificationService.getUserEmailPreferences(user.id);
      
      // Sempre garantir que email está ativado, frequência é imediata e todos os tipos estão ativados
      const allTypes = notificationTypes.map(type => type.id);
      setPreferences({
        ...userPreferences,
        emailEnabled: true,        // Sempre TRUE
        frequency: 'immediate',    // Sempre IMEDIATO
        types: allTypes           // Sempre TODOS OS TIPOS ATIVADOS
      });
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
      showError('Erro ao carregar preferências de email');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    try {
      setSaving(true);
      
      // Sempre salvar com email ativado, frequência imediata e todos os tipos
      const allTypes = notificationTypes.map(type => type.id);
      const preferencesToSave = {
        ...preferences,
        emailEnabled: true,        // Sempre TRUE
        frequency: 'immediate',    // Sempre IMEDIATO
        types: allTypes           // Sempre TODOS OS TIPOS ATIVADOS
      };
      
      const result = await notificationService.updateEmailPreferences(user.id, preferencesToSave);
      
      if (result.success) {
        showSuccess('Preferências salvas com sucesso!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      showError('Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  };

  // Função removida - tipos sempre ativados

  const isEmailServiceEnabled = emailService.isEmailEnabled();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notificações por Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Notificações por Email
        </CardTitle>
        <CardDescription>
          Configure como e quando você quer receber notificações por email
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!isEmailServiceEnabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Settings className="h-4 w-4" />
              <span className="font-medium">Serviço de Email Não Configurado</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              O serviço de email não está configurado. Entre em contato com o administrador 
              para configurar as credenciais do Gmail SMTP.
            </p>
          </div>
        )}

        {/* Informação sobre configurações automáticas */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-green-900">Emails Ativados Automaticamente</h4>
              <p className="text-sm text-green-700">
                Você receberá notificações por email imediatamente quando criadas. 
                Configure abaixo quais tipos deseja receber.
              </p>
            </div>
          </div>
        </div>

        {isEmailServiceEnabled && (
          <>
            {/* Tipos de notificação - Sempre Ativados */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Tipos de notificação ativados
              </Label>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-blue-700">
                  ✅ Todos os tipos de notificação estão ativados automaticamente para garantir que você não perca informações importantes.
                </p>
              </div>
              <div className="space-y-3">
                {notificationTypes.map(type => (
                  <div key={type.id} className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-5 h-5 bg-green-500 rounded-sm flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="grid gap-1.5 leading-none flex-1">
                      <div className="text-sm font-medium leading-none flex items-center gap-2 text-green-800">
                        <span>{type.icon}</span>
                        {type.label}
                        <span className="ml-auto bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                          Ativo
                        </span>
                      </div>
                      <p className="text-xs text-green-600">
                        {type.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={loadPreferences} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !isEmailServiceEnabled}>
            {saving ? 'Salvando...' : 'Salvar Preferências'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
