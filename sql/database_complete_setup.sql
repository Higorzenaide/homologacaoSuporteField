-- =====================================================
-- SCRIPT COMPLETO PARA CONFIGURAÇÃO DO BANCO DE DADOS
-- Portfolio Suporte Field - Desktop Fibra
-- =====================================================

-- 1. CRIAR TABELA DE CATEGORIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('treinamento', 'noticia')),
    cor VARCHAR(7) DEFAULT '#6B7280',
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nome, tipo)
);

-- Inserir categorias padrão para treinamentos
INSERT INTO categorias (nome, tipo, cor) VALUES 
('Equipamentos', 'treinamento', '#EF4444'),
('Ferramentas', 'treinamento', '#F59E0B'),
('Resultados', 'treinamento', '#10B981'),
('Segurança', 'treinamento', '#3B82F6'),
('Treinamento', 'treinamento', '#8B5CF6')
ON CONFLICT (nome, tipo) DO NOTHING;

-- Inserir categorias padrão para notícias
INSERT INTO categorias (nome, tipo, cor) VALUES 
('Equipamentos', 'noticia', '#EF4444'),
('Ferramentas', 'noticia', '#F59E0B'),
('Resultados', 'noticia', '#10B981'),
('Segurança', 'noticia', '#3B82F6'),
('Treinamento', 'noticia', '#8B5CF6')
ON CONFLICT (nome, tipo) DO NOTHING;

-- 2. ATUALIZAR TABELA DE TREINAMENTOS
-- =====================================================
-- Adicionar coluna logo_url se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'treinamentos' AND column_name = 'logo_url') THEN
        ALTER TABLE treinamentos ADD COLUMN logo_url TEXT;
    END IF;
END $$;

-- Adicionar coluna categoria_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'treinamentos' AND column_name = 'categoria_id') THEN
        ALTER TABLE treinamentos ADD COLUMN categoria_id INTEGER REFERENCES categorias(id);
    END IF;
END $$;

-- Adicionar colunas de estatísticas se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'treinamentos' AND column_name = 'visualizacoes') THEN
        ALTER TABLE treinamentos ADD COLUMN visualizacoes INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'treinamentos' AND column_name = 'downloads') THEN
        ALTER TABLE treinamentos ADD COLUMN downloads INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. ATUALIZAR TABELA DE NOTÍCIAS
-- =====================================================
-- Adicionar coluna categoria_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'noticias' AND column_name = 'categoria_id') THEN
        ALTER TABLE noticias ADD COLUMN categoria_id INTEGER REFERENCES categorias(id);
    END IF;
END $$;

-- 4. CRIAR TABELA DE COMENTÁRIOS DOS TREINAMENTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS treinamento_comentarios (
    id SERIAL PRIMARY KEY,
    treinamento_id INTEGER NOT NULL REFERENCES treinamentos(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    comentario TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CRIAR TABELA DE CURTIDAS DOS TREINAMENTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS treinamento_curtidas (
    id SERIAL PRIMARY KEY,
    treinamento_id INTEGER NOT NULL REFERENCES treinamentos(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(treinamento_id, usuario_id) -- Evita curtidas duplicadas
);

-- 6. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
-- =====================================================
-- Índices para categorias
CREATE INDEX IF NOT EXISTS idx_categorias_tipo ON categorias(tipo);
CREATE INDEX IF NOT EXISTS idx_categorias_ativo ON categorias(ativo);

-- Índices para treinamentos
CREATE INDEX IF NOT EXISTS idx_treinamentos_categoria_id ON treinamentos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_treinamentos_ativo ON treinamentos(ativo);

-- Índices para notícias
CREATE INDEX IF NOT EXISTS idx_noticias_categoria_id ON noticias(categoria_id);
CREATE INDEX IF NOT EXISTS idx_noticias_ativo ON noticias(ativo);

-- Índices para comentários
CREATE INDEX IF NOT EXISTS idx_treinamento_comentarios_treinamento_id ON treinamento_comentarios(treinamento_id);
CREATE INDEX IF NOT EXISTS idx_treinamento_comentarios_usuario_id ON treinamento_comentarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_treinamento_comentarios_created_at ON treinamento_comentarios(created_at);

-- Índices para curtidas
CREATE INDEX IF NOT EXISTS idx_treinamento_curtidas_treinamento_id ON treinamento_curtidas(treinamento_id);
CREATE INDEX IF NOT EXISTS idx_treinamento_curtidas_usuario_id ON treinamento_curtidas(usuario_id);

-- 7. CRIAR FUNÇÕES E TRIGGERS
-- =====================================================
-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at nos comentários
DROP TRIGGER IF EXISTS update_treinamento_comentarios_updated_at ON treinamento_comentarios;
CREATE TRIGGER update_treinamento_comentarios_updated_at 
    BEFORE UPDATE ON treinamento_comentarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at nas categorias
DROP TRIGGER IF EXISTS update_categorias_updated_at ON categorias;
CREATE TRIGGER update_categorias_updated_at 
    BEFORE UPDATE ON categorias 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- =====================================================
-- RLS para categorias
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Política para categorias - todos podem ver categorias ativas
DROP POLICY IF EXISTS "Categorias são visíveis para todos" ON categorias;
CREATE POLICY "Categorias são visíveis para todos" ON categorias
    FOR SELECT USING (ativo = true);

-- Política para administradores gerenciarem categorias
DROP POLICY IF EXISTS "Administradores podem gerenciar categorias" ON categorias;
CREATE POLICY "Administradores podem gerenciar categorias" ON categorias
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.role = 'admin'
        )
    );

-- RLS para comentários
ALTER TABLE treinamento_comentarios ENABLE ROW LEVEL SECURITY;

-- Política para comentários - todos podem ver comentários
DROP POLICY IF EXISTS "Comentários são visíveis para todos" ON treinamento_comentarios;
CREATE POLICY "Comentários são visíveis para todos" ON treinamento_comentarios
    FOR SELECT USING (true);

-- Política para usuários autenticados criarem comentários
DROP POLICY IF EXISTS "Usuários autenticados podem comentar" ON treinamento_comentarios;
CREATE POLICY "Usuários autenticados podem comentar" ON treinamento_comentarios
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política para usuários editarem seus próprios comentários
DROP POLICY IF EXISTS "Usuários podem editar seus comentários" ON treinamento_comentarios;
CREATE POLICY "Usuários podem editar seus comentários" ON treinamento_comentarios
    FOR UPDATE USING (
        usuario_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.role = 'admin'
        )
    );

-- Política para usuários deletarem seus próprios comentários
DROP POLICY IF EXISTS "Usuários podem deletar seus comentários" ON treinamento_comentarios;
CREATE POLICY "Usuários podem deletar seus comentários" ON treinamento_comentarios
    FOR DELETE USING (
        usuario_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.role = 'admin'
        )
    );

-- RLS para curtidas
ALTER TABLE treinamento_curtidas ENABLE ROW LEVEL SECURITY;

-- Política para curtidas - todos podem ver curtidas
DROP POLICY IF EXISTS "Curtidas são visíveis para todos" ON treinamento_curtidas;
CREATE POLICY "Curtidas são visíveis para todos" ON treinamento_curtidas
    FOR SELECT USING (true);

-- Política para usuários autenticados curtirem
DROP POLICY IF EXISTS "Usuários autenticados podem curtir" ON treinamento_curtidas;
CREATE POLICY "Usuários autenticados podem curtir" ON treinamento_curtidas
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política para usuários removerem suas curtidas
DROP POLICY IF EXISTS "Usuários podem remover suas curtidas" ON treinamento_curtidas;
CREATE POLICY "Usuários podem remover suas curtidas" ON treinamento_curtidas
    FOR DELETE USING (usuario_id = auth.uid());

-- 9. ATUALIZAR DADOS EXISTENTES
-- =====================================================
-- Atualizar categoria_id baseado no nome da categoria existente para treinamentos
UPDATE treinamentos 
SET categoria_id = (
    SELECT id FROM categorias 
    WHERE nome = treinamentos.categoria 
    AND tipo = 'treinamento' 
    LIMIT 1
)
WHERE categoria_id IS NULL AND categoria IS NOT NULL;

-- Atualizar categoria_id baseado no nome da categoria existente para notícias
UPDATE noticias 
SET categoria_id = (
    SELECT id FROM categorias 
    WHERE nome = noticias.categoria 
    AND tipo = 'noticia' 
    LIMIT 1
)
WHERE categoria_id IS NULL AND categoria IS NOT NULL;

-- 10. CRIAR VIEWS ÚTEIS (OPCIONAL)
-- =====================================================
-- View para treinamentos com estatísticas de comentários e curtidas
CREATE OR REPLACE VIEW treinamentos_com_estatisticas AS
SELECT 
    t.*,
    c.nome as categoria_nome,
    c.cor as categoria_cor,
    COALESCE(comentarios_count.total, 0) as total_comentarios,
    COALESCE(curtidas_count.total, 0) as total_curtidas
FROM treinamentos t
LEFT JOIN categorias c ON t.categoria_id = c.id
LEFT JOIN (
    SELECT treinamento_id, COUNT(*) as total
    FROM treinamento_comentarios
    GROUP BY treinamento_id
) comentarios_count ON t.id = comentarios_count.treinamento_id
LEFT JOIN (
    SELECT treinamento_id, COUNT(*) as total
    FROM treinamento_curtidas
    GROUP BY treinamento_id
) curtidas_count ON t.id = curtidas_count.treinamento_id
WHERE t.ativo = true;

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- Todas as tabelas, índices, triggers e políticas serão criadas
-- O sistema estará pronto para usar todas as funcionalidades!

