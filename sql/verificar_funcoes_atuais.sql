-- VERIFICAR FUNÇÕES ATUAIS - SEM ALTERAR NADA!
-- Execute isso primeiro para ver como estão as funções antes de modificar

-- 1. LISTAR TODAS AS FUNÇÕES RELACIONADAS A USUÁRIOS
SELECT 
    p.proname as nome_funcao,
    p.prorettype::regtype as tipo_retorno,
    pg_get_function_arguments(p.oid) as parametros,
    pg_get_functiondef(p.oid) as definicao_completa
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace 
WHERE n.nspname = 'public' 
AND (
    p.proname LIKE '%user%' 
    OR p.proname LIKE '%authenticate%'
    OR p.proname LIKE '%create_user%'
    OR p.proname LIKE '%get_user%'
)
ORDER BY p.proname;

-- 2. VERIFICAR ESPECIFICAMENTE AS FUNÇÕES QUE USAMOS
SELECT 
    'Verificação de funções específicas' as titulo,
    proname as funcao,
    CASE 
        WHEN proname = 'authenticate_user' THEN 'EXISTE'
        WHEN proname = 'create_user' THEN 'EXISTE' 
        WHEN proname = 'get_user_by_id' THEN 'EXISTE'
        ELSE 'OUTRA'
    END as status
FROM pg_proc 
WHERE proname IN ('authenticate_user', 'create_user', 'get_user_by_id');

-- 3. VER DEFINIÇÃO DA FUNÇÃO authenticate_user (se existir)
SELECT 
    'Definição da authenticate_user' as titulo,
    pg_get_functiondef(oid) as codigo_atual
FROM pg_proc 
WHERE proname = 'authenticate_user'
LIMIT 1;

-- 4. VER DEFINIÇÃO DA FUNÇÃO create_user (se existir)  
SELECT 
    'Definição da create_user' as titulo,
    pg_get_functiondef(oid) as codigo_atual
FROM pg_proc 
WHERE proname = 'create_user'
LIMIT 1;

-- 5. VER DEFINIÇÃO DA FUNÇÃO get_user_by_id (se existir)
SELECT 
    'Definição da get_user_by_id' as titulo,
    pg_get_functiondef(oid) as codigo_atual
FROM pg_proc 
WHERE proname = 'get_user_by_id'
LIMIT 1;

-- 6. VERIFICAR ESTRUTURA ATUAL DA TABELA USUARIOS
SELECT 
    'Estrutura da tabela usuarios' as titulo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;
