-- Script para corrigir os tipos de dados das tabelas de analytics
-- Baseado na estrutura real das tabelas (noticias.id é UUID)

-- 1. CORRIGIR FUNÇÕES DE NOTÍCIAS (manter UUID)
-- =====================================================

-- Função para registrar visualização de notícia
CREATE OR REPLACE FUNCTION register_noticia_view(noticia_id UUID, user_uuid UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO noticias_analytics (noticia_id, user_id, action, metadata)
    VALUES (
        noticia_id,
        user_uuid,
        'viewed',
        jsonb_build_object(
            'viewed_at', NOW(),
            'user_agent', current_setting('request.headers', true)
        )
    )
    ON CONFLICT (noticia_id, user_id, action) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar curtida em notícia
CREATE OR REPLACE FUNCTION register_noticia_like(noticia_id UUID, user_uuid UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO noticias_analytics (noticia_id, user_id, action, metadata)
    VALUES (
        noticia_id,
        user_uuid,
        'liked',
        jsonb_build_object(
            'liked_at', NOW()
        )
    )
    ON CONFLICT (noticia_id, user_id, action) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar comentário em notícia
CREATE OR REPLACE FUNCTION register_noticia_comment(noticia_id UUID, user_uuid UUID, comment_text TEXT)
RETURNS void AS $$
BEGIN
    INSERT INTO noticias_analytics (noticia_id, user_id, action, metadata)
    VALUES (
        noticia_id,
        user_uuid,
        'commented',
        jsonb_build_object(
            'commented_at', NOW(),
            'comment_preview', LEFT(comment_text, 100)
        )
    )
    ON CONFLICT (noticia_id, user_id, action) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 2. CORRIGIR FUNÇÕES DE TREINAMENTOS (manter INTEGER)
-- =====================================================

-- Função para registrar visualização de treinamento
CREATE OR REPLACE FUNCTION register_treinamento_view(treinamento_id INTEGER, user_uuid UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO treinamentos_analytics (treinamento_id, user_id, action, metadata)
    VALUES (
        treinamento_id,
        user_uuid,
        'viewed',
        jsonb_build_object(
            'viewed_at', NOW(),
            'user_agent', current_setting('request.headers', true)
        )
    )
    ON CONFLICT (treinamento_id, user_id, action) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar curtida em treinamento
CREATE OR REPLACE FUNCTION register_treinamento_like(treinamento_id INTEGER, user_uuid UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO treinamentos_analytics (treinamento_id, user_id, action, metadata)
    VALUES (
        treinamento_id,
        user_uuid,
        'liked',
        jsonb_build_object(
            'liked_at', NOW()
        )
    )
    ON CONFLICT (treinamento_id, user_id, action) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar comentário em treinamento
CREATE OR REPLACE FUNCTION register_treinamento_comment(treinamento_id INTEGER, user_uuid UUID, comment_text TEXT)
RETURNS void AS $$
BEGIN
    INSERT INTO treinamentos_analytics (treinamento_id, user_id, action, metadata)
    VALUES (
        treinamento_id,
        user_uuid,
        'commented',
        jsonb_build_object(
            'commented_at', NOW(),
            'comment_preview', LEFT(comment_text, 100)
        )
    )
    ON CONFLICT (treinamento_id, user_id, action) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 3. ADICIONAR RLS E POLÍTICAS
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE notification_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE noticias_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinamentos_analytics ENABLE ROW LEVEL SECURITY;

-- Políticas para notification_analytics
CREATE POLICY "Users can view own notification analytics" ON notification_analytics
    FOR SELECT USING (user_id IN (
        SELECT id FROM usuarios WHERE email = auth.email()
    ));

CREATE POLICY "System can insert notification analytics" ON notification_analytics
    FOR INSERT WITH CHECK (true);

-- Políticas para noticias_analytics
CREATE POLICY "Users can view own noticias analytics" ON noticias_analytics
    FOR SELECT USING (user_id IN (
        SELECT id FROM usuarios WHERE email = auth.email()
    ));

CREATE POLICY "System can insert noticias analytics" ON noticias_analytics
    FOR INSERT WITH CHECK (true);

-- Políticas para treinamentos_analytics
CREATE POLICY "Users can view own treinamentos analytics" ON treinamentos_analytics
    FOR SELECT USING (user_id IN (
        SELECT id FROM usuarios WHERE email = auth.email()
    ));

CREATE POLICY "System can insert treinamentos analytics" ON treinamentos_analytics
    FOR INSERT WITH CHECK (true);

-- 4. VERIFICAR ESTRUTURA FINAL
-- =====================================================

-- Verificar tipos das colunas após correção
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('notification_analytics', 'noticias_analytics', 'treinamentos_analytics')
ORDER BY table_name, ordinal_position;

-- Verificar constraints de foreign key
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('notification_analytics', 'noticias_analytics', 'treinamentos_analytics')
ORDER BY tc.table_name, tc.constraint_name;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('notification_analytics', 'noticias_analytics', 'treinamentos_analytics')
ORDER BY tablename, policyname;
