-- Adicionar coluna para rastrear quando usuário recusa responder
ALTER TABLE sessoes_questionarios 
ADD COLUMN recusou_responder BOOLEAN DEFAULT FALSE;

-- Atualizar comentário da tabela
COMMENT ON COLUMN sessoes_questionarios.recusou_responder IS 'Indica se o usuário recusou responder o questionário';

-- Verificar estrutura atualizada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'sessoes_questionarios'
ORDER BY ordinal_position;
