-- Corrigir tabela usuarios personalizada para incluir primeiro_login
-- (SEM usar auth do Supabase)

-- 1. ADICIONAR CAMPO primeiro_login SE NÃO EXISTIR
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS primeiro_login BOOLEAN DEFAULT TRUE;

-- 2. COMENTÁRIO DA COLUNA
COMMENT ON COLUMN usuarios.primeiro_login IS 'Indica se é o primeiro login do usuário (requer alteração de senha)';

-- 3. ATUALIZAR USUÁRIOS EXISTENTES
-- Usuários criados antes da implementação não devem ser considerados primeiro login
UPDATE usuarios 
SET primeiro_login = FALSE 
WHERE primeiro_login IS NULL 
OR (created_at < NOW() - INTERVAL '1 day');

-- 4. GARANTIR QUE NOVOS USUÁRIOS SEJAM CRIADOS COM primeiro_login = TRUE
-- Atualizar função create_user se ela existir na sua implementação
DO $$
BEGIN
    -- Verificar se existe a função create_user
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE n.nspname = 'public' AND p.proname = 'create_user'
    ) THEN
        RAISE NOTICE 'Função create_user encontrada - você pode precisar atualizá-la manualmente';
    ELSE
        RAISE NOTICE 'Função create_user não encontrada - isso é normal se você cria usuários via INSERT direto';
    END IF;
END $$;

-- 5. VERIFICAR SE TUDO ESTÁ CORRETO
SELECT 
    'Verificação final' as teste,
    COUNT(*) as total_usuarios,
    COUNT(*) FILTER (WHERE primeiro_login = TRUE) as usuarios_primeiro_login,
    COUNT(*) FILTER (WHERE primeiro_login = FALSE) as usuarios_normal
FROM usuarios;

-- 6. MOSTRAR ESTRUTURA ATUALIZADA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND column_name IN ('id', 'email', 'nome', 'primeiro_login')
ORDER BY 
    CASE column_name 
        WHEN 'id' THEN 1
        WHEN 'email' THEN 2  
        WHEN 'nome' THEN 3
        WHEN 'primeiro_login' THEN 4
    END;
