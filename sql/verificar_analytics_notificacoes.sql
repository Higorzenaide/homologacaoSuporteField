-- Script para verificar se os dados de analytics estão sendo inseridos
-- Execute este script para diagnosticar problemas

-- 1. VERIFICAR DADOS NA TABELA notification_analytics
-- =====================================================
SELECT 
    'notification_analytics' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN action = 'read' THEN 1 END) as lidas,
    COUNT(CASE WHEN action = 'clicked' THEN 1 END) as clicadas,
    COUNT(CASE WHEN action = 'dismissed' THEN 1 END) as dispensadas
FROM notification_analytics;

-- 2. VERIFICAR DADOS RECENTES (últimos 7 dias)
-- =====================================================
SELECT 
    action,
    COUNT(*) as quantidade,
    MIN(created_at) as primeira_ocorrencia,
    MAX(created_at) as ultima_ocorrencia
FROM notification_analytics 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY action
ORDER BY quantidade DESC;

-- 3. VERIFICAR DADOS POR USUÁRIO (últimos 7 dias)
-- =====================================================
SELECT 
    u.nome,
    u.email,
    na.action,
    COUNT(*) as quantidade,
    MAX(na.created_at) as ultima_acao
FROM notification_analytics na
JOIN usuarios u ON u.id = na.user_id
WHERE na.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.nome, u.email, na.action
ORDER BY u.nome, na.action;

-- 4. VERIFICAR NOTIFICAÇÕES COM ANALYTICS
-- =====================================================
SELECT 
    n.id,
    n.title,
    n.type,
    n.read,
    n.created_at,
    COUNT(na.id) as total_analytics,
    COUNT(CASE WHEN na.action = 'read' THEN 1 END) as lidas,
    COUNT(CASE WHEN na.action = 'clicked' THEN 1 END) as clicadas
FROM notifications n
LEFT JOIN notification_analytics na ON na.notification_id = n.id
WHERE n.created_at >= NOW() - INTERVAL '7 days'
GROUP BY n.id, n.title, n.type, n.read, n.created_at
ORDER BY n.created_at DESC
LIMIT 10;

-- 5. VERIFICAR SE HÁ NOTIFICAÇÕES SEM ANALYTICS
-- =====================================================
SELECT 
    n.id,
    n.title,
    n.type,
    n.read,
    n.created_at,
    'SEM ANALYTICS' as status
FROM notifications n
LEFT JOIN notification_analytics na ON na.notification_id = n.id
WHERE na.id IS NULL
  AND n.created_at >= NOW() - INTERVAL '7 days'
ORDER BY n.created_at DESC
LIMIT 10;

-- 6. VERIFICAR ESTRUTURA DA TABELA
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notification_analytics'
ORDER BY ordinal_position;

-- 7. VERIFICAR POLÍTICAS RLS
-- =====================================================
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'notification_analytics';
