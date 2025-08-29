-- Criar/Atualizar função create_user para tabela usuarios personalizada
-- (garantindo que primeiro_login seja sempre TRUE para novos usuários)

-- 1. REMOVER FUNÇÃO EXISTENTE SE HOUVER
DROP FUNCTION IF EXISTS create_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- 2. CRIAR NOVA FUNÇÃO create_user
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

    -- Gerar hash da senha (assumindo que você usa crypt)
    -- Se não usar crypt, ajuste conforme sua implementação
    hashed_password := crypt(user_password, gen_salt('bf'));
    
    -- Gerar UUID
    user_id := gen_random_uuid();

    -- Inserir usuário na tabela personalizada
    INSERT INTO usuarios (
        id, 
        email, 
        senha, 
        nome, 
        cargo, 
        telefone, 
        tipo_usuario, 
        ativo,
        primeiro_login, -- SEMPRE TRUE para novos usuários
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
        TRUE,           -- ativo
        TRUE,           -- primeiro_login = TRUE
        NOW(),
        NOW()
    );

    RETURN QUERY SELECT user_id, TRUE, 'Usuário criado com sucesso';
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Erro ao criar usuário: ' || SQLERRM;
END;
$$;

-- 3. FUNÇÃO PARA AUTENTICAÇÃO (se não existir)
CREATE OR REPLACE FUNCTION authenticate_user(user_email TEXT, user_password TEXT)
RETURNS TABLE (
    id UUID,
    email TEXT,
    nome TEXT,
    cargo TEXT,
    telefone TEXT,
    tipo_usuario TEXT,
    ativo BOOLEAN,
    pode_ver_feedbacks BOOLEAN,
    primeiro_login BOOLEAN,
    setor TEXT,
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
        u.telefone,
        u.tipo_usuario,
        u.ativo,
        COALESCE(u.pode_ver_feedbacks, FALSE) as pode_ver_feedbacks,
        COALESCE(u.primeiro_login, TRUE) as primeiro_login, -- Default TRUE se NULL
        u.setor,
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

-- 4. FUNÇÃO PARA BUSCAR USUÁRIO POR ID
CREATE OR REPLACE FUNCTION get_user_by_id(user_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    nome TEXT,
    cargo TEXT,
    telefone TEXT,
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
        u.telefone,
        u.tipo_usuario,
        u.ativo,
        COALESCE(u.pode_ver_feedbacks, FALSE) as pode_ver_feedbacks,
        COALESCE(u.primeiro_login, TRUE) as primeiro_login, -- Default TRUE se NULL
        u.setor
    FROM usuarios u
    WHERE u.id = user_id
    AND u.ativo = TRUE
    LIMIT 1;
END;
$$;

-- 5. GARANTIR PERMISSÕES
GRANT EXECUTE ON FUNCTION create_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION authenticate_user(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_by_id(UUID) TO anon, authenticated;

-- 6. TESTE DA CONFIGURAÇÃO
SELECT 
    'Funções criadas com sucesso' as status,
    COUNT(*) as total_funcoes
FROM pg_proc 
WHERE proname IN ('create_user', 'authenticate_user', 'get_user_by_id');

-- 7. VERIFICAR USUÁRIOS COM primeiro_login
SELECT 
    'Status dos usuários' as info,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE primeiro_login = TRUE) as primeiro_login_true,
    COUNT(*) FILTER (WHERE primeiro_login = FALSE) as primeiro_login_false
FROM usuarios;
