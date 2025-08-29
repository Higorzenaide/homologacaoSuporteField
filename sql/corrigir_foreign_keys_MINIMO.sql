-- 🔧 CORREÇÃO MÍNIMA DAS FOREIGN KEYS
-- Apenas para as tabelas essenciais que sabemos que existem

-- ================================
-- 1. VERIFICAR QUAIS TABELAS EXISTEM
-- ================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_actions', 'notification_settings', 'feedbacks', 'usuarios')
ORDER BY table_name;

-- ================================
-- 2. CORRIGIR APENAS user_actions (mais provável de existir)
-- ================================

-- Verificar se user_actions existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_actions'
    ) THEN
        -- Remover constraint existente se existir
        ALTER TABLE user_actions 
        DROP CONSTRAINT IF EXISTS user_actions_user_id_fkey;

        -- Recriar com CASCADE
        ALTER TABLE user_actions 
        ADD CONSTRAINT user_actions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE '✅ Foreign key de user_actions corrigida com CASCADE';
    ELSE
        RAISE NOTICE 'ℹ️ Tabela user_actions não existe';
    END IF;
END $$;

-- ================================
-- 3. CORRIGIR notification_settings se existir
-- ================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'notification_settings'
    ) THEN
        -- Remover constraint existente se existir
        ALTER TABLE notification_settings 
        DROP CONSTRAINT IF EXISTS notification_settings_user_id_fkey;

        -- Recriar com CASCADE
        ALTER TABLE notification_settings 
        ADD CONSTRAINT notification_settings_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE '✅ Foreign key de notification_settings corrigida com CASCADE';
    ELSE
        RAISE NOTICE 'ℹ️ Tabela notification_settings não existe';
    END IF;
END $$;

-- ================================
-- 4. VERIFICAR RESULTADO
-- ================================
SELECT
    tc.table_name,
    tc.constraint_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'usuarios'
ORDER BY tc.table_name;

-- ================================
-- RESULTADO ESPERADO
-- ================================
/*
SUCESSO:
✅ Foreign key de user_actions corrigida com CASCADE
✅ Foreign key de notification_settings corrigida com CASCADE

Agora você poderá excluir usuários sem erros de foreign key!
*/
