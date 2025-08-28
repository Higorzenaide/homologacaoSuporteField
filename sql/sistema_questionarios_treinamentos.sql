-- ========================================
-- Sistema de Questionários para Treinamentos
-- ========================================

-- Tabela principal de questionários
CREATE TABLE IF NOT EXISTS questionarios_treinamentos (
    id SERIAL PRIMARY KEY,
    treinamento_id INTEGER NOT NULL REFERENCES treinamentos(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    obrigatorio BOOLEAN DEFAULT true,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de perguntas dos questionários
CREATE TABLE IF NOT EXISTS perguntas_questionarios (
    id SERIAL PRIMARY KEY,
    questionario_id INTEGER NOT NULL REFERENCES questionarios_treinamentos(id) ON DELETE CASCADE,
    pergunta TEXT NOT NULL,
    tipo_resposta VARCHAR(50) NOT NULL CHECK (tipo_resposta IN ('unica', 'multipla', 'texto')),
    opcoes_resposta JSONB, -- Para armazenar as opções quando for múltipla escolha ou única
    resposta_correta JSONB, -- Para armazenar a(s) resposta(s) correta(s)
    pontuacao INTEGER DEFAULT 1, -- Pontos que vale cada pergunta
    ordem INTEGER NOT NULL DEFAULT 1,
    obrigatoria BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de respostas dos usuários aos questionários
CREATE TABLE IF NOT EXISTS respostas_questionarios (
    id SERIAL PRIMARY KEY,
    questionario_id INTEGER NOT NULL REFERENCES questionarios_treinamentos(id) ON DELETE CASCADE,
    pergunta_id INTEGER NOT NULL REFERENCES perguntas_questionarios(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    resposta JSONB NOT NULL, -- Resposta do usuário (pode ser texto, array de opções, etc.)
    correta BOOLEAN DEFAULT false, -- Se a resposta está correta
    pontos_obtidos INTEGER DEFAULT 0,
    tempo_resposta INTERVAL, -- Tempo que levou para responder
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(questionario_id, pergunta_id, usuario_id) -- Evita respostas duplicadas
);

-- Tabela de sessões de questionários (para controlar quando o usuário completou)
CREATE TABLE IF NOT EXISTS sessoes_questionarios (
    id SERIAL PRIMARY KEY,
    questionario_id INTEGER NOT NULL REFERENCES questionarios_treinamentos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_conclusao TIMESTAMP WITH TIME ZONE,
    pontuacao_total INTEGER DEFAULT 0,
    pontuacao_maxima INTEGER DEFAULT 0,
    percentual_acerto DECIMAL(5,2) DEFAULT 0.00,
    tempo_total INTERVAL,
    status VARCHAR(20) DEFAULT 'iniciado' CHECK (status IN ('iniciado', 'em_progresso', 'concluido', 'abandonado')),
    tentativa INTEGER DEFAULT 1, -- Para permitir múltiplas tentativas se necessário
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(questionario_id, usuario_id, tentativa)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_questionarios_treinamento_id ON questionarios_treinamentos(treinamento_id);
CREATE INDEX IF NOT EXISTS idx_perguntas_questionario_id ON perguntas_questionarios(questionario_id);
CREATE INDEX IF NOT EXISTS idx_perguntas_ordem ON perguntas_questionarios(questionario_id, ordem);
CREATE INDEX IF NOT EXISTS idx_respostas_questionario_usuario ON respostas_questionarios(questionario_id, usuario_id);
CREATE INDEX IF NOT EXISTS idx_respostas_pergunta_usuario ON respostas_questionarios(pergunta_id, usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_questionario_usuario ON sessoes_questionarios(questionario_id, usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_status ON sessoes_questionarios(status);

-- Triggers para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas
DROP TRIGGER IF EXISTS update_questionarios_treinamentos_updated_at ON questionarios_treinamentos;
CREATE TRIGGER update_questionarios_treinamentos_updated_at
    BEFORE UPDATE ON questionarios_treinamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessoes_questionarios_updated_at ON sessoes_questionarios;
CREATE TRIGGER update_sessoes_questionarios_updated_at
    BEFORE UPDATE ON sessoes_questionarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- View para relatórios de performance dos questionários
CREATE OR REPLACE VIEW relatorio_questionarios AS
SELECT 
    q.id as questionario_id,
    q.titulo as questionario_titulo,
    t.titulo as treinamento_titulo,
    t.categoria_nome as categoria,
    COUNT(DISTINCT s.usuario_id) as total_usuarios_responderam,
    COUNT(DISTINCT CASE WHEN s.status = 'concluido' THEN s.usuario_id END) as usuarios_concluiram,
    ROUND(AVG(s.percentual_acerto), 2) as media_acertos,
    ROUND(
        (COUNT(DISTINCT CASE WHEN s.status = 'concluido' THEN s.usuario_id END)::decimal / 
         NULLIF(COUNT(DISTINCT s.usuario_id), 0)) * 100, 
        2
    ) as taxa_conclusao,
    AVG(s.tempo_total) as tempo_medio_conclusao,
    q.created_at as data_criacao
FROM questionarios_treinamentos q
JOIN treinamentos t ON q.treinamento_id = t.id
LEFT JOIN sessoes_questionarios s ON q.id = s.questionario_id
WHERE q.ativo = true
GROUP BY q.id, q.titulo, t.titulo, t.categoria_nome, q.created_at
ORDER BY q.created_at DESC;

-- View para performance individual dos usuários
CREATE OR REPLACE VIEW performance_usuarios_questionarios AS
SELECT 
    u.id as usuario_id,
    u.nome as usuario_nome,
    u.email as usuario_email,
    q.id as questionario_id,
    q.titulo as questionario_titulo,
    t.titulo as treinamento_titulo,
    s.pontuacao_total,
    s.pontuacao_maxima,
    s.percentual_acerto,
    s.tempo_total,
    s.data_inicio,
    s.data_conclusao,
    s.status,
    s.tentativa
FROM usuarios u
JOIN sessoes_questionarios s ON u.id = s.usuario_id
JOIN questionarios_treinamentos q ON s.questionario_id = q.id
JOIN treinamentos t ON q.treinamento_id = t.id
WHERE q.ativo = true
ORDER BY s.created_at DESC;

-- Função para calcular automaticamente a pontuação de uma resposta
CREATE OR REPLACE FUNCTION calcular_pontuacao_resposta()
RETURNS TRIGGER AS $$
DECLARE
    pergunta_pontuacao INTEGER;
    resposta_correta JSONB;
    resposta_usuario JSONB;
    tipo_pergunta VARCHAR(50);
BEGIN
    -- Buscar informações da pergunta
    SELECT pontuacao, resposta_correta, tipo_resposta 
    INTO pergunta_pontuacao, resposta_correta, tipo_pergunta
    FROM perguntas_questionarios 
    WHERE id = NEW.pergunta_id;
    
    -- Verificar se a resposta está correta e calcular pontos
    CASE tipo_pergunta
        WHEN 'unica' THEN
            -- Para resposta única, comparar diretamente
            IF NEW.resposta = resposta_correta THEN
                NEW.correta = true;
                NEW.pontos_obtidos = pergunta_pontuacao;
            ELSE
                NEW.correta = false;
                NEW.pontos_obtidos = 0;
            END IF;
            
        WHEN 'multipla' THEN
            -- Para múltipla escolha, verificar se todas as respostas corretas foram selecionadas
            IF NEW.resposta ?& ARRAY(SELECT jsonb_array_elements_text(resposta_correta)) AND
               jsonb_array_length(NEW.resposta) = jsonb_array_length(resposta_correta) THEN
                NEW.correta = true;
                NEW.pontos_obtidos = pergunta_pontuacao;
            ELSE
                NEW.correta = false;
                NEW.pontos_obtidos = 0;
            END IF;
            
        WHEN 'texto' THEN
            -- Para texto, marcar como não corrigida automaticamente
            NEW.correta = false;
            NEW.pontos_obtidos = 0;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular pontuação automaticamente
DROP TRIGGER IF EXISTS trigger_calcular_pontuacao ON respostas_questionarios;
CREATE TRIGGER trigger_calcular_pontuacao
    BEFORE INSERT OR UPDATE ON respostas_questionarios
    FOR EACH ROW
    EXECUTE FUNCTION calcular_pontuacao_resposta();

-- Função para atualizar a sessão quando uma resposta é inserida/atualizada
CREATE OR REPLACE FUNCTION atualizar_sessao_questionario()
RETURNS TRIGGER AS $$
DECLARE
    total_perguntas INTEGER;
    respostas_dadas INTEGER;
    pontuacao_atual INTEGER;
    pontuacao_maxima_total INTEGER;
BEGIN
    -- Contar total de perguntas no questionário
    SELECT COUNT(*) INTO total_perguntas
    FROM perguntas_questionarios
    WHERE questionario_id = NEW.questionario_id;
    
    -- Contar quantas respostas o usuário já deu
    SELECT COUNT(*) INTO respostas_dadas
    FROM respostas_questionarios
    WHERE questionario_id = NEW.questionario_id 
    AND usuario_id = NEW.usuario_id;
    
    -- Calcular pontuação atual do usuário
    SELECT COALESCE(SUM(pontos_obtidos), 0) INTO pontuacao_atual
    FROM respostas_questionarios
    WHERE questionario_id = NEW.questionario_id 
    AND usuario_id = NEW.usuario_id;
    
    -- Calcular pontuação máxima possível
    SELECT COALESCE(SUM(pontuacao), 0) INTO pontuacao_maxima_total
    FROM perguntas_questionarios
    WHERE questionario_id = NEW.questionario_id;
    
    -- Atualizar ou criar sessão
    INSERT INTO sessoes_questionarios (
        questionario_id, 
        usuario_id, 
        pontuacao_total, 
        pontuacao_maxima,
        percentual_acerto,
        status,
        data_conclusao
    ) VALUES (
        NEW.questionario_id,
        NEW.usuario_id,
        pontuacao_atual,
        pontuacao_maxima_total,
        CASE 
            WHEN pontuacao_maxima_total > 0 THEN (pontuacao_atual::decimal / pontuacao_maxima_total) * 100
            ELSE 0
        END,
        CASE 
            WHEN respostas_dadas >= total_perguntas THEN 'concluido'
            WHEN respostas_dadas > 0 THEN 'em_progresso'
            ELSE 'iniciado'
        END,
        CASE 
            WHEN respostas_dadas >= total_perguntas THEN NOW()
            ELSE NULL
        END
    )
    ON CONFLICT (questionario_id, usuario_id, tentativa)
    DO UPDATE SET
        pontuacao_total = EXCLUDED.pontuacao_total,
        pontuacao_maxima = EXCLUDED.pontuacao_maxima,
        percentual_acerto = EXCLUDED.percentual_acerto,
        status = EXCLUDED.status,
        data_conclusao = EXCLUDED.data_conclusao,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar sessão automaticamente
DROP TRIGGER IF EXISTS trigger_atualizar_sessao ON respostas_questionarios;
CREATE TRIGGER trigger_atualizar_sessao
    AFTER INSERT OR UPDATE ON respostas_questionarios
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_sessao_questionario();

-- Adicionar coluna na tabela de treinamentos para indicar se tem questionário
ALTER TABLE treinamentos 
ADD COLUMN IF NOT EXISTS tem_questionario BOOLEAN DEFAULT false;

-- Trigger para atualizar flag de questionário nos treinamentos
CREATE OR REPLACE FUNCTION atualizar_flag_questionario_treinamento()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE treinamentos 
        SET tem_questionario = true 
        WHERE id = NEW.treinamento_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Verificar se ainda existem questionários ativos para este treinamento
        UPDATE treinamentos 
        SET tem_questionario = (
            SELECT EXISTS(
                SELECT 1 FROM questionarios_treinamentos 
                WHERE treinamento_id = OLD.treinamento_id AND ativo = true
            )
        ) 
        WHERE id = OLD.treinamento_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_flag_questionario_treinamento ON questionarios_treinamentos;
CREATE TRIGGER trigger_flag_questionario_treinamento
    AFTER INSERT OR UPDATE OR DELETE ON questionarios_treinamentos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_flag_questionario_treinamento();

-- Inserir dados de exemplo para teste (opcional)
-- Este bloco pode ser removido em produção
DO $$
DECLARE
    treinamento_teste_id INTEGER;
    questionario_teste_id INTEGER;
BEGIN
    -- Verificar se já existe um treinamento de teste
    SELECT id INTO treinamento_teste_id 
    FROM treinamentos 
    WHERE titulo ILIKE '%teste%' 
    LIMIT 1;
    
    -- Se não existir treinamento de teste, não inserir dados de exemplo
    IF treinamento_teste_id IS NOT NULL THEN
        -- Inserir questionário de exemplo
        INSERT INTO questionarios_treinamentos (treinamento_id, titulo, descricao, obrigatorio)
        VALUES (
            treinamento_teste_id,
            'Questionário de Avaliação - Teste',
            'Questionário para testar o conhecimento sobre o treinamento',
            true
        ) RETURNING id INTO questionario_teste_id;
        
        -- Inserir perguntas de exemplo
        INSERT INTO perguntas_questionarios (questionario_id, pergunta, tipo_resposta, opcoes_resposta, resposta_correta, pontuacao, ordem)
        VALUES 
        (
            questionario_teste_id,
            'Qual é o objetivo principal deste treinamento?',
            'unica',
            '["Capacitar a equipe", "Apenas cumprir requisitos", "Perder tempo", "Não sei"]',
            '"Capacitar a equipe"',
            2,
            1
        ),
        (
            questionario_teste_id,
            'Quais são os principais benefícios deste treinamento? (Selecione todas as opções corretas)',
            'multipla',
            '["Melhora de habilidades", "Aumento de produtividade", "Redução de custos", "Maior motivação", "Nenhum benefício"]',
            '["Melhora de habilidades", "Aumento de produtividade", "Maior motivação"]',
            3,
            2
        ),
        (
            questionario_teste_id,
            'Descreva em suas palavras o que você aprendeu com este treinamento:',
            'texto',
            null,
            null,
            5,
            3
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignorar erros na inserção de dados de teste
        NULL;
END $$;

-- Comentários explicativos
COMMENT ON TABLE questionarios_treinamentos IS 'Armazena questionários associados aos treinamentos';
COMMENT ON TABLE perguntas_questionarios IS 'Armazena as perguntas de cada questionário com suas configurações';
COMMENT ON TABLE respostas_questionarios IS 'Armazena as respostas dos usuários às perguntas dos questionários';
COMMENT ON TABLE sessoes_questionarios IS 'Controla as sessões de questionários dos usuários (início, conclusão, pontuação)';

COMMENT ON COLUMN perguntas_questionarios.tipo_resposta IS 'Tipo de resposta: unica (única escolha), multipla (múltipla escolha), texto (resposta livre)';
COMMENT ON COLUMN perguntas_questionarios.opcoes_resposta IS 'Array JSON com as opções de resposta para perguntas de múltipla escolha';
COMMENT ON COLUMN perguntas_questionarios.resposta_correta IS 'Resposta(s) correta(s) em formato JSON';
COMMENT ON COLUMN respostas_questionarios.resposta IS 'Resposta do usuário em formato JSON';
COMMENT ON COLUMN sessoes_questionarios.status IS 'Status da sessão: iniciado, em_progresso, concluido, abandonado';

-- Verificação final
SELECT 'Sistema de questionários para treinamentos criado com sucesso!' AS resultado;
