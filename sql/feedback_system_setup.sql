-- =====================================================
-- SCRIPT PARA SISTEMA DE FEEDBACKS
-- Portfolio Suporte Field - Desktop Fibra
-- =====================================================

-- 1. CRIAR TABELA DE CATEGORIAS DE FEEDBACK
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias_feedback (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    cor VARCHAR(7) DEFAULT '#6B7280',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir categorias padrão de feedback
INSERT INTO categorias_feedback (nome, cor, descricao) VALUES 
('Informativo', '#3B82F6', 'Feedback com informações gerais'),
('Positivo', '#10B981', 'Feedback de reconhecimento e elogios'),
('Negativo', '#EF4444', 'Feedback sobre pontos que precisam melhorar'),
('Construtivo', '#F59E0B', 'Feedback com sugestões de melhoria'),
('Treinamento', '#8B5CF6', 'Feedback relacionado a necessidades de treinamento')
ON CONFLICT (nome) DO NOTHING;

-- 2. CRIAR TABELA DE FEEDBACKS
-- =====================================================
CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    categoria_id INTEGER NOT NULL REFERENCES categorias_feedback(id) ON DELETE RESTRICT,
    relato TEXT NOT NULL,
    nome_avaliador VARCHAR(255) NOT NULL,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ADICIONAR PERMISSÃO "VER FEEDBACKS" NA TABELA USUARIOS
-- =====================================================
-- Adicionar coluna para permissão de ver feedbacks se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'pode_ver_feedbacks') THEN
        ALTER TABLE usuarios ADD COLUMN pode_ver_feedbacks BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Dar permissão para todos os admins existentes
UPDATE usuarios SET pode_ver_feedbacks = true WHERE role = 'admin';

-- 4. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
-- =====================================================
-- Índices para categorias_feedback
CREATE INDEX IF NOT EXISTS idx_categorias_feedback_ativo ON categorias_feedback(ativo);

-- Índices para feedbacks
CREATE INDEX IF NOT EXISTS idx_feedbacks_usuario_id ON feedbacks(usuario_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_categoria_id ON feedbacks(categoria_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_admin_id ON feedbacks(admin_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at);

-- Índice composto para consultas por usuário e categoria
CREATE INDEX IF NOT EXISTS idx_feedbacks_usuario_categoria ON feedbacks(usuario_id, categoria_id);

-- 5. CRIAR FUNÇÕES E TRIGGERS
-- =====================================================
-- Trigger para atualizar updated_at nas categorias de feedback
DROP TRIGGER IF EXISTS update_categorias_feedback_updated_at ON categorias_feedback;
CREATE TRIGGER update_categorias_feedback_updated_at 
    BEFORE UPDATE ON categorias_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at nos feedbacks
DROP TRIGGER IF EXISTS update_feedbacks_updated_at ON feedbacks;
CREATE TRIGGER update_feedbacks_updated_at 
    BEFORE UPDATE ON feedbacks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- =====================================================
-- RLS para categorias_feedback
ALTER TABLE categorias_feedback ENABLE ROW LEVEL SECURITY;

-- Política para categorias de feedback - todos podem ver categorias ativas
DROP POLICY IF EXISTS "Categorias de feedback são visíveis para todos" ON categorias_feedback;
CREATE POLICY "Categorias de feedback são visíveis para todos" ON categorias_feedback
    FOR SELECT USING (ativo = true);

-- Política para administradores gerenciarem categorias de feedback
DROP POLICY IF EXISTS "Administradores podem gerenciar categorias de feedback" ON categorias_feedback;
CREATE POLICY "Administradores podem gerenciar categorias de feedback" ON categorias_feedback
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE public.usuarios.id = auth.uid() 
            AND public.usuarios.role = 'admin'
        )
    );

-- RLS para feedbacks
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Política para visualizar feedbacks - apenas usuários com permissão
DROP POLICY IF EXISTS "Usuários com permissão podem ver feedbacks" ON feedbacks;
CREATE POLICY "Usuários com permissão podem ver feedbacks" ON feedbacks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE public.usuarios.id = auth.uid() 
            AND (public.usuarios.role = 'admin' AND public.usuarios.pode_ver_feedbacks = true)
        )
        OR
        usuario_id = auth.uid() -- Usuário pode ver seus próprios feedbacks
    );

-- Política para inserir feedbacks - apenas administradores
DROP POLICY IF EXISTS "Administradores podem inserir feedbacks" ON feedbacks;
CREATE POLICY "Administradores podem inserir feedbacks" ON feedbacks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE public.usuarios.id = auth.uid() 
            AND public.usuarios.role = 'admin'
        )
    );

-- Política para atualizar feedbacks - apenas administradores
DROP POLICY IF EXISTS "Administradores podem atualizar feedbacks" ON feedbacks;
CREATE POLICY "Administradores podem atualizar feedbacks" ON feedbacks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE public.usuarios.id = auth.uid() 
            AND public.usuarios.role = 'admin'
        )
    );

-- Política para deletar feedbacks - apenas administradores
DROP POLICY IF EXISTS "Administradores podem deletar feedbacks" ON feedbacks;
CREATE POLICY "Administradores podem deletar feedbacks" ON feedbacks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE public.usuarios.id = auth.uid() 
            AND public.usuarios.role = 'admin'
        )
    );

-- 7. CRIAR VIEWS ÚTEIS
-- =====================================================
-- View para feedbacks com informações completas
CREATE OR REPLACE VIEW feedbacks_completos AS
SELECT 
    f.id,
    f.relato,
    f.nome_avaliador,
    f.created_at,
    f.updated_at,
    u.nome as usuario_nome,
    u.email as usuario_email,
    u.setor as usuario_setor,
    cf.nome as categoria_nome,
    cf.cor as categoria_cor,
    cf.descricao as categoria_descricao,
    admin.nome as admin_nome
FROM feedbacks f
JOIN public.usuarios u ON f.usuario_id = u.id
JOIN categorias_feedback cf ON f.categoria_id = cf.id
JOIN public.usuarios admin ON f.admin_id = admin.id
ORDER BY f.created_at DESC;

-- View para estatísticas de feedbacks por usuário
CREATE OR REPLACE VIEW estatisticas_feedback_usuario AS
SELECT 
    u.id as usuario_id,
    u.nome as usuario_nome,
    u.setor as usuario_setor,
    COUNT(f.id) as total_feedbacks,
    COUNT(CASE WHEN cf.nome = 'Positivo' THEN 1 END) as feedbacks_positivos,
    COUNT(CASE WHEN cf.nome = 'Negativo' THEN 1 END) as feedbacks_negativos,
    COUNT(CASE WHEN cf.nome = 'Construtivo' THEN 1 END) as feedbacks_construtivos,
    COUNT(CASE WHEN cf.nome = 'Informativo' THEN 1 END) as feedbacks_informativos,
    COUNT(CASE WHEN cf.nome = 'Treinamento' THEN 1 END) as feedbacks_treinamento,
    ROUND(
        (COUNT(CASE WHEN cf.nome = 'Positivo' THEN 1 END) * 100.0) / 
        NULLIF(COUNT(f.id), 0), 2
    ) as percentual_positivos
FROM public.usuarios u
LEFT JOIN feedbacks f ON u.id = f.usuario_id
LEFT JOIN categorias_feedback cf ON f.categoria_id = cf.id
WHERE u.ativo = true
GROUP BY u.id, u.nome, u.setor
ORDER BY total_feedbacks DESC;

-- View para estatísticas gerais de feedbacks
CREATE OR REPLACE VIEW estatisticas_feedback_geral AS
SELECT 
    COUNT(*) as total_feedbacks,
    COUNT(CASE WHEN cf.nome = 'Positivo' THEN 1 END) as total_positivos,
    COUNT(CASE WHEN cf.nome = 'Negativo' THEN 1 END) as total_negativos,
    COUNT(CASE WHEN cf.nome = 'Construtivo' THEN 1 END) as total_construtivos,
    COUNT(CASE WHEN cf.nome = 'Informativo' THEN 1 END) as total_informativos,
    COUNT(CASE WHEN cf.nome = 'Treinamento' THEN 1 END) as total_treinamento,
    ROUND(
        (COUNT(CASE WHEN cf.nome = 'Positivo' THEN 1 END) * 100.0) / 
        NULLIF(COUNT(*), 0), 2
    ) as percentual_positivos,
    DATE_TRUNC('month', f.created_at) as mes
FROM feedbacks f
JOIN categorias_feedback cf ON f.categoria_id = cf.id
GROUP BY DATE_TRUNC('month', f.created_at)
ORDER BY mes DESC;

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- O sistema de feedbacks estará pronto para uso!


