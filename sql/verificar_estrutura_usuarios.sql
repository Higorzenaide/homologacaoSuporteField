-- Verificar estrutura da tabela usuarios personalizada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- Verificar se primeiro_login existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'usuarios' 
            AND column_name = 'primeiro_login'
        ) THEN 'Campo primeiro_login EXISTE'
        ELSE 'Campo primeiro_login NÃO EXISTE - precisa adicionar'
    END as status_campo;

-- Se não existir, executar:
-- ALTER TABLE usuarios ADD COLUMN primeiro_login BOOLEAN DEFAULT TRUE;

-- Verificar usuários existentes
SELECT 
    id,
    email,
    nome,
    primeiro_login,
    created_at
FROM usuarios 
ORDER BY created_at DESC 
LIMIT 5;
