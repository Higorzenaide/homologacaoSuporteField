-- Sistema de Notificações
-- Criar tabela de notificações

CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'training_required', 'training_reminder', 'system', 'custom_reminder'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}', -- Dados adicionais como IDs, URLs, etc.
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver suas próprias notificações
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Política: usuários podem atualizar suas próprias notificações
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: usuários podem deletar suas próprias notificações
CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Política: sistema pode inserir notificações (via service role)
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Tabela para configurações de notificações do usuário
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    training_reminders BOOLEAN DEFAULT TRUE,
    system_notifications BOOLEAN DEFAULT TRUE,
    reminder_frequency VARCHAR(20) DEFAULT 'daily', -- 'daily', 'weekly', 'never'
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Índice para notification_settings
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- RLS para notification_settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver suas próprias configurações
CREATE POLICY "Users can view own notification settings" ON notification_settings
    FOR SELECT USING (auth.uid() = user_id);

-- Política: usuários podem atualizar suas próprias configurações
CREATE POLICY "Users can update own notification settings" ON notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: usuários podem inserir suas próprias configurações
CREATE POLICY "Users can insert own notification settings" ON notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_settings_updated_at();

-- Tabela para lembretes personalizados
CREATE TABLE IF NOT EXISTS custom_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    repeat_interval VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'yearly', null for one-time
    action_url VARCHAR(500),
    priority VARCHAR(20) DEFAULT 'medium',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para custom_reminders
CREATE INDEX IF NOT EXISTS idx_custom_reminders_user_id ON custom_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_reminders_scheduled_for ON custom_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_custom_reminders_active ON custom_reminders(active);

-- RLS para custom_reminders
ALTER TABLE custom_reminders ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver seus próprios lembretes
CREATE POLICY "Users can view own custom reminders" ON custom_reminders
    FOR SELECT USING (auth.uid() = user_id);

-- Política: usuários podem inserir seus próprios lembretes
CREATE POLICY "Users can insert own custom reminders" ON custom_reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem atualizar seus próprios lembretes
CREATE POLICY "Users can update own custom reminders" ON custom_reminders
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: usuários podem deletar seus próprios lembretes
CREATE POLICY "Users can delete own custom reminders" ON custom_reminders
    FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_custom_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_custom_reminders_updated_at
    BEFORE UPDATE ON custom_reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_reminders_updated_at();

-- Função para limpar notificações antigas (manter apenas últimas 100 por usuário)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications 
    WHERE id IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
            FROM notifications
        ) t 
        WHERE rn > 100
    );
END;
$$ LANGUAGE plpgsql;

-- Função para criar notificações de treinamento obrigatório
CREATE OR REPLACE FUNCTION notify_required_training()
RETURNS TRIGGER AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Se o treinamento é obrigatório e está ativo, notificar todos os usuários
    IF NEW.obrigatorio = true AND NEW.ativo = true THEN
        FOR user_record IN 
            SELECT id FROM auth.users 
            WHERE id NOT IN (
                SELECT DISTINCT usuario_id 
                FROM interacoes_treinamentos 
                WHERE treinamento_id = NEW.id 
                AND tipo_interacao = 'concluido'
            )
        LOOP
            INSERT INTO notifications (user_id, type, title, message, data, priority)
            VALUES (
                user_record.id,
                'training_required',
                'Novo Treinamento Obrigatório',
                'Foi adicionado um novo treinamento obrigatório: "' || NEW.titulo || '"',
                jsonb_build_object(
                    'training_id', NEW.id,
                    'training_title', NEW.titulo,
                    'action_url', '/treinamentos/' || NEW.id
                ),
                'high'
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar sobre novos treinamentos obrigatórios
CREATE TRIGGER trigger_notify_required_training
    AFTER INSERT ON treinamentos
    FOR EACH ROW
    EXECUTE FUNCTION notify_required_training();

-- Função para criar lembretes de treinamentos pendentes
CREATE OR REPLACE FUNCTION create_training_reminders()
RETURNS void AS $$
DECLARE
    training_record RECORD;
    user_record RECORD;
    reminder_type VARCHAR(20);
    days_until_deadline INTEGER;
BEGIN
    -- Buscar treinamentos obrigatórios ativos
    FOR training_record IN 
        SELECT t.*, 
               CASE 
                   WHEN t.prazo_limite IS NULL THEN NULL
                   ELSE EXTRACT(DAYS FROM (t.prazo_limite - NOW()))
               END as days_until_deadline
        FROM treinamentos t
        WHERE t.obrigatorio = true 
        AND t.ativo = true
    LOOP
        -- Buscar usuários que não completaram este treinamento
        FOR user_record IN 
            SELECT u.id 
            FROM auth.users u
            WHERE u.id NOT IN (
                SELECT DISTINCT it.usuario_id 
                FROM interacoes_treinamentos it
                WHERE it.treinamento_id = training_record.id 
                AND it.tipo_interacao = 'concluido'
            )
            AND u.id NOT IN (
                -- Não criar lembrete se já existe um nas últimas 24h
                SELECT DISTINCT n.user_id
                FROM notifications n
                WHERE n.type = 'training_reminder'
                AND n.data->>'training_id' = training_record.id::text
                AND n.created_at > NOW() - INTERVAL '24 hours'
            )
        LOOP
            -- Determinar tipo de lembrete
            IF training_record.days_until_deadline IS NULL THEN
                reminder_type := 'pending';
            ELSIF training_record.days_until_deadline < 0 THEN
                reminder_type := 'overdue';
            ELSIF training_record.days_until_deadline <= 3 THEN
                reminder_type := 'due_soon';
            ELSE
                reminder_type := 'pending';
            END IF;
            
            -- Criar notificação
            INSERT INTO notifications (user_id, type, title, message, data, priority)
            VALUES (
                user_record.id,
                'training_reminder',
                CASE reminder_type
                    WHEN 'overdue' THEN 'Treinamento Atrasado'
                    WHEN 'due_soon' THEN 'Prazo Próximo'
                    ELSE 'Treinamento Pendente'
                END,
                CASE reminder_type
                    WHEN 'overdue' THEN 'O prazo para completar "' || training_record.titulo || '" já passou'
                    WHEN 'due_soon' THEN 'O prazo para completar "' || training_record.titulo || '" está próximo'
                    ELSE 'Você ainda não completou o treinamento: "' || training_record.titulo || '"'
                END,
                jsonb_build_object(
                    'training_id', training_record.id,
                    'training_title', training_record.titulo,
                    'reminder_type', reminder_type,
                    'action_url', '/treinamentos/' || training_record.id
                ),
                CASE reminder_type
                    WHEN 'overdue' THEN 'high'
                    ELSE 'medium'
                END
            );
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comentários nas tabelas
COMMENT ON TABLE notifications IS 'Tabela para armazenar notificações dos usuários';
COMMENT ON TABLE notification_settings IS 'Configurações de notificações por usuário';
COMMENT ON TABLE custom_reminders IS 'Lembretes personalizados criados pelos usuários';

COMMENT ON COLUMN notifications.type IS 'Tipo da notificação: training_required, training_reminder, system, custom_reminder';
COMMENT ON COLUMN notifications.priority IS 'Prioridade: low, medium, high';
COMMENT ON COLUMN notifications.data IS 'Dados adicionais em formato JSON';
COMMENT ON COLUMN notification_settings.reminder_frequency IS 'Frequência dos lembretes: daily, weekly, never';
COMMENT ON COLUMN custom_reminders.repeat_interval IS 'Intervalo de repetição: daily, weekly, monthly, yearly, null para único';
