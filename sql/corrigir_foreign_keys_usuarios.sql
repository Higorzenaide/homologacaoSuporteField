-- 🔧 CORREÇÃO DAS FOREIGN KEYS PARA PERMITIR EXCLUSÃO EM CASCATA
-- Execute este script para evitar erros de foreign key ao excluir usuários

-- ================================
-- 1. VERIFICAR CONSTRAINTS EXISTENTES
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
ORDER BY tc.table_name, tc.constraint_name;

-- ================================
-- 2. CORRIGIR CONSTRAINT DA TABELA user_actions
-- ================================

-- Remover constraint existente se existir
ALTER TABLE user_actions 
DROP CONSTRAINT IF EXISTS user_actions_user_id_fkey;

-- Recriar com CASCADE
ALTER TABLE user_actions 
ADD CONSTRAINT user_actions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES usuarios(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- ================================
-- 3. CORRIGIR OUTRAS CONSTRAINTS RELACIONADAS
-- ================================

-- Curtidas
ALTER TABLE curtidas 
DROP CONSTRAINT IF EXISTS curtidas_usuario_id_fkey;

ALTER TABLE curtidas 
ADD CONSTRAINT curtidas_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Interações com treinamentos
ALTER TABLE interacoes_treinamentos 
DROP CONSTRAINT IF EXISTS interacoes_treinamentos_usuario_id_fkey;

ALTER TABLE interacoes_treinamentos 
ADD CONSTRAINT interacoes_treinamentos_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Respostas de questionários
ALTER TABLE respostas_questionarios 
DROP CONSTRAINT IF EXISTS respostas_questionarios_usuario_id_fkey;

ALTER TABLE respostas_questionarios 
ADD CONSTRAINT respostas_questionarios_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Configurações de notificação
ALTER TABLE notification_settings 
DROP CONSTRAINT IF EXISTS notification_settings_user_id_fkey;

ALTER TABLE notification_settings 
ADD CONSTRAINT notification_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES usuarios(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Feedbacks (se usar usuario_id)
ALTER TABLE feedbacks 
DROP CONSTRAINT IF EXISTS feedbacks_usuario_id_fkey;

ALTER TABLE feedbacks 
ADD CONSTRAINT feedbacks_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Interações com notícias
ALTER TABLE interacoes_noticias 
DROP CONSTRAINT IF EXISTS interacoes_noticias_usuario_id_fkey;

ALTER TABLE interacoes_noticias 
ADD CONSTRAINT interacoes_noticias_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- ================================
-- 4. VERIFICAR SE CORRECTIONS FORAM APLICADAS
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
ORDER BY tc.table_name, tc.constraint_name;

-- ================================
-- RESULTADO ESPERADO
-- ================================
/*
Após executar este script, todas as foreign keys relacionadas à tabela 'usuarios' 
deverão ter as regras:
- delete_rule: CASCADE
- update_rule: CASCADE

Isso permitirá que a exclusão de usuários seja feita automaticamente, 
removendo todos os registros relacionados.
*/
