-- Teste do sistema de primeiro_login

-- 1. VERIFICAR ESTRUTURA ATUAL
SELECT 
    'Estrutura da tabela usuarios' as teste,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND column_name IN ('id', 'email', 'nome', 'primeiro_login', 'created_at')
ORDER BY ordinal_position;

-- 2. VERIFICAR USUÁRIOS EXISTENTES
SELECT 
    'Usuários existentes' as teste,
    id,
    email,
    nome,
    primeiro_login,
    created_at
FROM usuarios 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. TESTAR CRIAÇÃO DE USUÁRIO (OPCIONAL - CUIDADO!)
-- Descomente apenas se quiser testar:
/*
SELECT * FROM create_user(
    'teste@exemplo.com',
    'senha123',
    'Usuário Teste',
    'Cargo Teste',
    '(11) 99999-9999',
    'usuario'
);

-- Verificar se foi criado com primeiro_login = TRUE
SELECT 
    'Usuário teste criado' as resultado,
    email,
    nome,
    primeiro_login,
    ativo
FROM usuarios 
WHERE email = 'teste@exemplo.com';
*/

-- 4. VERIFICAR FUNÇÕES
SELECT 
    'Funções disponíveis' as teste,
    proname as funcao,
    prorettype::regtype as retorno
FROM pg_proc 
WHERE proname IN ('create_user', 'authenticate_user', 'get_user_by_id')
ORDER BY proname;
