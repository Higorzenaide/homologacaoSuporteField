-- 🔒 CORREÇÕES CRÍTICAS DE SEGURANÇA
-- EXECUTAR IMEDIATAMENTE EM PRODUÇÃO

-- ================================
-- 1. HABILITAR EXTENSÃO PGCRYPTO
-- ================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ================================
-- 2. FUNÇÃO PARA MIGRAR SENHAS EXISTENTES
-- ================================
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
    -- (assumindo que senhas hasheadas começam com $2)
    FOR user_record IN 
        SELECT id, senha 
        FROM usuarios 
        WHERE senha NOT LIKE '$2%' AND senha IS NOT NULL
    LOOP
        -- Hash da senha existente
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

-- ================================
-- 3. FUNÇÃO DE AUTENTICAÇÃO SEGURA
-- ================================
DROP FUNCTION IF EXISTS public.authenticate_user(text, text);

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
DECLARE
    attempt_count INTEGER;
    last_attempt TIMESTAMP;
    ip_address TEXT := current_setting('request.jwt.claims', true)::json->>'ip';
BEGIN
    -- Rate limiting básico (opcional, pode ser implementado no frontend)
    -- SELECT COUNT(*), MAX(created_at) INTO attempt_count, last_attempt
    -- FROM auth_attempts 
    -- WHERE email = user_email AND created_at > NOW() - INTERVAL '15 minutes';
    
    -- IF attempt_count >= 5 THEN
    --     RETURN QUERY SELECT NULL::UUID, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE;
    --     RETURN;
    -- END IF;

    -- Log da tentativa (para auditoria)
    INSERT INTO auth_attempts (email, ip_address, success, created_at)
    VALUES (user_email, COALESCE(ip_address, 'unknown'), FALSE, NOW())
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
                 -- Verificar hash ou senha em texto plano (compatibilidade)
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

-- ================================
-- 4. FUNÇÃO PARA CRIAR USUÁRIO COM SENHA HASHEADA
-- ================================
DROP FUNCTION IF EXISTS public.create_user(character varying, character varying, character varying, character varying, character varying, character varying);

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
    -- Validações de entrada
    IF user_email IS NULL OR LENGTH(TRIM(user_email)) = 0 THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Email é obrigatório'::VARCHAR;
        RETURN;
    END IF;
    
    IF user_password IS NULL OR LENGTH(user_password) < 6 THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Senha deve ter pelo menos 6 caracteres'::VARCHAR;
        RETURN;
    END IF;
    
    IF user_nome IS NULL OR LENGTH(TRIM(user_nome)) < 2 THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Nome deve ter pelo menos 2 caracteres'::VARCHAR;
        RETURN;
    END IF;
    
    IF user_tipo NOT IN ('admin', 'usuario') THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Tipo de usuário inválido'::VARCHAR;
        RETURN;
    END IF;
    
    -- Validar formato do email
    IF user_email !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Formato de email inválido'::VARCHAR;
        RETURN;
    END IF;
    
    -- Verificar se email já existe
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
    
    -- Log da criação (para auditoria)
    INSERT INTO user_actions (user_id, action, details, created_at)
    VALUES (new_user_id, 'USER_CREATED', jsonb_build_object('email', user_email, 'tipo', user_tipo), NOW())
    ON CONFLICT DO NOTHING;
    
    RETURN QUERY SELECT new_user_id, true, 'Usuário criado com sucesso'::VARCHAR;
END;
$$;

-- ================================
-- 5. FUNÇÃO PARA ALTERAR SENHA COM HASH
-- ================================
DROP FUNCTION IF EXISTS public.update_user_password_first_login(UUID, VARCHAR);

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
    -- Validações
    IF p_new_password IS NULL OR LENGTH(p_new_password) < 6 THEN
        RETURN QUERY SELECT FALSE, 'Senha deve ter pelo menos 6 caracteres'::VARCHAR;
        RETURN;
    END IF;
    
    -- Verificar se usuário existe
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = p_user_id) THEN
        RETURN QUERY SELECT FALSE, 'Usuário não encontrado'::VARCHAR;
        RETURN;
    END IF;
    
    -- Hash da nova senha
    hashed_password := crypt(p_new_password, gen_salt('bf', 10));
    
    -- Atualizar senha e status de primeiro login
    UPDATE public.usuarios
    SET
        senha = hashed_password,
        primeiro_login = FALSE,
        updated_at = NOW()
    WHERE id = p_user_id;

    IF FOUND THEN
        -- Log da alteração
        INSERT INTO user_actions (user_id, action, details, created_at)
        VALUES (p_user_id, 'PASSWORD_CHANGED', jsonb_build_object('first_login', true), NOW())
        ON CONFLICT DO NOTHING;
        
        RETURN QUERY SELECT TRUE, 'Senha alterada com sucesso'::VARCHAR;
    ELSE
        RETURN QUERY SELECT FALSE, 'Erro ao alterar senha'::VARCHAR;
    END IF;
END;
$$;

-- ================================
-- 6. TABELA PARA AUDITORIA DE TENTATIVAS DE LOGIN
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

-- ================================
-- 7. TABELA PARA AUDITORIA DE AÇÕES DE USUÁRIO
-- ================================
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
-- 8. CONFIGURAR PERMISSÕES
-- ================================
GRANT EXECUTE ON FUNCTION public.authenticate_user_secure(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_secure(character varying, character varying, character varying, character varying, character varying, character varying) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_password_first_login_secure(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_passwords_to_hash() TO authenticated;

-- ================================
-- 9. EXECUTAR MIGRAÇÃO DE SENHAS
-- ================================
-- CUIDADO: Execute apenas uma vez!
-- SELECT migrate_passwords_to_hash();

-- ================================
-- 10. LIMPEZA AUTOMÁTICA DE LOGS ANTIGOS
-- ================================
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Manter apenas logs dos últimos 90 dias
    DELETE FROM auth_attempts WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    DELETE FROM user_actions WHERE created_at < NOW() - INTERVAL '90 days';
    
    RETURN deleted_count;
END;
$$;

-- ================================
-- INSTRUÇÕES DE EXECUÇÃO
-- ================================
/*
ATENÇÃO: Execute os comandos na seguinte ordem:

1. Execute todo o script acima EXCETO a linha SELECT migrate_passwords_to_hash();

2. Teste a nova função:
   SELECT * FROM authenticate_user_secure('email@test.com', 'senha123');

3. Se tudo funcionar, execute a migração:
   SELECT migrate_passwords_to_hash();

4. Atualize o código frontend para usar as novas funções:
   - authenticate_user_secure
   - create_user_secure  
   - update_user_password_first_login_secure

5. Configure limpeza automática (opcional):
   SELECT cron.schedule('cleanup-logs', '0 2 * * *', 'SELECT cleanup_old_logs();');
*/
