-- 📝 INSERIR CONFIGURAÇÕES PADRÃO PARA USUÁRIOS EXISTENTES
-- Script para criar configurações de notificação para todos os usuários que não têm

-- ================================
-- 1. VERIFICAR USUÁRIOS SEM CONFIGURAÇÕES
-- ================================
SELECT 
    u.id,
    u.nome,
    u.email,
    CASE 
        WHEN ns.user_id IS NULL THEN '❌ Sem configurações'
        ELSE '✅ Já tem configurações'
    END as status
FROM usuarios u
LEFT JOIN notification_settings ns ON u.id = ns.user_id
ORDER BY u.nome;

-- ================================
-- 2. CONTAR USUÁRIOS SEM CONFIGURAÇÕES
-- ================================
SELECT 
    COUNT(*) as usuarios_sem_configuracoes
FROM usuarios u
LEFT JOIN notification_settings ns ON u.id = ns.user_id
WHERE ns.user_id IS NULL;

-- ================================
-- 3. INSERIR CONFIGURAÇÕES PADRÃO PARA USUÁRIOS SEM ELAS
-- ================================
INSERT INTO notification_settings (
    user_id,
    email_notifications,
    push_notifications,
    training_reminders,
    system_notifications,
    reminder_frequency,
    quiet_hours_start,
    quiet_hours_end
)
SELECT 
    u.id,
    TRUE,     -- email_notifications
    TRUE,     -- push_notifications
    TRUE,     -- training_reminders
    TRUE,     -- system_notifications
    'daily',  -- reminder_frequency
    '22:00',  -- quiet_hours_start
    '08:00'   -- quiet_hours_end
FROM usuarios u
LEFT JOIN notification_settings ns ON u.id = ns.user_id
WHERE ns.user_id IS NULL;

-- ================================
-- 4. VERIFICAR RESULTADO
-- ================================
SELECT 
    COUNT(*) as total_configuracoes_criadas
FROM notification_settings;

-- ================================
-- 5. MOSTRAR CONFIGURAÇÕES CRIADAS
-- ================================
SELECT 
    u.nome,
    u.email,
    ns.email_notifications,
    ns.push_notifications,
    ns.training_reminders,
    ns.system_notifications,
    ns.reminder_frequency,
    ns.created_at
FROM usuarios u
JOIN notification_settings ns ON u.id = ns.user_id
ORDER BY ns.created_at DESC;

-- ================================
-- 6. VERIFICAR SE TODOS OS USUÁRIOS TÊM CONFIGURAÇÕES
-- ================================
SELECT 
    'Usuários totais:' as info,
    COUNT(*) as quantidade
FROM usuarios
WHERE ativo = TRUE

UNION ALL

SELECT 
    'Configurações criadas:' as info,
    COUNT(*) as quantidade
FROM notification_settings

UNION ALL

SELECT 
    'Usuários sem config:' as info,
    COUNT(*) as quantidade
FROM usuarios u
LEFT JOIN notification_settings ns ON u.id = ns.user_id
WHERE u.ativo = TRUE AND ns.user_id IS NULL;

-- ================================
-- RESULTADO ESPERADO:
-- ================================
/*
Após executar este script:
- Todos os usuários ativos devem ter configurações de notificação
- As configurações padrão são:
  - Todas as notificações ativadas (TRUE)
  - Frequência diária
  - Horário silencioso das 22:00 às 08:00
- Não haverá mais erro ao acessar configurações
*/
