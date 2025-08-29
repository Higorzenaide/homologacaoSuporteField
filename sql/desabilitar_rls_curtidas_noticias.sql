-- 🔓 DESABILITAR RLS NA TABELA CURTIDAS_NOTICIAS
-- Execute este script para resolver o erro de acesso à tabela curtidas_noticias

-- ================================
-- 1. DESABILITAR ROW LEVEL SECURITY
-- ================================
ALTER TABLE curtidas_noticias DISABLE ROW LEVEL SECURITY;

-- ================================
-- 2. REMOVER POLÍTICAS EXISTENTES (opcional)
-- ================================
DROP POLICY IF EXISTS "Todos podem visualizar curtidas de notícias" ON curtidas_noticias;
DROP POLICY IF EXISTS "Usuários autenticados podem curtir notícias" ON curtidas_noticias;
DROP POLICY IF EXISTS "Usuários podem descurtir suas próprias curtidas de notícias" ON curtidas_noticias;

-- ================================
-- 3. VERIFICAR SE RLS FOI DESABILITADO
-- ================================
SELECT 
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'curtidas_noticias' 
AND schemaname = 'public';

-- ================================
-- RESULTADO ESPERADO:
-- ================================
/*
Após executar este script:
- rowsecurity deve ser FALSE
- As consultas à tabela curtidas_noticias devem funcionar normalmente
- O erro de acesso deve ser resolvido
*/

-- ================================
-- NOTAS IMPORTANTES:
-- ================================
/*
1. Este script desabilita as políticas de segurança RLS
2. Como você não usa RLS no projeto, isso é seguro
3. O acesso à tabela será controlado pela sua aplicação
4. Mantenha a segurança através de validações no código
*/
