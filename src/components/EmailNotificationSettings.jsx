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
    emailEnabled: true,
    frequency: 'immediate',
    types: []
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
      setPreferences(userPreferences);
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
      showToast('Erro ao carregar preferências de email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    try {
      setSaving(true);
      const result = await notificationService.updateEmailPreferences(user.id, preferences);
      
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

  const handleTypeToggle = (typeId) => {
    setPreferences(prev => ({
      ...prev,
      types: prev.types.includes(typeId)
        ? prev.types.filter(id => id !== typeId)
        : [...prev.types, typeId]
    }));
  };

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

        {/* Toggle principal */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Receber notificações por email</Label>
            <p className="text-sm text-muted-foreground">
              Ativar ou desativar todas as notificações por email
            </p>
          </div>
          <Switch
            checked={preferences.emailEnabled}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, emailEnabled: checked }))
            }
            disabled={!isEmailServiceEnabled}
          />
        </div>

        {preferences.emailEnabled && isEmailServiceEnabled && (
          <>
            {/* Frequência */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Frequência de envio
              </Label>
              <Select
                value={preferences.frequency}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, frequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipos de notificação */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Tipos de notificação
              </Label>
              <div className="space-y-3">
                {notificationTypes.map(type => (
                  <div key={type.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={type.id}
                      checked={preferences.types.includes(type.id)}
                      onCheckedChange={() => handleTypeToggle(type.id)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={type.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <span>{type.icon}</span>
                        {type.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
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
