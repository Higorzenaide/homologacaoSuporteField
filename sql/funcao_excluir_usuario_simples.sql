-- 🗑️ FUNÇÃO SIMPLES PARA EXCLUSÃO DE USUÁRIO
-- Apenas exclui das tabelas que sabemos que existem

CREATE OR REPLACE FUNCTION public.excluir_usuario_simples(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, message VARCHAR)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email VARCHAR;
    user_exists BOOLEAN;
BEGIN
    -- Verificar se usuário existe
    SELECT EXISTS(SELECT 1 FROM usuarios WHERE id = p_user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        RETURN QUERY SELECT FALSE, 'Usuário não encontrado'::VARCHAR;
        RETURN;
    END IF;

    -- Obter email do usuário antes de excluir (se precisar)
    SELECT email INTO user_email FROM usuarios WHERE id = p_user_id;

    -- EXCLUIR APENAS DAS TABELAS QUE SABEMOS QUE EXISTEM
    
    -- 1. Tentar excluir user_actions (se existir)
    BEGIN
        DELETE FROM user_actions WHERE user_id = p_user_id;
    EXCEPTION WHEN undefined_table THEN
        -- Tabela não existe, ignorar
        NULL;
    END;

    -- 2. Tentar excluir auth_attempts (se existir)
    IF user_email IS NOT NULL THEN
        BEGIN
            DELETE FROM auth_attempts WHERE email = user_email;
        EXCEPTION WHEN undefined_table THEN
            -- Tabela não existe, ignorar
            NULL;
        END;
    END IF;

    -- 3. EXCLUIR O USUÁRIO
    DELETE FROM usuarios WHERE id = p_user_id;

    -- Verificar se foi excluído
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Erro ao excluir usuário'::VARCHAR;
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, 'Usuário excluído com sucesso'::VARCHAR;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.excluir_usuario_simples(UUID) TO authenticated;

-- ================================
-- EXEMPLO DE USO:
-- ================================
/*
-- Excluir usuário
SELECT * FROM excluir_usuario_simples('550e8400-e29b-41d4-a716-446655440000');

-- Resultado esperado:
-- success | message
-- --------|---------------------------
-- true    | Usuário excluído com sucesso
*/
