-- CORREÇÃO SEGURA - DROP e RECREATE das funções
-- Para evitar erro de mudança de tipo de retorno

-- 1. DROP das funções existentes
DROP FUNCTION IF EXISTS public.get_user_by_id(uuid);
DROP FUNCTION IF EXISTS public.authenticate_user(text, text);
DROP FUNCTION IF EXISTS public.create_user(character varying, character varying, character varying, character varying, character varying, character varying);

-- 2. RECRIAR get_user_by_id com primeiro_login
CREATE OR REPLACE FUNCTION public.get_user_by_id(user_id uuid)
 RETURNS TABLE(
    id uuid, 
    email character varying, 
    nome character varying, 
    cargo character varying, 
    tipo_usuario character varying, 
    ativo boolean, 
    pode_ver_feedbacks boolean, 
    primeiro_login boolean,  -- ✅ ADICIONADO
    setor text, 
    created_at timestamp with time zone, 
    updated_at timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY 
    SELECT 
        u.id,
        u.email,
        u.nome,
        u.cargo,
        u.tipo_usuario,
        u.ativo,
        COALESCE(u.pode_ver_feedbacks, false) as pode_ver_feedbacks,
        COALESCE(u.primeiro_login, true) as primeiro_login,  -- ✅ ADICIONADO
        u.setor,
        u.created_at,
        u.updated_at
    FROM public.usuarios u
    WHERE u.id = user_id AND u.ativo = true;
END;
$function$;

-- 3. RECRIAR create_user com primeiro_login no INSERT
CREATE OR REPLACE FUNCTION public.create_user(
    user_email character varying, 
    user_password character varying, 
    user_nome character varying, 
    user_cargo character varying DEFAULT NULL::character varying, 
    user_telefone character varying DEFAULT NULL::character varying, 
    user_tipo character varying DEFAULT 'usuario'::character varying
)
 RETURNS TABLE(id uuid, success boolean, message character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    new_user_id UUID;
BEGIN
    -- Verificar se email já existe
    IF EXISTS (SELECT 1 FROM usuarios WHERE email = user_email) THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Email já cadastrado'::VARCHAR;
        RETURN;
    END IF;
    
    -- Inserir novo usuário (✅ ADICIONADO primeiro_login = TRUE)
    INSERT INTO usuarios (email, senha, nome, cargo, telefone, tipo_usuario, ativo, primeiro_login)
    VALUES (user_email, user_password, user_nome, user_cargo, user_telefone, user_tipo, true, true)
    RETURNING usuarios.id INTO new_user_id;
    
    RETURN QUERY SELECT new_user_id, true, 'Usuário criado com sucesso'::VARCHAR;
END;
$function$;

-- 4. RECRIAR authenticate_user com primeiro_login
CREATE OR REPLACE FUNCTION public.authenticate_user(user_email text, user_password text)
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
    primeiro_login boolean,  -- ✅ ADICIONADO
    success boolean
 )
 LANGUAGE plpgsql
AS $function$
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
    u.ultimo_acesso,
    u.created_at,
    u.updated_at,
    u.senha,
    u.role,
    u.pode_ver_feedbacks,
    COALESCE(u.primeiro_login, true) as primeiro_login,  -- ✅ ADICIONADO
    (u.senha = user_password) AS success  -- comparação direta sem hash
  FROM usuarios u
  WHERE u.email = user_email;
END;
$function$;

-- 5. GARANTIR PERMISSÕES
GRANT EXECUTE ON FUNCTION public.get_user_by_id(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user(character varying, character varying, character varying, character varying, character varying, character varying) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_user(text, text) TO anon, authenticated;

-- 6. VERIFICAR SE FUNCIONOU
SELECT 
    'Funções recriadas com sucesso' as status,
    COUNT(*) as total_funcoes
FROM pg_proc 
WHERE proname IN ('authenticate_user', 'create_user', 'get_user_by_id');

-- 7. TESTE com o usuário que tem primeiro_login = true
SELECT 
    'Teste da função authenticate_user' as teste,
    id,
    email,
    nome,
    primeiro_login,
    success
FROM authenticate_user('higorz.almeida@gmail.com', 'senha_aqui') -- substitua pela senha real
LIMIT 1;
