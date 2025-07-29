-- Tabela para curtidas de notícias
CREATE TABLE IF NOT EXISTS curtidas_noticias (
    id SERIAL PRIMARY KEY,
    noticia_id UUID NOT NULL REFERENCES noticias(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(noticia_id, usuario_id)
);

-- Tabela para comentários de notícias
CREATE TABLE IF NOT EXISTS comentarios_noticias (
    id SERIAL PRIMARY KEY,
    noticia_id UUID NOT NULL REFERENCES noticias(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    comentario TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_curtidas_noticias_noticia_id ON curtidas_noticias(noticia_id);
CREATE INDEX IF NOT EXISTS idx_curtidas_noticias_usuario_id ON curtidas_noticias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_noticias_noticia_id ON comentarios_noticias(noticia_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_noticias_usuario_id ON comentarios_noticias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_noticias_created_at ON comentarios_noticias(created_at);

-- Políticas RLS (Row Level Security) para curtidas_noticias
ALTER TABLE curtidas_noticias ENABLE ROW LEVEL SECURITY;

-- Política para visualizar curtidas (todos podem ver)
CREATE POLICY "Todos podem visualizar curtidas de notícias" ON curtidas_noticias
    FOR SELECT USING (true);

-- Política para inserir curtidas (usuários autenticados)
CREATE POLICY "Usuários autenticados podem curtir notícias" ON curtidas_noticias
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política para deletar curtidas (apenas o próprio usuário)
CREATE POLICY "Usuários podem descurtir suas próprias curtidas de notícias" ON curtidas_noticias
    FOR DELETE USING (auth.uid() = usuario_id);

-- Políticas RLS para comentarios_noticias
ALTER TABLE comentarios_noticias ENABLE ROW LEVEL SECURITY;

-- Política para visualizar comentários (todos podem ver)
CREATE POLICY "Todos podem visualizar comentários de notícias" ON comentarios_noticias
    FOR SELECT USING (true);

-- Política para inserir comentários (usuários autenticados)
CREATE POLICY "Usuários autenticados podem comentar notícias" ON comentarios_noticias
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política para atualizar comentários (apenas o próprio usuário)
CREATE POLICY "Usuários podem editar seus próprios comentários de notícias" ON comentarios_noticias
    FOR UPDATE USING (auth.uid() = usuario_id);

-- Política para deletar comentários (apenas o próprio usuário)
CREATE POLICY "Usuários podem deletar seus próprios comentários de notícias" ON comentarios_noticias
    FOR DELETE USING (auth.uid() = usuario_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at em comentarios_noticias
CREATE TRIGGER update_comentarios_noticias_updated_at 
    BEFORE UPDATE ON comentarios_noticias 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

