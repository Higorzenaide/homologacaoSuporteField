-- Sistema de Analytics e Notificações para Notícias e Treinamentos

-- 1. TABELA DE ANALYTICS DE NOTIFICAÇÕES
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'read', 'clicked', 'dismissed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(notification_id, user_id, action)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notification_analytics_notification_id ON notification_analytics(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_user_id ON notification_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_action ON notification_analytics(action);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_created_at ON notification_analytics(created_at);

-- RLS para notification_analytics
ALTER TABLE notification_analytics ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver seus próprios analytics
CREATE POLICY "Users can view own notification analytics" ON notification_analytics
    FOR SELECT USING (user_id IN (
        SELECT id FROM usuarios WHERE email = auth.email()
    ));

-- Política: sistema pode inserir analytics
CREATE POLICY "System can insert notification analytics" ON notification_analytics
    FOR INSERT WITH CHECK (true);

-- 2. TABELA DE ANALYTICS DE NOTÍCIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS noticias_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    noticia_id INTEGER NOT NULL REFERENCES noticias(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'viewed', 'liked', 'commented', 'shared'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}' -- Dados adicionais como tempo de visualização, etc.
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_noticias_analytics_noticia_id ON noticias_analytics(noticia_id);
CREATE INDEX IF NOT EXISTS idx_noticias_analytics_user_id ON noticias_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_noticias_analytics_action ON noticias_analytics(action);
CREATE INDEX IF NOT EXISTS idx_noticias_analytics_created_at ON noticias_analytics(created_at);

-- RLS para noticias_analytics
ALTER TABLE noticias_analytics ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver seus próprios analytics
CREATE POLICY "Users can view own noticias analytics" ON noticias_analytics
    FOR SELECT USING (user_id IN (
        SELECT id FROM usuarios WHERE email = auth.email()
    ));

-- Política: sistema pode inserir analytics
CREATE POLICY "System can insert noticias analytics" ON noticias_analytics
    FOR INSERT WITH CHECK (true);

-- 3. TABELA DE ANALYTICS DE TREINAMENTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS treinamentos_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    treinamento_id INTEGER NOT NULL REFERENCES treinamentos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'viewed', 'liked', 'commented', 'completed', 'downloaded'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}' -- Dados adicionais como tempo de visualização, progresso, etc.
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_treinamentos_analytics_treinamento_id ON treinamentos_analytics(treinamento_id);
CREATE INDEX IF NOT EXISTS idx_treinamentos_analytics_user_id ON treinamentos_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_treinamentos_analytics_action ON treinamentos_analytics(action);
CREATE INDEX IF NOT EXISTS idx_treinamentos_analytics_created_at ON treinamentos_analytics(created_at);

-- RLS para treinamentos_analytics
ALTER TABLE treinamentos_analytics ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver seus próprios analytics
CREATE POLICY "Users can view own treinamentos analytics" ON treinamentos_analytics
    FOR SELECT USING (user_id IN (
        SELECT id FROM usuarios WHERE email = auth.email()
    ));

-- Política: sistema pode inserir analytics
CREATE POLICY "System can insert treinamentos analytics" ON treinamentos_analytics
    FOR INSERT WITH CHECK (true);

-- 4. FUNÇÃO PARA NOTIFICAR SOBRE NOVAS NOTÍCIAS
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_noticia()
RETURNS TRIGGER AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Notificar todos os usuários sobre nova notícia
    FOR user_record IN 
        SELECT id FROM usuarios 
        WHERE ativo = true
    LOOP
        INSERT INTO notifications (user_id, type, title, message, data, priority)
        VALUES (
            user_record.id,
            'news',
            'Nova Notícia Publicada',
            'Foi publicada uma nova notícia: "' || NEW.titulo || '"',
            jsonb_build_object(
                'noticia_id', NEW.id,
                'noticia_title', NEW.titulo,
                'action_url', '/noticias/' || NEW.id
            ),
            'medium'
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar sobre novas notícias
CREATE TRIGGER trigger_notify_new_noticia
    AFTER INSERT ON noticias
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_noticia();

-- 5. FUNÇÃO PARA NOTIFICAR SOBRE NOVOS TREINAMENTOS
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_treinamento()
RETURNS TRIGGER AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Notificar todos os usuários sobre novo treinamento (não obrigatório)
    IF NEW.ativo = true THEN
        FOR user_record IN 
            SELECT id FROM usuarios 
            WHERE ativo = true
        LOOP
            INSERT INTO notifications (user_id, type, title, message, data, priority)
            VALUES (
                user_record.id,
                'training_new',
                'Novo Treinamento Disponível',
                'Foi adicionado um novo treinamento: "' || NEW.titulo || '"',
                jsonb_build_object(
                    'treinamento_id', NEW.id,
                    'treinamento_title', NEW.titulo,
                    'action_url', '/treinamentos/' || NEW.id
                ),
                'low'
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar sobre novos treinamentos
CREATE TRIGGER trigger_notify_new_treinamento
    AFTER INSERT ON treinamentos
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_treinamento();

-- 6. FUNÇÕES PARA REGISTRAR ANALYTICS
-- =====================================================

-- Função para registrar visualização de notícia
CREATE OR REPLACE FUNCTION register_noticia_view(noticia_id INTEGER, user_uuid UUID)
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
CREATE OR REPLACE FUNCTION register_noticia_like(noticia_id INTEGER, user_uuid UUID)
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
CREATE OR REPLACE FUNCTION register_noticia_comment(noticia_id INTEGER, user_uuid UUID, comment_text TEXT)
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

-- 7. COMENTÁRIOS NAS TABELAS
-- =====================================================
COMMENT ON TABLE notification_analytics IS 'Analytics de interações com notificações';
COMMENT ON TABLE noticias_analytics IS 'Analytics de interações com notícias';
COMMENT ON TABLE treinamentos_analytics IS 'Analytics de interações com treinamentos';

COMMENT ON COLUMN notification_analytics.action IS 'Ação realizada: read, clicked, dismissed';
COMMENT ON COLUMN noticias_analytics.action IS 'Ação realizada: viewed, liked, commented, shared';
COMMENT ON COLUMN treinamentos_analytics.action IS 'Ação realizada: viewed, liked, commented, completed, downloaded';
