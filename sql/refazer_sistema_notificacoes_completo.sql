-- =====================================================
-- SISTEMA DE NOTIFICAÇÕES - REFATORAÇÃO COMPLETA
-- =====================================================
-- Este script remove tudo e recria o sistema de notificações do zero

-- =====================================================
-- 1. LIMPEZA COMPLETA - REMOVER TUDO
-- =====================================================

-- Remover todos os triggers relacionados a treinamentos
DROP TRIGGER IF EXISTS trigger_notify_required_training_insert ON treinamentos;
DROP TRIGGER IF EXISTS trigger_notify_required_training_update ON treinamentos;
DROP TRIGGER IF EXISTS trigger_notify_new_treinamento ON treinamentos;
DROP TRIGGER IF EXISTS trigger_auto_order_training ON treinamentos;

-- Remover todas as funções relacionadas a notificações
DROP FUNCTION IF EXISTS notify_required_training();
DROP FUNCTION IF EXISTS notify_new_treinamento();
DROP FUNCTION IF EXISTS auto_order_new_training();

-- =====================================================
-- 2. CRIAR FUNÇÃO PARA TREINAMENTOS OBRIGATÓRIOS
-- =====================================================

CREATE OR REPLACE FUNCTION notify_required_training()
RETURNS TRIGGER AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Só notificar se o treinamento é obrigatório e ativo
    IF NEW.obrigatorio = true AND NEW.ativo = true THEN
        
        -- Para INSERT: novo treinamento obrigatório
        IF TG_OP = 'INSERT' THEN
            FOR user_record IN 
                SELECT id FROM usuarios 
                WHERE ativo = true
                AND id NOT IN (
                    -- Excluir usuários que já interagiram com este treinamento
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
        
        -- Para UPDATE: treinamento virou obrigatório
        IF TG_OP = 'UPDATE' AND OLD.obrigatorio = false AND NEW.obrigatorio = true THEN
            FOR user_record IN 
                SELECT id FROM usuarios 
                WHERE ativo = true
                AND id NOT IN (
                    -- Excluir usuários que já interagiram com este treinamento
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
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. CRIAR FUNÇÃO PARA ORDENAÇÃO AUTOMÁTICA
-- =====================================================

CREATE OR REPLACE FUNCTION auto_order_new_training()
RETURNS TRIGGER AS $$
BEGIN
    -- Definir ordem automática para novos treinamentos
    IF NEW.ordem IS NULL THEN
        SELECT COALESCE(MAX(ordem), 0) + 1 INTO NEW.ordem FROM treinamentos;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CRIAR TRIGGERS
-- =====================================================

-- Trigger para notificações de treinamentos obrigatórios (INSERT)
CREATE TRIGGER trigger_notify_required_training_insert
    AFTER INSERT ON treinamentos
    FOR EACH ROW
    EXECUTE FUNCTION notify_required_training();

-- Trigger para notificações de treinamentos obrigatórios (UPDATE)
CREATE TRIGGER trigger_notify_required_training_update
    AFTER UPDATE ON treinamentos
    FOR EACH ROW
    EXECUTE FUNCTION notify_required_training();

-- Trigger para ordenação automática
CREATE TRIGGER trigger_auto_order_training
    BEFORE INSERT ON treinamentos
    FOR EACH ROW
    EXECUTE FUNCTION auto_order_new_training();

-- =====================================================
-- 5. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar triggers criados
SELECT 'Triggers criados:' as status;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'treinamentos'
ORDER BY trigger_name;

-- Verificar funções criadas
SELECT 'Funções criadas:' as status;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN (
    'notify_required_training',
    'auto_order_new_training'
)
ORDER BY routine_name;

-- =====================================================
-- 6. COMENTÁRIOS SOBRE O SISTEMA
-- =====================================================

/*
SISTEMA DE NOTIFICAÇÕES REFATORADO:

✅ FUNCIONALIDADES:
1. Treinamentos obrigatórios: Notificam todos os usuários automaticamente
2. Treinamentos não obrigatórios: Apenas notificações manuais via frontend
3. Ordenação automática: Novos treinamentos recebem ordem automática
4. Exclusão inteligente: Usuários que já interagiram não recebem notificação

✅ TRIGGERS:
- trigger_notify_required_training_insert: Para novos treinamentos obrigatórios
- trigger_notify_required_training_update: Para treinamentos que viram obrigatórios
- trigger_auto_order_training: Para ordenação automática

✅ FUNÇÕES:
- notify_required_training(): Gerencia notificações de treinamentos obrigatórios
- auto_order_new_training(): Define ordem automática para novos treinamentos

✅ TIPOS DE NOTIFICAÇÃO:
- training_required: Treinamentos obrigatórios (prioridade alta)
- training_new: Treinamentos não obrigatórios (prioridade baixa, manual)

✅ FLUXO:
1. Treinamento obrigatório criado → Trigger → Notifica todos
2. Treinamento não obrigatório criado → Sem trigger → Frontend notifica selecionados
3. Treinamento vira obrigatório → Trigger → Notifica todos
*/
