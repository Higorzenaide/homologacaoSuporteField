-- 🔒 IMPLEMENTAÇÃO SEGURA DE MELHORIAS - PASSO A PASSO
-- EXECUTE EM ORDEM, TESTANDO CADA PASSO!

-- ================================
-- PASSO 1: PREPARAR AMBIENTE
-- ================================

-- Verificar se extensão já existe
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

-- Se não existir, criar (precisa de permissão)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ================================
-- PASSO 2: CRIAR TABELAS DE AUDITORIA (SEGURO)
-- ================================

CREATE TABLE IF NOT EXISTS auth_attempts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    success BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_attempts_email_date ON auth_attempts(email, created_at);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip_date ON auth_attempts(ip_address, created_at);

CREATE TABLE IF NOT EXISTS user_actions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES usuarios(id),
    action VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_actions_user_date ON user_actions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_actions_action ON user_actions(action);

-- ================================
-- PASSO 3: CRIAR NOVAS FUNÇÕES (SEM DROPAR AS ANTIGAS)
-- ================================

-- 3.1 FUNÇÃO DE MIGRAÇÃO (apenas criar, não executar ainda)
CREATE OR REPLACE FUNCTION migrate_passwords_to_hash()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    migrated_count INTEGER := 0;
BEGIN
    -- Migrar apenas senhas que ainda estão em texto plano
    FOR user_record IN 
        SELECT id, senha 
        FROM usuarios 
        WHERE senha NOT LIKE '$2%' AND senha IS NOT NULL
    LOOP
        UPDATE usuarios 
        SET 
            senha = crypt(user_record.senha, gen_salt('bf', 10)),
            updated_at = NOW()
        WHERE id = user_record.id;
        
        migrated_count := migrated_count + 1;
    END LOOP;
    
    RETURN migrated_count;
END;
$$;

-- 3.2 NOVA FUNÇÃO DE AUTENTICAÇÃO (COM NOME DIFERENTE)
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
    
    -- Atualizar sucesso se autenticado
    UPDATE auth_attempts 
    SET success = TRUE 
    WHERE email = user_email 
    AND created_at = (SELECT MAX(created_at) FROM auth_attempts WHERE email = user_email)
    AND EXISTS (
        SELECT 1 FROM usuarios u 
        WHERE u.email = user_email AND u.ativo = TRUE AND
        (u.senha = crypt(user_password, u.senha) OR 
         (u.senha NOT LIKE '$2%' AND u.senha = user_password))
    );
END;
$$;

-- 3.3 NOVA FUNÇÃO DE CRIAÇÃO DE USUÁRIO
CREATE OR REPLACE FUNCTION public.create_user_secure(
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
AS $$
DECLARE
    new_user_id UUID;
    hashed_password TEXT;
BEGIN
    -- Validações básicas
    IF user_email IS NULL OR LENGTH(TRIM(user_email)) = 0 THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Email é obrigatório'::VARCHAR;
        RETURN;
    END IF;
    
    IF user_password IS NULL OR LENGTH(user_password) < 6 THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Senha deve ter pelo menos 6 caracteres'::VARCHAR;
        RETURN;
    END IF;
    
    IF EXISTS (SELECT 1 FROM usuarios WHERE email = user_email) THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Email já cadastrado'::VARCHAR;
        RETURN;
    END IF;
    
    -- Hash da senha
    hashed_password := crypt(user_password, gen_salt('bf', 10));
    
    -- Inserir novo usuário
    INSERT INTO usuarios (email, senha, nome, cargo, telefone, tipo_usuario, ativo, primeiro_login, created_at)
    VALUES (user_email, hashed_password, TRIM(user_nome), user_cargo, user_telefone, user_tipo, true, true, NOW())
    RETURNING usuarios.id INTO new_user_id;
    
    -- Log da criação
    INSERT INTO user_actions (user_id, action, details, created_at)
    VALUES (new_user_id, 'USER_CREATED', jsonb_build_object('email', user_email, 'tipo', user_tipo), NOW())
    ON CONFLICT DO NOTHING;
    
    RETURN QUERY SELECT new_user_id, true, 'Usuário criado com sucesso'::VARCHAR;
END;
$$;

-- 3.4 NOVA FUNÇÃO DE ALTERAÇÃO DE SENHA
CREATE OR REPLACE FUNCTION public.update_user_password_first_login_secure(
    p_user_id UUID,
    p_new_password VARCHAR
)
RETURNS TABLE(success BOOLEAN, message VARCHAR)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    hashed_password TEXT;
BEGIN
    IF p_new_password IS NULL OR LENGTH(p_new_password) < 6 THEN
        RETURN QUERY SELECT FALSE, 'Senha deve ter pelo menos 6 caracteres'::VARCHAR;
        RETURN;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = p_user_id) THEN
        RETURN QUERY SELECT FALSE, 'Usuário não encontrado'::VARCHAR;
        RETURN;
    END IF;
    
    -- Hash da nova senha
    hashed_password := crypt(p_new_password, gen_salt('bf', 10));
    
    UPDATE public.usuarios
    SET
        senha = hashed_password,
        primeiro_login = FALSE,
        updated_at = NOW()
    WHERE id = p_user_id;

    IF FOUND THEN
        INSERT INTO user_actions (user_id, action, details, created_at)
        VALUES (p_user_id, 'PASSWORD_CHANGED', jsonb_build_object('first_login', true), NOW())
        ON CONFLICT DO NOTHING;
        
        RETURN QUERY SELECT TRUE, 'Senha alterada com sucesso'::VARCHAR;
    ELSE
        RETURN QUERY SELECT FALSE, 'Erro ao alterar senha'::VARCHAR;
    END IF;
END;
$$;

-- 3.5 FUNÇÃO DE LIMPEZA
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM auth_attempts WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    DELETE FROM user_actions WHERE created_at < NOW() - INTERVAL '90 days';
    RETURN deleted_count;
END;
$$;

-- ================================
-- PASSO 4: TESTAR NOVAS FUNÇÕES
-- ================================

-- TESTE 1: Verificar se pgcrypto está funcionando
SELECT crypt('teste123', gen_salt('bf', 10));

-- TESTE 2: Verificar autenticação (substitua por dados reais)
-- SELECT * FROM authenticate_user_secure('email_existente@test.com', 'senha_existente');

-- TESTE 3: Verificar criação de usuário de teste
-- SELECT * FROM create_user_secure('teste_seguranca@test.com', 'senha123456', 'Teste Segurança');

-- ================================
-- PASSO 5: CONFIGURAR PERMISSÕES
-- ================================

GRANT EXECUTE ON FUNCTION public.authenticate_user_secure(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_secure(character varying, character varying, character varying, character varying, character varying, character varying) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_password_first_login_secure(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_passwords_to_hash() TO authenticated;

-- ================================
-- INSTRUÇÕES PARA CONTINUAR
-- ================================

/*
🚨 ATENÇÃO: ATÉ AQUI É SEGURO! 

AGORA VOCÊ PRECISA:

1. ✅ ATUALIZAR O CÓDIGO FRONTEND para usar as novas funções:
   - authenticate_user_secure (em vez de authenticate_user)
   - create_user_secure (em vez de create_user)
   - update_user_password_first_login_secure

2. ✅ TESTAR TUDO EM HOMOLOGAÇÃO

3. ⚠️ SÓ DEPOIS fazer a migração das senhas:
   SELECT migrate_passwords_to_hash();

4. ⚠️ SÓ NO FINAL dropar as funções antigas:
   DROP FUNCTION IF EXISTS public.authenticate_user(text, text);
   DROP FUNCTION IF EXISTS public.create_user(...);

NUNCA EXECUTE A MIGRAÇÃO DE SENHAS ANTES DE ATUALIZAR O CÓDIGO!
*/
