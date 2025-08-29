-- =====================================================
-- CORRIGIR FUNÇÃO PARA UUID (NÃO SERIAL)
-- =====================================================
-- A tabela usa UUID para id, não SERIAL

-- 1. Remover função antiga
DROP FUNCTION IF EXISTS criar_notificacao_feedback(UUID, INTEGER, VARCHAR(100), VARCHAR(7), VARCHAR(255));

-- 2. Criar nova função correta para UUID
CREATE OR REPLACE FUNCTION criar_notificacao_feedback(
    usuario_id_param UUID,
    feedback_id_param INTEGER,
    categoria_nome_param VARCHAR(100),
    categoria_cor_param VARCHAR(7),
    nome_avaliador_param VARCHAR(255)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
    notification_data JSON;
    resultado JSON;
BEGIN
    -- Gerar UUID para a notificação
    notification_id := gen_random_uuid();
    
    -- Inserir notificação
    INSERT INTO notifications (
        id,
        user_id,
        type,
        title,
        message,
        data,
        priority,
        read,
        created_at
    ) VALUES (
        notification_id,
        usuario_id_param,
        'feedback',
        'Você recebeu um feedback',
        'Você recebeu um novo feedback na categoria "' || COALESCE(categoria_nome_param, 'Geral') || '". Verifique em seu perfil.',
        jsonb_build_object(
            'feedback_id', feedback_id_param,
            'categoria_nome', categoria_nome_param,
            'categoria_cor', categoria_cor_param,
            'nome_avaliador', nome_avaliador_param,
            'action_url', '/perfil'
        ),
        'high',
        false,
        NOW()
    );

    -- Buscar a notificação criada para retornar
    SELECT to_json(n.*) INTO notification_data
    FROM notifications n
    WHERE n.id = notification_id;

    -- Preparar resultado de sucesso
    resultado = jsonb_build_object(
        'success', true,
        'notification', notification_data
    );

    RETURN resultado;

EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, retornar detalhes
    resultado = jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE,
        'hint', 'Verifique se o user_id existe e se as políticas RLS estão corretas'
    );
    
    RETURN resultado;
END;
$$;

-- 3. Dar permissões
GRANT EXECUTE ON FUNCTION criar_notificacao_feedback(UUID, INTEGER, VARCHAR(100), VARCHAR(7), VARCHAR(255)) TO authenticated;

-- 4. Teste da função (descomente para testar)
-- SELECT criar_notificacao_feedback(
--     '00000000-0000-0000-0000-000000000000'::uuid,  -- user_id de teste
--     123,                                            -- feedback_id
--     'Teste',                                        -- categoria
--     '#3B82F6',                                      -- cor
--     'Sistema de Teste'                              -- avaliador
-- );
