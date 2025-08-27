-- Script para criar trigger que gera notificações automaticamente para lembretes personalizados

-- Função para criar notificação quando lembrete personalizado é criado
CREATE OR REPLACE FUNCTION notify_custom_reminder()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o lembrete é ativo e a data é no passado ou presente, criar notificação
    IF NEW.active = true AND NEW.scheduled_for <= NOW() THEN
        INSERT INTO notifications (user_id, type, title, message, data, priority)
        VALUES (
            NEW.user_id,
            'custom_reminder',
            NEW.title,
            NEW.message,
            jsonb_build_object(
                'reminder_id', NEW.id,
                'scheduled_for', NEW.scheduled_for,
                'repeat_interval', NEW.repeat_interval,
                'action_url', NEW.action_url,
                'priority', NEW.priority
            ),
            COALESCE(NEW.priority, 'medium')
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para INSERT em custom_reminders
CREATE TRIGGER trigger_notify_custom_reminder_insert
    AFTER INSERT ON custom_reminders
    FOR EACH ROW
    EXECUTE FUNCTION notify_custom_reminder();

-- Trigger para UPDATE em custom_reminders
CREATE TRIGGER trigger_notify_custom_reminder_update
    AFTER UPDATE ON custom_reminders
    FOR EACH ROW
    EXECUTE FUNCTION notify_custom_reminder();

-- Função para criar notificações para lembretes existentes que estão atrasados
CREATE OR REPLACE FUNCTION create_notifications_for_overdue_reminders()
RETURNS void AS $$
DECLARE
    reminder_record RECORD;
BEGIN
    -- Buscar lembretes ativos que estão atrasados e não têm notificação
    FOR reminder_record IN 
        SELECT cr.*
        FROM custom_reminders cr
        WHERE cr.active = true 
        AND cr.scheduled_for <= NOW()
        AND cr.id NOT IN (
            SELECT (n.data->>'reminder_id')::uuid
            FROM notifications n
            WHERE n.type = 'custom_reminder'
            AND n.data->>'reminder_id' IS NOT NULL
        )
    LOOP
        INSERT INTO notifications (user_id, type, title, message, data, priority)
        VALUES (
            reminder_record.user_id,
            'custom_reminder',
            reminder_record.title,
            reminder_record.message,
            jsonb_build_object(
                'reminder_id', reminder_record.id,
                'scheduled_for', reminder_record.scheduled_for,
                'repeat_interval', reminder_record.repeat_interval,
                'action_url', reminder_record.action_url,
                'priority', reminder_record.priority
            ),
            COALESCE(reminder_record.priority, 'medium')
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar para lembretes existentes
SELECT create_notifications_for_overdue_reminders();

-- Comentários
COMMENT ON FUNCTION notify_custom_reminder() IS 'Função para criar notificações quando lembretes personalizados são criados ou atualizados';
COMMENT ON FUNCTION create_notifications_for_overdue_reminders() IS 'Função para criar notificações para lembretes existentes que estão atrasados';
