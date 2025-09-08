-- Script para restaurar apenas o trigger de treinamentos obrigatórios
-- Execute este script no seu banco PostgreSQL

-- 1. Criar função para notificar apenas treinamentos obrigatórios
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

-- 2. Criar trigger para treinamentos obrigatórios
DROP TRIGGER IF EXISTS trigger_notify_required_training_insert ON treinamentos;
CREATE TRIGGER trigger_notify_required_training_insert
    AFTER INSERT ON treinamentos
    FOR EACH ROW
    EXECUTE FUNCTION notify_required_training();

-- 3. Criar trigger para UPDATE (quando treinamento vira obrigatório)
DROP TRIGGER IF EXISTS trigger_notify_required_training_update ON treinamentos;
CREATE TRIGGER trigger_notify_required_training_update
    AFTER UPDATE ON treinamentos
    FOR EACH ROW
    EXECUTE FUNCTION notify_required_training();

-- 4. Verificar se foi criado corretamente
SELECT 'Triggers criados:' as status;
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'treinamentos';

-- 5. Verificar função
SELECT 'Função criada:' as status;
SELECT routine_name FROM information_schema.routines WHERE routine_name = 'notify_required_training';
