-- 🔧 CORREÇÃO SEGURA DAS FOREIGN KEYS PARA PERMITIR EXCLUSÃO EM CASCATA
-- Execute este script para evitar erros de foreign key ao excluir usuários
-- VERSÃO SEGURA: Verifica se as tabelas existem antes de alterar

-- ================================
-- 1. FUNÇÃO AUXILIAR PARA VERIFICAR SE TABELA EXISTE
-- ================================
CREATE OR REPLACE FUNCTION table_exists(table_name text) 
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
    );
END;
$$ LANGUAGE plpgsql;

-- ================================
-- 2. VERIFICAR CONSTRAINTS EXISTENTES (apenas tabelas que existem)
-- ================================
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'usuarios'
    AND table_exists(tc.table_name)  -- Apenas se a tabela existir
ORDER BY tc.table_name, tc.constraint_name;

-- ================================
-- 3. CORRIGIR CONSTRAINT DA TABELA user_actions (se existir)
-- ================================
DO $$
BEGIN
    IF table_exists('user_actions') THEN
        -- Remover constraint existente se existir
        ALTER TABLE user_actions 
        DROP CONSTRAINT IF EXISTS user_actions_user_id_fkey;

        -- Recriar com CASCADE
        ALTER TABLE user_actions 
        ADD CONSTRAINT user_actions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE '✅ Foreign key de user_actions corrigida';
    ELSE
        RAISE NOTICE 'ℹ️ Tabela user_actions não existe, pulando...';
    END IF;
END $$;

-- ================================
-- 4. CORRIGIR OUTRAS CONSTRAINTS (apenas se as tabelas existirem)
-- ================================

-- Curtidas
DO $$
BEGIN
    IF table_exists('curtidas') THEN
        ALTER TABLE curtidas 
        DROP CONSTRAINT IF EXISTS curtidas_usuario_id_fkey;

        ALTER TABLE curtidas 
        ADD CONSTRAINT curtidas_usuario_id_fkey 
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE '✅ Foreign key de curtidas corrigida';
    ELSE
        RAISE NOTICE 'ℹ️ Tabela curtidas não existe, pulando...';
    END IF;
END $$;

-- Interações com treinamentos
DO $$
BEGIN
    IF table_exists('interacoes_treinamentos') THEN
        ALTER TABLE interacoes_treinamentos 
        DROP CONSTRAINT IF EXISTS interacoes_treinamentos_usuario_id_fkey;

        ALTER TABLE interacoes_treinamentos 
        ADD CONSTRAINT interacoes_treinamentos_usuario_id_fkey 
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE '✅ Foreign key de interacoes_treinamentos corrigida';
    ELSE
        RAISE NOTICE 'ℹ️ Tabela interacoes_treinamentos não existe, pulando...';
    END IF;
END $$;

-- Respostas de questionários
DO $$
BEGIN
    IF table_exists('respostas_questionarios') THEN
        ALTER TABLE respostas_questionarios 
        DROP CONSTRAINT IF EXISTS respostas_questionarios_usuario_id_fkey;

        ALTER TABLE respostas_questionarios 
        ADD CONSTRAINT respostas_questionarios_usuario_id_fkey 
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE '✅ Foreign key de respostas_questionarios corrigida';
    ELSE
        RAISE NOTICE 'ℹ️ Tabela respostas_questionarios não existe, pulando...';
    END IF;
END $$;

-- Configurações de notificação
DO $$
BEGIN
    IF table_exists('notification_settings') THEN
        ALTER TABLE notification_settings 
        DROP CONSTRAINT IF EXISTS notification_settings_user_id_fkey;

        ALTER TABLE notification_settings 
        ADD CONSTRAINT notification_settings_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE '✅ Foreign key de notification_settings corrigida';
    ELSE
        RAISE NOTICE 'ℹ️ Tabela notification_settings não existe, pulando...';
    END IF;
END $$;

-- Feedbacks
DO $$
BEGIN
    IF table_exists('feedbacks') THEN
        ALTER TABLE feedbacks 
        DROP CONSTRAINT IF EXISTS feedbacks_usuario_id_fkey;

        ALTER TABLE feedbacks 
        ADD CONSTRAINT feedbacks_usuario_id_fkey 
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE '✅ Foreign key de feedbacks corrigida';
    ELSE
        RAISE NOTICE 'ℹ️ Tabela feedbacks não existe, pulando...';
    END IF;
END $$;

-- Interações com notícias
DO $$
BEGIN
    IF table_exists('interacoes_noticias') THEN
        ALTER TABLE interacoes_noticias 
        DROP CONSTRAINT IF EXISTS interacoes_noticias_usuario_id_fkey;

        ALTER TABLE interacoes_noticias 
        ADD CONSTRAINT interacoes_noticias_usuario_id_fkey 
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE '✅ Foreign key de interacoes_noticias corrigida';
    ELSE
        RAISE NOTICE 'ℹ️ Tabela interacoes_noticias não existe, pulando...';
    END IF;
END $$;

-- ================================
-- 5. VERIFICAR SE CORREÇÕES FORAM APLICADAS
-- ================================
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'usuarios'
    AND table_exists(tc.table_name)  -- Apenas tabelas que existem
ORDER BY tc.table_name, tc.constraint_name;

-- ================================
-- 6. LIMPAR FUNÇÃO AUXILIAR
-- ================================
DROP FUNCTION IF EXISTS table_exists(text);

-- ================================
-- RESULTADO ESPERADO
-- ================================
/*
Após executar este script, todas as foreign keys relacionadas à tabela 'usuarios' 
(das tabelas que realmente existem) deverão ter as regras:
- delete_rule: CASCADE
- update_rule: CASCADE

Isso permitirá que a exclusão de usuários seja feita automaticamente, 
removendo todos os registros relacionados.

EXEMPLO DE SAÍDA:
✅ Foreign key de user_actions corrigida
ℹ️ Tabela curtidas não existe, pulando...
✅ Foreign key de notification_settings corrigida
ℹ️ Tabela feedbacks não existe, pulando...
*/
