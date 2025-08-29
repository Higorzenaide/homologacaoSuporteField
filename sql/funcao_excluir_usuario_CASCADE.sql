-- 🗑️ FUNÇÃO OTIMIZADA PARA EXCLUSÃO DE USUÁRIO
-- Agora que as foreign keys têm CASCADE, a exclusão é muito mais simples!

CREATE OR REPLACE FUNCTION public.excluir_usuario_cascade(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, message VARCHAR, deleted_tables TEXT[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_exists BOOLEAN;
    user_email VARCHAR;
    affected_tables TEXT[];
BEGIN
    -- Verificar se usuário existe
    SELECT EXISTS(SELECT 1 FROM usuarios WHERE id = p_user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        RETURN QUERY SELECT FALSE, 'Usuário não encontrado'::VARCHAR, ARRAY[]::TEXT[];
        RETURN;
    END IF;

    -- Obter email para logs
    SELECT email INTO user_email FROM usuarios WHERE id = p_user_id;

    -- Lista das tabelas que serão afetadas pelo CASCADE
    affected_tables := ARRAY[
        'comentarios_noticias',
        'curtidas_noticias', 
        'custom_reminders',
        'feedback_respostas',
        'feedbacks',
        'noticias_analytics',
        'notification_analytics',
        'notification_settings',
        'notifications',
        'respostas_questionarios',
        'sessoes_questionarios',
        'treinamentos_analytics',
        'user_actions'
    ];

    -- EXCLUSÃO SIMPLES - O CASCADE FAZ O RESTO!
    DELETE FROM usuarios WHERE id = p_user_id;

    -- Verificar se foi excluído
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Erro ao excluir usuário'::VARCHAR, ARRAY[]::TEXT[];
        RETURN;
    END IF;

    RETURN QUERY SELECT 
        TRUE, 
        ('Usuário ' || user_email || ' excluído com sucesso via CASCADE')::VARCHAR,
        affected_tables;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.excluir_usuario_cascade(UUID) TO authenticated;

-- ================================
-- EXEMPLO DE USO:
-- ================================
/*
-- Excluir usuário (vai deletar automaticamente de todas as tabelas relacionadas)
SELECT * FROM excluir_usuario_cascade('550e8400-e29b-41d4-a716-446655440000');

-- Resultado esperado:
-- success | message                                           | deleted_tables
-- --------|---------------------------------------------------|----------------
-- true    | Usuário test@test.com excluído com sucesso via CASCADE | {comentarios_noticias,curtidas_noticias,...}
*/
