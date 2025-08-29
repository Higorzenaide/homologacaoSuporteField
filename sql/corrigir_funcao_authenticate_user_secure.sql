-- 🔧 CORREÇÃO DA FUNÇÃO authenticate_user_secure
-- Corrige ambiguidade na coluna 'email'

DROP FUNCTION IF EXISTS public.authenticate_user_secure(text, text);

CREATE OR REPLACE FUNCTION public.authenticate_user_secure(user_email text, user_password text)
RETURNS TABLE(
    id uuid, 
    email character varying, 
    nome character varying, 
    cargo character varying, 
    telefone character varying, 
    tipo_usuario character varying, 
    ativo boolean, 
    ultimo_acesso timestamp with time zone, 
    created_at timestamp with time zone, 
    updated_at timestamp with time zone, 
    senha character varying, 
    role boolean, 
    pode_ver_feedbacks boolean, 
    primeiro_login boolean,
    success boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log da tentativa (para auditoria)
    INSERT INTO auth_attempts (email, success, created_at)
    VALUES (user_email, FALSE, NOW())
    ON CONFLICT DO NOTHING;

    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.nome,
        u.cargo,
        u.telefone,
        u.tipo_usuario,
        u.ativo,
        u.ultimo_acesso,
        u.created_at,
        u.updated_at,
        u.senha,
        u.role,
        COALESCE(u.pode_ver_feedbacks, FALSE) as pode_ver_feedbacks,
        COALESCE(u.primeiro_login, TRUE) as primeiro_login,
        CASE 
            WHEN u.id IS NOT NULL AND u.ativo = TRUE AND 
                 -- Verificar hash OU senha em texto plano (compatibilidade)
                 (u.senha = crypt(user_password, u.senha) OR 
                  (u.senha NOT LIKE '$2%' AND u.senha = user_password))
            THEN TRUE 
            ELSE FALSE 
        END as success
    FROM usuarios u
    WHERE u.email = user_email
    LIMIT 1;
    
    -- Atualizar sucesso se autenticado (CORRIGIDO: especificar tabela)
    UPDATE auth_attempts 
    SET success = TRUE 
    WHERE auth_attempts.email = user_email 
    AND auth_attempts.created_at = (
        SELECT MAX(aa.created_at) 
        FROM auth_attempts aa 
        WHERE aa.email = user_email
    )
    AND EXISTS (
        SELECT 1 FROM usuarios u 
        WHERE u.email = user_email AND u.ativo = TRUE AND
        (u.senha = crypt(user_password, u.senha) OR 
         (u.senha NOT LIKE '$2%' AND u.senha = user_password))
    );
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.authenticate_user_secure(text, text) TO anon, authenticated;
