-- Criar tabela para Links Importantes
CREATE TABLE IF NOT EXISTS links_importantes (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  descricao TEXT,
  icone VARCHAR(50) DEFAULT 'link',
  cor VARCHAR(20) DEFAULT 'blue',
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Criar índices para melhor performance teste
CREATE INDEX IF NOT EXISTS idx_links_importantes_ativo ON links_importantes(ativo);
CREATE INDEX IF NOT EXISTS idx_links_importantes_ordem ON links_importantes(ordem);
CREATE INDEX IF NOT EXISTS idx_links_importantes_created_by ON links_importantes(created_by);

-- Habilitar RLS (Row Level Security)
ALTER TABLE links_importantes ENABLE ROW LEVEL SECURITY;

-- Política para leitura (todos podem ver links ativos)
CREATE POLICY "Permitir leitura de links ativos" ON links_importantes
  FOR SELECT USING (ativo = true);

-- Política para leitura completa (usuários autenticados podem ver todos)
CREATE POLICY "Permitir leitura completa para autenticados" ON links_importantes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para inserção (apenas usuários autenticados)
CREATE POLICY "Permitir inserção para autenticados" ON links_importantes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para atualização (apenas usuários autenticados)
CREATE POLICY "Permitir atualização para autenticados" ON links_importantes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para exclusão (apenas usuários autenticados)
CREATE POLICY "Permitir exclusão para autenticados" ON links_importantes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Inserir alguns links de exemplo
INSERT INTO links_importantes (titulo, url, descricao, icone, cor, ordem) VALUES
('Portal Desktop Fibra', 'https://www.desktop-fibra-internet.com.br', 'Site oficial da Desktop Fibra Internet', 'globe', 'red', 1),
('Suporte Técnico', 'https://suporte.desktop.com.br', 'Portal de suporte técnico para resolução de problemas', 'headphones', 'blue', 2),
('Manual do Técnico', 'https://manual.desktop.com.br', 'Manual completo para técnicos de campo', 'book', 'green', 3),
('Sistema de OS', 'https://os.desktop.com.br', 'Sistema de ordens de serviço', 'clipboard', 'purple', 4),
('WhatsApp Suporte', 'https://wa.me/5519998303838', 'Contato direto via WhatsApp', 'message-circle', 'green', 5);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_links_importantes_updated_at 
    BEFORE UPDATE ON links_importantes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

