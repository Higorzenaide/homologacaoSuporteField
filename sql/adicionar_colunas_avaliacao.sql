-- Adicionar colunas para avaliação das respostas
ALTER TABLE respostas_questionarios 
ADD COLUMN IF NOT EXISTS correta BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pontos_obtidos INTEGER DEFAULT 0;

-- Adicionar comentários
COMMENT ON COLUMN respostas_questionarios.correta IS 'Indica se a resposta está correta';
COMMENT ON COLUMN respostas_questionarios.pontos_obtidos IS 'Pontos obtidos pela resposta';

-- Verificar estrutura atualizada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'respostas_questionarios'
ORDER BY ordinal_position;
