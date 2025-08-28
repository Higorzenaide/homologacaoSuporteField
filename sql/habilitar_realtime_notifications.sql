-- =====================================================
-- HABILITAR REALTIME PARA NOTIFICAÇÕES
-- =====================================================
-- Script para garantir que as notificações funcionem em tempo real

-- 1. Habilitar Realtime Publications na tabela notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 2. Garantir que RLS está habilitado
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para notifications (se não existirem)
-- Política para usuários verem apenas suas próprias notificações
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Users can view their own notifications'
    ) THEN
        CREATE POLICY "Users can view their own notifications" ON notifications
        FOR SELECT USING (auth.uid()::uuid = user_id);
    END IF;
END $$;

-- Política para usuários atualizarem apenas suas próprias notificações
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Users can update their own notifications'
    ) THEN
        CREATE POLICY "Users can update their own notifications" ON notifications
        FOR UPDATE USING (auth.uid()::uuid = user_id);
    END IF;
END $$;

-- Política para permitir inserção de notificações (por funções ou triggers)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Allow insert notifications'
    ) THEN
        CREATE POLICY "Allow insert notifications" ON notifications
        FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- 4. Verificar se a tabela tem as colunas necessárias
DO $$ 
BEGIN
    -- Verificar se a coluna read existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'read'
    ) THEN
        ALTER TABLE notifications ADD COLUMN read BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Verificar se a coluna data existe (para metadados)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'data'
    ) THEN
        ALTER TABLE notifications ADD COLUMN data JSONB;
    END IF;
    
    -- Verificar se a coluna priority existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'priority'
    ) THEN
        ALTER TABLE notifications ADD COLUMN priority VARCHAR(10) DEFAULT 'medium';
    END IF;
END $$;

-- 5. Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 6. Comentários para documentação
COMMENT ON TABLE notifications IS 'Tabela de notificações com suporte a realtime via Supabase';
COMMENT ON COLUMN notifications.read IS 'Indica se a notificação foi lida pelo usuário';
COMMENT ON COLUMN notifications.data IS 'Metadados JSON da notificação (action_url, etc)';
COMMENT ON COLUMN notifications.priority IS 'Prioridade da notificação: low, medium, high';

-- =====================================================
-- VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se realtime está habilitado
SELECT 
    schemaname,
    tablename,
    'realtime_enabled' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'notifications';

-- Verificar políticas RLS
SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'notifications';

-- Estrutura final da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;
