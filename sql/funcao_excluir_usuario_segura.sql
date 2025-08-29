-- 🗑️ FUNÇÃO PARA EXCLUSÃO SEGURA DE USUÁRIO
-- Remove o usuário e todos os registros relacionados em uma transação

CREATE OR REPLACE FUNCTION public.excluir_usuario_seguro(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, message VARCHAR, deleted_records JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email VARCHAR;
    deleted_count JSONB;
    user_exists BOOLEAN;
BEGIN
    -- Verificar se usuário existe
    SELECT EXISTS(SELECT 1 FROM usuarios WHERE id = p_user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        RETURN QUERY SELECT FALSE, 'Usuário não encontrado'::VARCHAR, '{}'::JSONB;
        RETURN;
    END IF;

    -- Obter email do usuário antes de excluir
    SELECT email INTO user_email FROM usuarios WHERE id = p_user_id;

    -- Inicializar contador de registros excluídos
    deleted_count := '{}';

    -- EXCLUIR REGISTROS RELACIONADOS EM ORDEM DE DEPENDÊNCIA
    
    -- 1. User Actions
    WITH deleted_actions AS (
        DELETE FROM user_actions WHERE user_id = p_user_id RETURNING *
    )
    SELECT json_build_object('user_actions', count(*)) INTO deleted_count
    FROM deleted_actions;

    -- 2. Auth Attempts
    IF user_email IS NOT NULL THEN
        WITH deleted_auth AS (
            DELETE FROM auth_attempts WHERE email = user_email RETURNING *
        )
        SELECT deleted_count || json_build_object('auth_attempts', count(*)) INTO deleted_count
        FROM deleted_auth;
    END IF;

    -- 3. Tentar excluir de outras tabelas (ignorar se não existir)
    BEGIN
        WITH deleted_curtidas AS (
            DELETE FROM curtidas WHERE usuario_id = p_user_id RETURNING *
        )
        SELECT deleted_count || json_build_object('curtidas', count(*)) INTO deleted_count
        FROM deleted_curtidas;
    EXCEPTION WHEN undefined_table THEN
        NULL; -- Tabela não existe, ignorar
    END;

    BEGIN
        WITH deleted_interacoes AS (
            DELETE FROM interacoes_treinamentos WHERE usuario_id = p_user_id RETURNING *
        )
        SELECT deleted_count || json_build_object('interacoes_treinamentos', count(*)) INTO deleted_count
        FROM deleted_interacoes;
    EXCEPTION WHEN undefined_table THEN
        NULL; -- Tabela não existe, ignorar
    END;

    BEGIN
        WITH deleted_respostas AS (
            DELETE FROM respostas_questionarios WHERE usuario_id = p_user_id RETURNING *
        )
        SELECT deleted_count || json_build_object('respostas_questionarios', count(*)) INTO deleted_count
        FROM deleted_respostas;
    EXCEPTION WHEN undefined_table THEN
        NULL; -- Tabela não existe, ignorar
    END;

    BEGIN
        WITH deleted_notifications AS (
            DELETE FROM notification_settings WHERE user_id = p_user_id RETURNING *
        )
        SELECT deleted_count || json_build_object('notification_settings', count(*)) INTO deleted_count
        FROM deleted_notifications;
    EXCEPTION WHEN undefined_table THEN
        NULL; -- Tabela não existe, ignorar
    END;

    BEGIN
        WITH deleted_feedbacks AS (
            DELETE FROM feedbacks WHERE usuario_id = p_user_id RETURNING *
        )
        SELECT deleted_count || json_build_object('feedbacks', count(*)) INTO deleted_count
        FROM deleted_feedbacks;
    EXCEPTION WHEN undefined_table THEN
        NULL; -- Tabela não existe, ignorar
    END;

    BEGIN
        WITH deleted_noticias AS (
            DELETE FROM interacoes_noticias WHERE usuario_id = p_user_id RETURNING *
        )
        SELECT deleted_count || json_build_object('interacoes_noticias', count(*)) INTO deleted_count
        FROM deleted_noticias;
    EXCEPTION WHEN undefined_table THEN
        NULL; -- Tabela não existe, ignorar
    END;

    -- 9. FINALMENTE, EXCLUIR O USUÁRIO
    DELETE FROM usuarios WHERE id = p_user_id;

    -- Verificar se foi excluído
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Erro ao excluir usuário'::VARCHAR, deleted_count;
        RETURN;
    END IF;

    -- Log da exclusão (inserir em uma tabela de log se existir)
    INSERT INTO user_actions (user_id, action, details, created_at)
    VALUES (NULL, 'USER_DELETED', json_build_object('deleted_user_id', p_user_id, 'email', user_email, 'deleted_records', deleted_count), NOW())
    ON CONFLICT DO NOTHING;

    RETURN QUERY SELECT TRUE, 'Usuário excluído com sucesso'::VARCHAR, deleted_count;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.excluir_usuario_seguro(UUID) TO authenticated;

-- ================================
-- EXEMPLO DE USO:
-- ================================
/*
-- Excluir usuário e ver relatório
SELECT * FROM excluir_usuario_seguro('550e8400-e29b-41d4-a716-446655440000');

-- Resultado esperado:
-- success | message                      | deleted_records
-- --------|------------------------------|------------------
-- true    | Usuário excluído com sucesso | {"user_actions": 5, "curtidas": 12, ...}
*/
