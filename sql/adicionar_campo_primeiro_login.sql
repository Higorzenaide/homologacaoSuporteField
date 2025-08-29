-- Adicionar campo para controlar primeiro login
ALTER TABLE usuarios 
ADD COLUMN primeiro_login BOOLEAN DEFAULT TRUE;

-- Comentário da coluna
COMMENT ON COLUMN usuarios.primeiro_login IS 'Indica se é o primeiro login do usuário (requer alteração de senha)';

-- Atualizar usuários existentes para não serem considerados primeiro login
UPDATE usuarios 
SET primeiro_login = FALSE 
WHERE created_at < NOW();

-- Verificar a estrutura
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND column_name = 'primeiro_login';
