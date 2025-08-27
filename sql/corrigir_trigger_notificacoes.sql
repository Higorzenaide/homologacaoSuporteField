-- Script para corrigir o sistema de notificações
-- Adiciona trigger para UPDATE e cria notificações para treinamentos existentes

-- 1. CRIAR TRIGGER PARA UPDATE
-- =====================================================

-- Função para notificar sobre treinamentos obrigatórios (INSERT e UPDATE)
CREATE OR REPLACE FUNCTION notify_required_training()
RETURNS TRIGGER AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Se o treinamento é obrigatório e está ativo, notificar todos os usuários
    IF NEW.obrigatorio = true AND NEW.ativo = true THEN
        -- Verificar se é um UPDATE e se obrigatorio mudou de false para true
        IF TG_OP = 'UPDATE' AND OLD.obrigatorio = false AND NEW.obrigatorio = true THEN
            -- Para UPDATE, criar notificações para todos os usuários
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
                    'Treinamento Agora Obrigatório',
                    'O treinamento "' || NEW.titulo || '" foi marcado como obrigatório',
                    jsonb_build_object(
                        'training_id', NEW.id,
                        'training_title', NEW.titulo,
                        'action_url', '/treinamentos/' || NEW.id
                    ),
                    'high'
                );
            END LOOP;
        ELSIF TG_OP = 'INSERT' THEN
            -- Para INSERT, criar notificações para todos os usuários
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_notify_required_training ON treinamentos;

-- Criar trigger para INSERT
CREATE TRIGGER trigger_notify_required_training_insert
    AFTER INSERT ON treinamentos
    FOR EACH ROW
    EXECUTE FUNCTION notify_required_training();

-- Criar trigger para UPDATE
CREATE TRIGGER trigger_notify_required_training_update
    AFTER UPDATE ON treinamentos
    FOR EACH ROW
    EXECUTE FUNCTION notify_required_training();

-- 2. CRIAR NOTIFICAÇÕES PARA TREINAMENTOS EXISTENTES
-- =====================================================

-- Função para criar notificações para treinamentos obrigatórios existentes
CREATE OR REPLACE FUNCTION create_notifications_for_existing_training(training_id INTEGER)
RETURNS void AS $$
DECLARE
    training_record RECORD;
    user_record RECORD;
BEGIN
    -- Buscar o treinamento
    SELECT * INTO training_record 
    FROM treinamentos 
    WHERE id = training_id AND obrigatorio = true AND ativo = true;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Criar notificações para todos os usuários que não completaram
    FOR user_record IN 
        SELECT id FROM usuarios 
        WHERE id NOT IN (
            SELECT DISTINCT usuario_id 
            FROM treinamento_comentarios 
            WHERE treinamento_id = training_id
            UNION
            SELECT DISTINCT usuario_id 
            FROM treinamento_curtidas 
            WHERE treinamento_id = training_id
        )
        AND id NOT IN (
            -- Não criar se já existe notificação para este treinamento
            SELECT DISTINCT user_id
            FROM notifications
            WHERE type = 'training_required'
            AND data->>'training_id' = training_id::text
        )
    LOOP
        INSERT INTO notifications (user_id, type, title, message, data, priority)
        VALUES (
            user_record.id,
            'training_required',
            'Treinamento Obrigatório Disponível',
            'Você tem um treinamento obrigatório disponível: "' || training_record.titulo || '"',
            jsonb_build_object(
                'training_id', training_record.id,
                'training_title', training_record.titulo,
                'action_url', '/treinamentos/' || training_record.id
            ),
            'high'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. EXECUTAR PARA TREINAMENTOS EXISTENTES
-- =====================================================

-- Criar notificações para todos os treinamentos obrigatórios existentes
DO $$
DECLARE
    training_record RECORD;
BEGIN
    FOR training_record IN 
        SELECT id FROM treinamentos 
        WHERE obrigatorio = true AND ativo = true
    LOOP
        PERFORM create_notifications_for_existing_training(training_record.id);
    END LOOP;
END $$;

-- Comentários
COMMENT ON FUNCTION notify_required_training() IS 'Função para notificar usuários sobre treinamentos obrigatórios (INSERT e UPDATE)';
COMMENT ON FUNCTION create_notifications_for_existing_training(INTEGER) IS 'Função para criar notificações para treinamentos obrigatórios existentes';
