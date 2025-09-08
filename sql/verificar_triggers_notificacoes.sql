-- Script para verificar todos os triggers e funções relacionadas a notificações

-- =====================================================
-- 1. VERIFICAR TODOS OS TRIGGERS NA TABELA TREINAMENTOS
-- =====================================================

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'treinamentos'
ORDER BY trigger_name;

-- =====================================================
-- 2. VERIFICAR FUNÇÕES RELACIONADAS A NOTIFICAÇÕES
-- =====================================================

SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%notif%' 
   OR routine_name LIKE '%training%'
   OR routine_definition LIKE '%notifications%'
ORDER BY routine_name;

-- =====================================================
-- 3. VERIFICAR SE HÁ TRIGGERS EM OUTRAS TABELAS QUE AFETAM NOTIFICAÇÕES
-- =====================================================

SELECT 
    event_object_table,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE action_statement LIKE '%notifications%'
   OR action_statement LIKE '%notify%'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 4. VERIFICAR FUNÇÕES QUE INSEREM EM NOTIFICATIONS
-- =====================================================

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_definition LIKE '%INSERT INTO notifications%'
ORDER BY routine_name;

-- =====================================================
-- 5. TESTE: VERIFICAR NOTIFICAÇÕES RECENTES
-- =====================================================

-- Verificar as últimas notificações criadas
SELECT 
    id,
    user_id,
    type,
    title,
    message,
    created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- =====================================================
-- 6. VERIFICAR SE HÁ TRIGGERS DUPLICADOS OU CONFLITANTES
-- =====================================================

-- Verificar se há múltiplos triggers com nomes similares
SELECT 
    trigger_name,
    COUNT(*) as count
FROM information_schema.triggers 
WHERE event_object_table = 'treinamentos'
GROUP BY trigger_name
HAVING COUNT(*) > 1;

-- =====================================================
-- 7. VERIFICAR FUNÇÕES DE NOTIFICAÇÃO ESPECÍFICAS
-- =====================================================

-- Verificar se as funções de notificação ainda existem
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_definition LIKE '%obrigatorio%' THEN 'Pode afetar treinamentos obrigatórios'
        WHEN routine_definition LIKE '%ativo%' THEN 'Pode afetar treinamentos ativos'
        ELSE 'Outro tipo'
    END as tipo_impacto
FROM information_schema.routines 
WHERE routine_name IN (
    'notify_required_training',
    'notify_new_treinamento',
    'auto_order_new_training'
)
ORDER BY routine_name;
