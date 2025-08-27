-- Script para alterar as tabelas de notificações para usar a tabela usuarios
-- ao invés de auth.users

-- 1. ALTERAR TABELA NOTIFICATIONS
-- =====================================================

-- Remover a constraint de foreign key existente
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Manter o tipo UUID (não precisa alterar)
-- A coluna user_id já é UUID, só precisamos alterar a referência

-- Adicionar a nova constraint de foreign key para a tabela usuarios
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- 2. ALTERAR TABELA NOTIFICATION_SETTINGS
-- =====================================================

-- Remover a constraint de foreign key existente
ALTER TABLE notification_settings DROP CONSTRAINT IF EXISTS notification_settings_user_id_fkey;

-- Manter o tipo UUID (não precisa alterar)
-- A coluna user_id já é UUID, só precisamos alterar a referência

-- Adicionar a nova constraint de foreign key para a tabela usuarios
ALTER TABLE notification_settings ADD CONSTRAINT notification_settings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- 3. ALTERAR TABELA CUSTOM_REMINDERS
-- =====================================================

-- Remover a constraint de foreign key existente
ALTER TABLE custom_reminders DROP CONSTRAINT IF EXISTS custom_reminders_user_id_fkey;

-- Manter o tipo UUID (não precisa alterar)
-- A coluna user_id já é UUID, só precisamos alterar a referência

-- Adicionar a nova constraint de foreign key para a tabela usuarios
ALTER TABLE custom_reminders ADD CONSTRAINT custom_reminders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- 4. RECRIAR AS POLÍTICAS RLS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Recriar políticas para usar a tabela usuarios
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id IN (
        SELECT id FROM usuarios WHERE email = auth.email()
    ));

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id IN (
        SELECT id FROM usuarios WHERE email = auth.email()
    ));

CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (user_id IN (
        SELECT id FROM usuarios WHERE email = auth.email()
    ));

-- 5. RECRIAR AS FUNÇÕES QUE USAM AUTH.USERS
-- =====================================================

-- Recriar função notify_required_training
CREATE OR REPLACE FUNCTION notify_required_training()
RETURNS TRIGGER AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Se o treinamento é obrigatório e está ativo, notificar todos os usuários
    IF NEW.obrigatorio = true AND NEW.ativo = true THEN
        FOR user_record IN 
            SELECT id FROM usuarios 
            WHERE id NOT IN (
                SELECT DISTINCT usuario_id 
                FROM treinamento_comentarios 
                WHERE treinamento_id = NEW.id
                UNION
                SELECT DISTINCT usuario_id 
                FROM treinamento_curtidas 
                WHERE treinamento_id = NEW.id
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

-- Recriar função create_training_reminders
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
            FROM usuarios u
            WHERE u.id NOT IN (
                SELECT DISTINCT usuario_id 
                FROM treinamento_comentarios 
                WHERE treinamento_id = training_record.id
                UNION
                SELECT DISTINCT usuario_id 
                FROM treinamento_curtidas 
                WHERE treinamento_id = training_record.id
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
            ELSIF training_record.days_until_deadline <= 0 THEN
                reminder_type := 'overdue';
            ELSIF training_record.days_until_deadline <= 3 THEN
                reminder_type := 'due_soon';
            ELSE
                reminder_type := 'pending';
            END IF;

            -- Criar notificação de lembrete
            INSERT INTO notifications (user_id, type, title, message, data, priority)
            VALUES (
                user_record.id,
                'training_reminder',
                CASE 
                    WHEN reminder_type = 'overdue' THEN 'Treinamento Atrasado'
                    WHEN reminder_type = 'due_soon' THEN 'Treinamento Vencendo'
                    ELSE 'Lembrete de Treinamento'
                END,
                CASE 
                    WHEN reminder_type = 'overdue' THEN 
                        'O treinamento "' || training_record.titulo || '" está atrasado!'
                    WHEN reminder_type = 'due_soon' THEN 
                        'O treinamento "' || training_record.titulo || '" vence em ' || 
                        training_record.days_until_deadline || ' dias.'
                    ELSE 
                        'Você tem um treinamento obrigatório pendente: "' || training_record.titulo || '"'
                END,
                jsonb_build_object(
                    'training_id', training_record.id,
                    'training_title', training_record.titulo,
                    'reminder_type', reminder_type,
                    'days_until_deadline', training_record.days_until_deadline,
                    'action_url', '/treinamentos/' || training_record.id
                ),
                CASE 
                    WHEN reminder_type = 'overdue' THEN 'urgent'
                    WHEN reminder_type = 'due_soon' THEN 'high'
                    ELSE 'medium'
                END
            );
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comentários finais
COMMENT ON FUNCTION notify_required_training() IS 'Função para notificar usuários sobre novos treinamentos obrigatórios';
COMMENT ON FUNCTION create_training_reminders() IS 'Função para criar lembretes automáticos de treinamentos pendentes';
