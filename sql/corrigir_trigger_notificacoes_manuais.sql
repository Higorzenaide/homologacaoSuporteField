-- Script para corrigir o sistema de notificações manuais
-- Remove o trigger que notifica todos automaticamente para treinamentos não obrigatórios

-- =====================================================
-- 1. REMOVER TRIGGER PROBLEMÁTICO
-- =====================================================

-- Remover o trigger que notifica todos os usuários automaticamente
DROP TRIGGER IF EXISTS trigger_notify_new_treinamento ON treinamentos;

-- =====================================================
-- 2. VERIFICAR SE HÁ OUTROS TRIGGERS SIMILARES
-- =====================================================

-- Listar todos os triggers na tabela treinamentos
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'treinamentos';

-- =====================================================
-- 3. COMENTÁRIOS SOBRE O SISTEMA ATUAL
-- =====================================================

/*
SISTEMA DE NOTIFICAÇÕES CORRIGIDO:

1. TREINAMENTOS OBRIGATÓRIOS:
   - Trigger: notify_required_training()
   - Comportamento: Notifica TODOS os usuários automaticamente
   - Tipo: 'training_required' (prioridade alta)
   - Status: ✅ MANTIDO (funcionando corretamente)

2. TREINAMENTOS NÃO OBRIGATÓRIOS:
   - Trigger: REMOVIDO (trigger_notify_new_treinamento)
   - Comportamento: Apenas notificações manuais via interface
   - Tipo: 'training_new' (prioridade baixa)
   - Status: ✅ CORRIGIDO (agora respeita seleção manual)

3. NOTIFICAÇÕES MANUAIS:
   - Função: notificationService.notifyNewTreinamento()
   - Comportamento: Notifica apenas usuários selecionados
   - Controle: Interface do AdminModal
   - Status: ✅ FUNCIONANDO (não mais interferido pelos triggers)

RESULTADO:
- Treinamentos obrigatórios: Notificam todos automaticamente
- Treinamentos não obrigatórios: Apenas usuários selecionados manualmente
- Sistema híbrido funcionando corretamente
*/

-- =====================================================
-- 4. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se o trigger foi removido
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'treinamentos'
AND trigger_name = 'trigger_notify_new_treinamento';

-- Se retornar 0 linhas, o trigger foi removido com sucesso
