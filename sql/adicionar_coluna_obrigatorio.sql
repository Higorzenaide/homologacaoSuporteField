-- Script para adicionar coluna obrigatorio na tabela treinamentos

-- Adicionar coluna obrigatorio se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'treinamentos' AND column_name = 'obrigatorio') THEN
        ALTER TABLE treinamentos ADD COLUMN obrigatorio BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Adicionar coluna prazo_limite se não existir (para lembretes)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'treinamentos' AND column_name = 'prazo_limite') THEN
        ALTER TABLE treinamentos ADD COLUMN prazo_limite TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_treinamentos_obrigatorio ON treinamentos(obrigatorio);
CREATE INDEX IF NOT EXISTS idx_treinamentos_prazo_limite ON treinamentos(prazo_limite);

-- Comentários
COMMENT ON COLUMN treinamentos.obrigatorio IS 'Indica se o treinamento é obrigatório para todos os usuários';
COMMENT ON COLUMN treinamentos.prazo_limite IS 'Data limite para conclusão do treinamento obrigatório';
