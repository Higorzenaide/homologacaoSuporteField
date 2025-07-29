-- Schema para sistema de interação em treinamentos (comentários, curtidas e logos)

-- Adicionar coluna logo_url na tabela treinamentos
ALTER TABLE treinamentos 
ADD COLUMN logo_url TEXT;

-- Tabela para curtidas nos treinamentos
CREATE TABLE IF NOT EXISTS treinamento_curtidas (
    id SERIAL PRIMARY KEY,
    treinamento_id INTEGER NOT NULL REFERENCES treinamentos(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(treinamento_id, usuario_id) -- Evita curtidas duplicadas
);

-- Tabela para comentários nos treinamentos
CREATE TABLE IF NOT EXISTS treinamento_comentarios (
    id SERIAL PRIMARY KEY,
    treinamento_id INTEGER NOT NULL REFERENCES treinamentos(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    comentario TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_treinamento_curtidas_treinamento_id ON treinamento_curtidas(treinamento_id);
CREATE INDEX IF NOT EXISTS idx_treinamento_curtidas_usuario_id ON treinamento_curtidas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_treinamento_comentarios_treinamento_id ON treinamento_comentarios(treinamento_id);
CREATE INDEX IF NOT EXISTS idx_treinamento_comentarios_usuario_id ON treinamento_comentarios(usuario_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at nos comentários
CREATE TRIGGER update_treinamento_comentarios_updated_at 
    BEFORE UPDATE ON treinamento_comentarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) para curtidas
ALTER TABLE treinamento_curtidas ENABLE ROW LEVEL SECURITY;

-- Política para curtidas - usuários podem ver todas as curtidas
CREATE POLICY "Curtidas são visíveis para todos" ON treinamento_curtidas
    FOR SELECT USING (true);

-- Política para curtidas - usuários podem inserir suas próprias curtidas
CREATE POLICY "Usuários podem curtir treinamentos" ON treinamento_curtidas
    FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text);

-- Política para curtidas - usuários podem deletar suas próprias curtidas
CREATE POLICY "Usuários podem descurtir seus próprios treinamentos" ON treinamento_curtidas
    FOR DELETE USING (auth.uid()::text = usuario_id::text);

-- RLS (Row Level Security) para comentários
ALTER TABLE treinamento_comentarios ENABLE ROW LEVEL SECURITY;

-- Política para comentários - usuários podem ver todos os comentários
CREATE POLICY "Comentários são visíveis para todos" ON treinamento_comentarios
    FOR SELECT USING (true);

-- Política para comentários - usuários podem inserir comentários
CREATE POLICY "Usuários podem comentar em treinamentos" ON treinamento_comentarios
    FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text);

-- Política para comentários - usuários podem editar seus próprios comentários
CREATE POLICY "Usuários podem editar seus próprios comentários" ON treinamento_comentarios
    FOR UPDATE USING (auth.uid()::text = usuario_id::text);

-- Política para comentários - usuários podem deletar seus próprios comentários
CREATE POLICY "Usuários podem deletar seus próprios comentários" ON treinamento_comentarios
    FOR DELETE USING (auth.uid()::text = usuario_id::text);

-- View para estatísticas de treinamentos com curtidas e comentários
CREATE OR REPLACE VIEW treinamentos_com_estatisticas AS
SELECT 
    t.*,
    COALESCE(curtidas.total_curtidas, 0) as total_curtidas,
    COALESCE(comentarios.total_comentarios, 0) as total_comentarios,
    COALESCE(curtidas.usuarios_curtidas, '[]'::json) as usuarios_curtidas,
    COALESCE(comentarios.comentarios_recentes, '[]'::json) as comentarios_recentes
FROM treinamentos t
LEFT JOIN (
    SELECT 
        treinamento_id,
        COUNT(*) as total_curtidas,
        json_agg(
            json_build_object(
                'usuario_id', tc.usuario_id,
                'nome_usuario', u.nome,
                'email_usuario', u.email,
                'created_at', tc.created_at
            ) ORDER BY tc.created_at DESC
        ) as usuarios_curtidas
    FROM treinamento_curtidas tc
    JOIN usuarios u ON tc.usuario_id = u.id
    GROUP BY treinamento_id
) curtidas ON t.id = curtidas.treinamento_id
LEFT JOIN (
    SELECT 
        treinamento_id,
        COUNT(*) as total_comentarios,
        json_agg(
            json_build_object(
                'id', tcom.id,
                'comentario', tcom.comentario,
                'usuario_id', tcom.usuario_id,
                'nome_usuario', u.nome,
                'email_usuario', u.email,
                'created_at', tcom.created_at,
                'updated_at', tcom.updated_at
            ) ORDER BY tcom.created_at DESC
        ) as comentarios_recentes
    FROM treinamento_comentarios tcom
    JOIN usuarios u ON tcom.usuario_id = u.id
    GROUP BY treinamento_id
) comentarios ON t.id = comentarios.treinamento_id
WHERE t.ativo = true;

-- Função para curtir/descurtir treinamento
CREATE OR REPLACE FUNCTION toggle_curtida_treinamento(p_treinamento_id INTEGER, p_usuario_id INTEGER)
RETURNS json AS $$
DECLARE
    curtida_existe BOOLEAN;
    resultado json;
BEGIN
    -- Verifica se a curtida já existe
    SELECT EXISTS(
        SELECT 1 FROM treinamento_curtidas 
        WHERE treinamento_id = p_treinamento_id AND usuario_id = p_usuario_id
    ) INTO curtida_existe;
    
    IF curtida_existe THEN
        -- Remove a curtida
        DELETE FROM treinamento_curtidas 
        WHERE treinamento_id = p_treinamento_id AND usuario_id = p_usuario_id;
        
        resultado := json_build_object(
            'acao', 'descurtiu',
            'curtido', false,
            'total_curtidas', (
                SELECT COUNT(*) FROM treinamento_curtidas WHERE treinamento_id = p_treinamento_id
            )
        );
    ELSE
        -- Adiciona a curtida
        INSERT INTO treinamento_curtidas (treinamento_id, usuario_id) 
        VALUES (p_treinamento_id, p_usuario_id);
        
        resultado := json_build_object(
            'acao', 'curtiu',
            'curtido', true,
            'total_curtidas', (
                SELECT COUNT(*) FROM treinamento_curtidas WHERE treinamento_id = p_treinamento_id
            )
        );
    END IF;
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários nas tabelas
COMMENT ON TABLE treinamento_curtidas IS 'Tabela para armazenar curtidas dos usuários nos treinamentos';
COMMENT ON TABLE treinamento_comentarios IS 'Tabela para armazenar comentários dos usuários nos treinamentos';
COMMENT ON COLUMN treinamentos.logo_url IS 'URL da logo opcional do treinamento armazenada no Supabase Storage';
COMMENT ON VIEW treinamentos_com_estatisticas IS 'View que retorna treinamentos com estatísticas de curtidas e comentários';
COMMENT ON FUNCTION toggle_curtida_treinamento IS 'Função para curtir ou descurtir um treinamento';

