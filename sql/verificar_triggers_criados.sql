-- Verificar se os triggers foram criados corretamente

-- 1. Verificar triggers na tabela treinamentos
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'treinamentos'
ORDER BY trigger_name;

-- 2. Verificar se as funções estão funcionando
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN (
    'notify_required_training',
    'auto_order_new_training'
)
ORDER BY routine_name;

-- 3. Teste: Verificar se há notificações recentes
SELECT 
    type,
    COUNT(*) as quantidade,
    MAX(created_at) as ultima_criada
FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY type
ORDER BY ultima_criada DESC;
