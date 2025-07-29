-- Criar tabelas de categorias para treinamentos e notícias

-- 1. Tabela de categorias para treinamentos (mais opções, permite adicionar)
CREATE TABLE IF NOT EXISTS categorias_treinamentos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    cor VARCHAR(7) DEFAULT '#3B82F6', -- Cor em hexadecimal para badge
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0, -- Para ordenação personalizada
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de categorias para notícias (opções mais limitadas)
CREATE TABLE IF NOT EXISTS categorias_noticias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    cor VARCHAR(7) DEFAULT '#10B981', -- Cor em hexadecimal para badge
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0, -- Para ordenação personalizada
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inserir categorias padrão para treinamentos
INSERT INTO categorias_treinamentos (nome, descricao, cor, ordem) VALUES
('Técnico', 'Treinamentos técnicos e especializados', '#3B82F6', 1),
('Vendas', 'Treinamentos de vendas e atendimento', '#10B981', 2),
('Gestão', 'Treinamentos de gestão e liderança', '#F59E0B', 3),
('Segurança', 'Treinamentos de segurança e proteção', '#EF4444', 4),
('Qualidade', 'Treinamentos de qualidade e processos', '#8B5CF6', 5),
('Atendimento', 'Treinamentos de atendimento ao cliente', '#06B6D4', 6),
('Produtos', 'Treinamentos sobre produtos e serviços', '#84CC16', 7),
('Compliance', 'Treinamentos de compliance e regulamentação', '#F97316', 8)
ON CONFLICT (nome) DO NOTHING;

-- 4. Inserir categorias padrão para notícias (menos opções)
INSERT INTO categorias_noticias (nome, descricao, cor, ordem) VALUES
('Geral', 'Notícias gerais da empresa', '#6B7280', 1),
('Produtos', 'Novidades sobre produtos e serviços', '#3B82F6', 2),
('Eventos', 'Eventos e treinamentos', '#10B981', 3),
('Comunicados', 'Comunicados oficiais', '#F59E0B', 4),
('Tecnologia', 'Atualizações tecnológicas', '#8B5CF6', 5)
ON CONFLICT (nome) DO NOTHING;

-- 5. Adicionar coluna categoria_id na tabela treinamentos (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'treinamentos' AND column_name = 'categoria_id') THEN
        ALTER TABLE treinamentos ADD COLUMN categoria_id INTEGER REFERENCES categorias_treinamentos(id);
    END IF;
END $$;

-- 6. Adicionar coluna categoria_id na tabela noticias (se existir)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'noticias') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'noticias' AND column_name = 'categoria_id') THEN
            ALTER TABLE noticias ADD COLUMN categoria_id INTEGER REFERENCES categorias_noticias(id);
        END IF;
    END IF;
END $$;

-- 7. Habilitar RLS (Row Level Security) se necessário
ALTER TABLE categorias_treinamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_noticias ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas de acesso
-- Leitura para todos
CREATE POLICY "Permitir leitura de categorias de treinamentos" ON categorias_treinamentos
    FOR SELECT USING (true);

CREATE POLICY "Permitir leitura de categorias de notícias" ON categorias_noticias
    FOR SELECT USING (true);

-- Escrita apenas para usuários autenticados
CREATE POLICY "Permitir inserção de categorias de treinamentos" ON categorias_treinamentos
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir atualização de categorias de treinamentos" ON categorias_treinamentos
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir inserção de categorias de notícias" ON categorias_noticias
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir atualização de categorias de notícias" ON categorias_noticias
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 9. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_categorias_treinamentos_ativo ON categorias_treinamentos(ativo);
CREATE INDEX IF NOT EXISTS idx_categorias_treinamentos_ordem ON categorias_treinamentos(ordem);
CREATE INDEX IF NOT EXISTS idx_categorias_noticias_ativo ON categorias_noticias(ativo);
CREATE INDEX IF NOT EXISTS idx_categorias_noticias_ordem ON categorias_noticias(ordem);

-- 10. Verificar estrutura criada
SELECT 'Categorias de Treinamentos:' as tabela, COUNT(*) as total FROM categorias_treinamentos
UNION ALL
SELECT 'Categorias de Notícias:' as tabela, COUNT(*) as total FROM categorias_noticias;

