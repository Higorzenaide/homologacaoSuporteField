-- Corrigir função authenticate_user para incluir primeiro_login
-- E garantir que get_user_by_id também inclua este campo

-- 1. CRIAR/ATUALIZAR FUNÇÃO authenticate_user
CREATE OR REPLACE FUNCTION authenticate_user(user_email TEXT, user_password TEXT)
RETURNS TABLE (
    id UUID,
    email TEXT,
    nome TEXT,
    cargo TEXT,
    tipo_usuario TEXT,
    ativo BOOLEAN,
    pode_ver_feedbacks BOOLEAN,
    primeiro_login BOOLEAN,
    success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.nome,
        u.cargo,
        u.tipo_usuario,
        u.ativo,
        u.pode_ver_feedbacks,
        COALESCE(u.primeiro_login, TRUE) as primeiro_login, -- Default TRUE se NULL
        CASE 
            WHEN u.id IS NOT NULL AND u.ativo = TRUE AND u.senha = crypt(user_password, u.senha) 
            THEN TRUE 
            ELSE FALSE 
        END as success
    FROM usuarios u
    WHERE u.email = user_email
    LIMIT 1;
END;
$$;

-- 2. CRIAR/ATUALIZAR FUNÇÃO get_user_by_id
CREATE OR REPLACE FUNCTION get_user_by_id(user_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    nome TEXT,
    cargo TEXT,
    tipo_usuario TEXT,
    ativo BOOLEAN,
    pode_ver_feedbacks BOOLEAN,
    primeiro_login BOOLEAN,
    setor TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.nome,
        u.cargo,
        u.tipo_usuario,
        u.ativo,
        u.pode_ver_feedbacks,
        COALESCE(u.primeiro_login, TRUE) as primeiro_login, -- Default TRUE se NULL
        u.setor
    FROM usuarios u
    WHERE u.id = user_id
    AND u.ativo = TRUE
    LIMIT 1;
END;
$$;

-- 3. GARANTIR QUE NOVOS USUÁRIOS TÊM primeiro_login = TRUE
-- Atualizar a função create_user se ela existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_user') THEN
        -- Atualizar função existente
        DROP FUNCTION IF EXISTS create_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
    END IF;
END $$;

CREATE OR REPLACE FUNCTION create_user(
    user_email TEXT,
    user_password TEXT,
    user_nome TEXT,
    user_cargo TEXT DEFAULT NULL,
    user_telefone TEXT DEFAULT NULL,
    user_tipo TEXT DEFAULT 'usuario'
)
RETURNS TABLE (
    id UUID,
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    hashed_password TEXT;
BEGIN
    -- Verificar se email já existe
    IF EXISTS (SELECT 1 FROM usuarios WHERE email = user_email) THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Email já está em uso';
        RETURN;
    END IF;

    -- Gerar hash da senha
    hashed_password := crypt(user_password, gen_salt('bf'));
    
    -- Gerar UUID
    user_id := gen_random_uuid();

    -- Inserir usuário
    INSERT INTO usuarios (
        id, 
        email, 
        senha, 
        nome, 
        cargo, 
        telefone, 
        tipo_usuario, 
        ativo,
        primeiro_login,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        user_email,
        hashed_password,
        user_nome,
        user_cargo,
        user_telefone,
        user_tipo,
        TRUE,
        TRUE, -- SEMPRE TRUE para novos usuários
        NOW(),
        NOW()
    );

    RETURN QUERY SELECT user_id, TRUE, 'Usuário criado com sucesso';
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Erro ao criar usuário: ' || SQLERRM;
END;
$$;

-- 4. GARANTIR PERMISSÕES
GRANT EXECUTE ON FUNCTION authenticate_user(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_by_id(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- 5. VERIFICAR ESTRUTURA DA TABELA
DO $$
BEGIN
    -- Verificar se a coluna primeiro_login existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'primeiro_login'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN primeiro_login BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 6. ATUALIZAR USUÁRIOS EXISTENTES
-- Usuários criados antes da implementação não devem ser considerados primeiro login
UPDATE usuarios 
SET primeiro_login = FALSE 
WHERE primeiro_login IS NULL 
OR (created_at < NOW() - INTERVAL '1 day' AND primeiro_login = TRUE);

-- 7. VERIFICAR CONFIGURAÇÃO
SELECT 
    'Verificação da função authenticate_user' as teste,
    proname as funcao,
    prorettype::regtype as retorno
FROM pg_proc 
WHERE proname = 'authenticate_user';

SELECT 
    'Verificação da função get_user_by_id' as teste,
    proname as funcao,
    prorettype::regtype as retorno
FROM pg_proc 
WHERE proname = 'get_user_by_id';

SELECT 
    'Verificação da coluna primeiro_login' as teste,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND column_name = 'primeiro_login';
