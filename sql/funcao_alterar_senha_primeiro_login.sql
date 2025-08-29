-- Função para alterar senha no primeiro login
-- (Para sistema de auth personalizado, não Supabase Auth)

CREATE OR REPLACE FUNCTION update_user_password_first_login(
    user_id_param UUID,
    new_password TEXT
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se usuário existe e está ativo
    IF NOT EXISTS (
        SELECT 1 FROM usuarios 
        WHERE id = user_id_param AND ativo = true
    ) THEN
        RETURN QUERY SELECT false, 'Usuário não encontrado ou inativo';
        RETURN;
    END IF;
    
    -- Atualizar senha e marcar primeiro_login como false
    UPDATE usuarios 
    SET 
        senha = new_password,  -- Senha já vem tratada do frontend
        primeiro_login = false,
        updated_at = NOW()
    WHERE id = user_id_param;
    
    -- Verificar se a atualização foi bem-sucedida
    IF FOUND THEN
        RETURN QUERY SELECT true, 'Senha alterada com sucesso';
    ELSE
        RETURN QUERY SELECT false, 'Erro ao alterar senha';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Erro interno: ' || SQLERRM;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION update_user_password_first_login(UUID, TEXT) TO anon, authenticated;

-- Teste da função (substitua o UUID por um real)
-- SELECT * FROM update_user_password_first_login('422032d7-d8c2-4b4e-8c8b-cc23e8aeb7b4'::uuid, 'nova_senha_123');
