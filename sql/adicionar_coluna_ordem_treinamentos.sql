-- ========================================
-- Adicionar Coluna de Ordem aos Treinamentos
-- ========================================

-- Adicionar coluna ordem se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'treinamentos' AND column_name = 'ordem') THEN
        ALTER TABLE treinamentos ADD COLUMN ordem INTEGER DEFAULT 0;
        
        -- Definir ordem inicial baseada na data de criação (mais antigos primeiro)
        WITH ranked_treinamentos AS (
            SELECT id, row_number() OVER (ORDER BY created_at ASC) as nova_ordem
            FROM treinamentos 
            WHERE ordem = 0 OR ordem IS NULL
        )
        UPDATE treinamentos 
        SET ordem = ranked_treinamentos.nova_ordem
        FROM ranked_treinamentos
        WHERE treinamentos.id = ranked_treinamentos.id;
        
        RAISE NOTICE 'Coluna ordem adicionada com valores iniciais baseados na data de criação';
    ELSE
        RAISE NOTICE 'Coluna ordem já existe na tabela treinamentos';
    END IF;
END $$;

-- Criar índice para melhor performance na ordenação
CREATE INDEX IF NOT EXISTS idx_treinamentos_ordem ON treinamentos(ordem);

-- Função para reordenar automaticamente quando inserir novo treinamento
CREATE OR REPLACE FUNCTION auto_order_new_training()
RETURNS TRIGGER AS $$
BEGIN
    -- Se ordem não foi especificada, colocar no final
    IF NEW.ordem IS NULL OR NEW.ordem = 0 THEN
        SELECT COALESCE(MAX(ordem), 0) + 1 INTO NEW.ordem FROM treinamentos WHERE ativo = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para aplicar ordem automática em novos treinamentos
DROP TRIGGER IF EXISTS trigger_auto_order_training ON treinamentos;
CREATE TRIGGER trigger_auto_order_training
    BEFORE INSERT ON treinamentos
    FOR EACH ROW
    EXECUTE FUNCTION auto_order_new_training();

-- Comentário na coluna
COMMENT ON COLUMN treinamentos.ordem IS 'Ordem de exibição dos treinamentos (drag and drop)';

-- Verificação final
SELECT 'Coluna ordem adicionada com sucesso aos treinamentos!' AS resultado;
