-- 🔔 TRIGGER PARA CRIAR CONFIGURAÇÕES DE NOTIFICAÇÃO AUTOMATICAMENTE
-- Este trigger garante que todo usuário novo tenha configurações de notificação

-- ================================
-- 1. FUNÇÃO PARA CRIAR CONFIGURAÇÕES
-- ================================
CREATE OR REPLACE FUNCTION criar_configuracoes_notificacao_novo_usuario()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir configurações padrão para o novo usuário
    INSERT INTO notification_settings (
        user_id,
        email_notifications,
        push_notifications,
        training_reminders,
        system_notifications,
        reminder_frequency,
        quiet_hours_start,
        quiet_hours_end,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,          -- ID do usuário recém-criado
        TRUE,            -- email_notifications
        TRUE,            -- push_notifications
        TRUE,            -- training_reminders
        TRUE,            -- system_notifications
        'daily',         -- reminder_frequency
        '22:00',         -- quiet_hours_start
        '08:00',         -- quiet_hours_end
        NOW(),           -- created_at
        NOW()            -- updated_at
    );
    
    -- Log da criação das configurações
    RAISE NOTICE '✅ Configurações de notificação criadas para usuário: % (%)', NEW.nome, NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Se houver erro, apenas fazer log mas não bloquear a criação do usuário
        RAISE WARNING '⚠️ Erro ao criar configurações de notificação para usuário %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- 2. CRIAR TRIGGER
-- ================================
DROP TRIGGER IF EXISTS trigger_criar_configuracoes_notificacao ON usuarios;

CREATE TRIGGER trigger_criar_configuracoes_notificacao
    AFTER INSERT ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION criar_configuracoes_notificacao_novo_usuario();

-- ================================
-- 3. VERIFICAR SE O TRIGGER FOI CRIADO
-- ================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_criar_configuracoes_notificacao';

-- ================================
-- 4. TESTAR O TRIGGER (OPCIONAL)
-- ================================
/*
-- Descomente para testar:

-- Criar um usuário de teste
INSERT INTO usuarios (
    email, 
    nome, 
    senha, 
    tipo_usuario, 
    ativo, 
    primeiro_login
) VALUES (
    'teste_trigger@exemplo.com',
    'Usuário Teste Trigger',
    'senha123',
    'usuario',
    TRUE,
    TRUE
) RETURNING id, nome;

-- Verificar se as configurações foram criadas
SELECT 
    u.nome,
    u.email,
    ns.email_notifications,
    ns.push_notifications,
    ns.training_reminders,
    ns.created_at
FROM usuarios u
JOIN notification_settings ns ON u.id = ns.user_id
WHERE u.email = 'teste_trigger@exemplo.com';

-- Limpar teste
DELETE FROM usuarios WHERE email = 'teste_trigger@exemplo.com';
*/

-- ================================
-- RESULTADO ESPERADO:
-- ================================
/*
Após executar este script:
1. ✅ Função de trigger criada
2. ✅ Trigger ativo na tabela usuarios
3. ✅ Todo usuário novo automaticamente terá configurações
4. ✅ Se houver erro, não bloqueia a criação do usuário
5. ✅ Logs informativos são gerados
*/

-- ================================
-- VANTAGENS DO TRIGGER:
-- ================================
/*
1. 🔄 AUTOMÁTICO - Funciona independente do frontend
2. 🛡️ GARANTIDO - Sempre executado na criação
3. 🚀 RÁPIDO - Execução no banco de dados
4. 🔧 BACKUP - Funciona mesmo se o frontend falhar
5. 📝 LOGS - Registra tentativas e erros
*/
