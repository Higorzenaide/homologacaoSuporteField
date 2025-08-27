-- Script para inserir dados de teste no sistema de analytics
-- Execute apenas se necessário para testar o sistema

-- IMPORTANTE: Substitua os UUIDs pelos IDs reais do seu sistema

-- 1. VERIFICAR NOTIFICAÇÕES EXISTENTES
-- =====================================================
SELECT 
    id,
    title,
    type,
    created_at
FROM notifications 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 5;

-- 2. VERIFICAR USUÁRIOS EXISTENTES
-- =====================================================
SELECT 
    id,
    nome,
    email
FROM usuarios 
ORDER BY created_at DESC
LIMIT 5;

-- 3. INSERIR DADOS DE TESTE (descomente e ajuste os UUIDs)
-- =====================================================
/*
-- Exemplo de inserção de dados de teste
-- Substitua os UUIDs pelos reais do seu sistema

INSERT INTO notification_analytics (notification_id, user_id, action)
VALUES 
    -- Substitua 'uuid-notificacao-1' pelo ID real de uma notificação
    -- Substitua 'uuid-usuario-1' pelo ID real de um usuário
    ('uuid-notificacao-1', 'uuid-usuario-1', 'read'),
    ('uuid-notificacao-1', 'uuid-usuario-2', 'read'),
    ('uuid-notificacao-1', 'uuid-usuario-1', 'clicked'),
    ('uuid-notificacao-2', 'uuid-usuario-1', 'read'),
    ('uuid-notificacao-2', 'uuid-usuario-2', 'clicked');
*/

-- 4. VERIFICAR SE OS DADOS FORAM INSERIDOS
-- =====================================================
SELECT 
    na.id,
    n.title as notificacao,
    u.nome as usuario,
    na.action,
    na.created_at
FROM notification_analytics na
JOIN notifications n ON n.id = na.notification_id
JOIN usuarios u ON u.id = na.user_id
ORDER BY na.created_at DESC
LIMIT 10;

-- 5. TESTE MANUAL DAS FUNÇÕES
-- =====================================================
-- Descomente e ajuste os UUIDs para testar as funções
/*
-- Teste da função de registrar leitura
SELECT register_notification_read('uuid-notificacao', 'uuid-usuario');

-- Teste da função de registrar clique
SELECT register_notification_clicked('uuid-notificacao', 'uuid-usuario');
*/
