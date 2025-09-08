-- Script direto para remover todas as notificações automáticas
-- Execute este script no seu banco PostgreSQL

-- 1. Remover trigger problemático
DROP TRIGGER IF EXISTS trigger_notify_new_treinamento ON treinamentos;

-- 2. Remover função problemática
DROP FUNCTION IF EXISTS notify_new_treinamento();

-- 3. Verificar se foi removido
SELECT 'Triggers restantes na tabela treinamentos:' as status;
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'treinamentos';

-- 4. Verificar se função foi removida
SELECT 'Funções de notificação restantes:' as status;
SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%notify%' AND routine_name LIKE '%training%';
