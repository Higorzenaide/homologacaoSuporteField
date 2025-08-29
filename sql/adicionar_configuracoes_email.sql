-- Adicionar colunas para configurações de email na tabela usuarios
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar coluna para habilitar/desabilitar notificações por email
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;

-- 2. Adicionar coluna para frequência de emails
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS email_frequency VARCHAR(20) DEFAULT 'immediate';

-- 3. Adicionar coluna para tipos de notificação (array JSON)
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS email_types JSONB DEFAULT '["training_required", "training_reminder", "news", "system", "feedback"]';

-- 4. Comentários para documentação
COMMENT ON COLUMN usuarios.email_notifications_enabled IS 'Habilita ou desabilita notificações por email para o usuário';
COMMENT ON COLUMN usuarios.email_frequency IS 'Frequência de envio: immediate, daily, weekly';
COMMENT ON COLUMN usuarios.email_types IS 'Array JSON com tipos de notificação que o usuário quer receber por email';

-- 5. Criar índice para performance nas consultas de email
CREATE INDEX IF NOT EXISTS idx_usuarios_email_notifications 
ON usuarios(email_notifications_enabled) 
WHERE email_notifications_enabled = true;

-- 6. Função para criar notificação de email (opcional - para uso com RPC)
CREATE OR REPLACE FUNCTION send_notification_email(
  recipient_email TEXT,
  email_subject TEXT,
  html_content TEXT,
  text_content TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta função seria implementada com integração ao serviço de email
  -- Por enquanto, apenas registra que o email foi "enviado"
  
  -- Log do email (opcional)
  INSERT INTO email_logs (recipient, subject, sent_at, status)
  VALUES (recipient_email, email_subject, NOW(), 'queued')
  ON CONFLICT DO NOTHING;
  
  -- Retornar sucesso
  RETURN json_build_object(
    'success', true,
    'message', 'Email enviado com sucesso',
    'recipient', recipient_email
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Retornar erro
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'recipient', recipient_email
    );
END;
$$;

-- 7. Tabela opcional para logs de emails (para rastreamento)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'queued', -- queued, sent, failed, delivered
  error_message TEXT,
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para a tabela de logs
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

-- RLS para a tabela de logs (usuários só veem seus próprios logs)
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email logs" ON email_logs
  FOR SELECT USING (
    recipient IN (
      SELECT email FROM usuarios WHERE email = auth.email()
    )
  );

-- 8. Atualizar usuários existentes com configurações padrão
UPDATE usuarios 
SET 
  email_notifications_enabled = true,
  email_frequency = 'immediate',
  email_types = '["training_required", "training_reminder", "news", "system", "feedback"]'
WHERE 
  email_notifications_enabled IS NULL 
  OR email_frequency IS NULL 
  OR email_types IS NULL;

-- Confirmar as alterações
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
  AND column_name IN ('email_notifications_enabled', 'email_frequency', 'email_types')
ORDER BY column_name;
