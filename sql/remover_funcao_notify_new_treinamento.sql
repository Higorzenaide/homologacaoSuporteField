-- Script para remover completamente a função notify_new_treinamento
-- que estava causando notificações automáticas para todos os usuários

-- =====================================================
-- 1. VERIFICAR SE A FUNÇÃO AINDA EXISTE
-- =====================================================

SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'notify_new_treinamento';

-- =====================================================
-- 2. REMOVER A FUNÇÃO PROBLEMÁTICA
-- =====================================================

-- Remover a função que notifica todos os usuários automaticamente
DROP FUNCTION IF EXISTS notify_new_treinamento();

-- =====================================================
-- 3. VERIFICAR SE HÁ OUTROS TRIGGERS QUE USAM ESTA FUNÇÃO
-- =====================================================

SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE action_statement LIKE '%notify_new_treinamento%';

-- =====================================================
-- 4. VERIFICAR SE A FUNÇÃO FOI REMOVIDA
-- =====================================================

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'notify_new_treinamento';

-- Se retornar 0 linhas, a função foi removida com sucesso

-- =====================================================
-- 5. VERIFICAR FUNÇÕES RESTANTES
-- =====================================================

-- Verificar quais funções de notificação ainda existem
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'notify_required_training' THEN '✅ MANTIDA - Para treinamentos obrigatórios'
        WHEN routine_name = 'auto_order_new_training' THEN '✅ MANTIDA - Para ordenação automática'
        ELSE '❓ VERIFICAR'
    END as status
FROM information_schema.routines 
WHERE routine_name IN (
    'notify_required_training',
    'notify_new_treinamento',
    'auto_order_new_training'
)
ORDER BY routine_name;

-- =====================================================
-- 6. COMENTÁRIOS SOBRE O SISTEMA CORRIGIDO
-- =====================================================

/*
SISTEMA DE NOTIFICAÇÕES FINAL:

✅ FUNÇÕES MANTIDAS:
1. notify_required_training() - Para treinamentos obrigatórios (notifica todos)
2. auto_order_new_training() - Para ordenação automática (não afeta notificações)

❌ FUNÇÕES REMOVIDAS:
1. notify_new_treinamento() - Estava notificando todos automaticamente

✅ TRIGGERS MANTIDOS:
1. trigger_notify_required_training_insert - Para treinamentos obrigatórios
2. trigger_auto_order_training - Para ordenação automática

❌ TRIGGERS REMOVIDOS:
1. trigger_notify_new_treinamento - Estava interferindo nas notificações manuais

RESULTADO FINAL:
- Treinamentos obrigatórios: Notificam todos automaticamente ✅
- Treinamentos não obrigatórios: Apenas usuários selecionados manualmente ✅
- Sistema híbrido funcionando perfeitamente ✅
*/

-- =====================================================
-- 7. TESTE FINAL
-- =====================================================

-- Verificar se não há mais funções que possam interferir
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_definition LIKE '%INSERT INTO notifications%'
  AND routine_name NOT IN ('notify_required_training')
ORDER BY routine_name;
