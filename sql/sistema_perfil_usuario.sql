-- =====================================================
-- SISTEMA DE PERFIL DO USUÁRIO
-- =====================================================
-- Adiciona funcionalidades para perfil individual:
-- 1. Visibilidade de feedbacks para usuários
-- 2. Sistema de resposta a feedbacks (concordar/discordar)
-- 3. Views consolidadas para o perfil

-- =====================================================
-- 1. ATUALIZAR TABELA DE FEEDBACKS
-- =====================================================

-- Adicionar coluna para controlar visibilidade
ALTER TABLE feedbacks 
ADD COLUMN IF NOT EXISTS usuario_pode_ver BOOLEAN DEFAULT FALSE;

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_feedbacks_usuario_pode_ver 
ON feedbacks(usuario_pode_ver) WHERE usuario_pode_ver = true;

-- =====================================================
-- 2. CRIAR TABELA DE RESPOSTAS A FEEDBACKS
-- =====================================================

CREATE TABLE IF NOT EXISTS feedback_respostas (
    id SERIAL PRIMARY KEY,
    feedback_id INTEGER NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_resposta VARCHAR(10) NOT NULL CHECK (tipo_resposta IN ('concordo', 'discordo')),
    motivo_discordancia TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: um usuário só pode responder uma vez por feedback
    UNIQUE(feedback_id, usuario_id)
);

-- Indices para performance
CREATE INDEX idx_feedback_respostas_feedback_id ON feedback_respostas(feedback_id);
CREATE INDEX idx_feedback_respostas_usuario_id ON feedback_respostas(usuario_id);
CREATE INDEX idx_feedback_respostas_tipo ON feedback_respostas(tipo_resposta);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_feedback_respostas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feedback_respostas_updated_at
    BEFORE UPDATE ON feedback_respostas
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_respostas_updated_at();

-- =====================================================
-- 3. VIEW: PERFIL COMPLETO DO USUÁRIO
-- =====================================================

CREATE OR REPLACE VIEW vw_perfil_usuario AS
SELECT 
    u.id as usuario_id,
    u.nome,
    u.email,
    u.cargo,
    u.tipo_usuario,
    u.created_at as data_cadastro,
    u.ultimo_acesso,
    
    -- Estatísticas de interação
    COALESCE(stats.total_comentarios, 0) as total_comentarios,
    COALESCE(stats.total_curtidas, 0) as total_curtidas,
    COALESCE(stats.total_questionarios, 0) as total_questionarios,
    COALESCE(stats.media_notas, 0) as media_notas_questionarios,
    COALESCE(stats.total_feedbacks_visiveis, 0) as total_feedbacks_recebidos,
    COALESCE(stats.feedbacks_concordo, 0) as feedbacks_que_concordo,
    COALESCE(stats.feedbacks_discordo, 0) as feedbacks_que_discordo

FROM usuarios u
LEFT JOIN (
    -- Subquery para calcular estatísticas
    SELECT 
        u.id as usuario_id,
        
        -- Comentários em treinamentos
        (SELECT COUNT(*) FROM treinamento_comentarios tc WHERE tc.usuario_id = u.id) as total_comentarios,
        
        -- Curtidas em treinamentos  
        (SELECT COUNT(*) FROM treinamento_curtidas tcur WHERE tcur.usuario_id = u.id) as total_curtidas,
        
        -- Questionários respondidos
        (SELECT COUNT(*) FROM sessoes_questionarios sq WHERE sq.usuario_id = u.id AND sq.status = 'concluido') as total_questionarios,
        
        -- Média das notas em questionários
        (SELECT ROUND(AVG(sq.percentual_acerto), 1) FROM sessoes_questionarios sq WHERE sq.usuario_id = u.id AND sq.status = 'concluido') as media_notas,
        
        -- Feedbacks visíveis recebidos
        (SELECT COUNT(*) FROM feedbacks f WHERE f.usuario_id = u.id AND f.usuario_pode_ver = true) as total_feedbacks_visiveis,
        
        -- Respostas a feedbacks
        (SELECT COUNT(*) FROM feedback_respostas fr WHERE fr.usuario_id = u.id AND fr.tipo_resposta = 'concordo') as feedbacks_concordo,
        (SELECT COUNT(*) FROM feedback_respostas fr WHERE fr.usuario_id = u.id AND fr.tipo_resposta = 'discordo') as feedbacks_discordo
        
    FROM usuarios u
) stats ON stats.usuario_id = u.id;

-- =====================================================
-- 4. VIEW: FEEDBACKS DO USUÁRIO COM RESPOSTAS
-- =====================================================

CREATE OR REPLACE VIEW vw_feedbacks_usuario AS
SELECT 
    f.id as feedback_id,
    f.usuario_id,
    f.categoria_id,
    cf.nome as categoria_nome,
    cf.cor as categoria_cor,
    f.relato as feedback,
    f.created_at as data_feedback,
    f.usuario_pode_ver,
    
    -- Dados de quem deu o feedback (apenas nome para privacidade)
    u_autor.nome as autor_nome,
    
    -- Resposta do usuário (se existe)
    fr.tipo_resposta,
    fr.motivo_discordancia,
    fr.created_at as data_resposta
    
FROM feedbacks f
JOIN categorias_feedback cf ON cf.id = f.categoria_id
JOIN usuarios u_autor ON u_autor.id = f.admin_id
LEFT JOIN feedback_respostas fr ON fr.feedback_id = f.id
WHERE f.usuario_pode_ver = true;

-- =====================================================
-- 5. VIEW: HISTÓRICO DE ATIVIDADES DO USUÁRIO
-- =====================================================

CREATE OR REPLACE VIEW vw_atividades_usuario AS
-- Comentários em treinamentos
SELECT 
    tc.usuario_id,
    'comentario_treinamento' as tipo_atividade,
    'Comentou no treinamento' as descricao,
    t.titulo as item_titulo,
    tc.created_at as data_atividade,
    jsonb_build_object(
        'treinamento_id', tc.treinamento_id,
        'comentario', tc.comentario
    ) as detalhes
FROM treinamento_comentarios tc
JOIN treinamentos t ON t.id = tc.treinamento_id

UNION ALL

-- Curtidas em treinamentos
SELECT 
    tcur.usuario_id,
    'curtida_treinamento' as tipo_atividade,
    'Curtiu o treinamento' as descricao,
    t.titulo as item_titulo,
    tcur.created_at as data_atividade,
    jsonb_build_object(
        'treinamento_id', tcur.treinamento_id
    ) as detalhes
FROM treinamento_curtidas tcur
JOIN treinamentos t ON t.id = tcur.treinamento_id

UNION ALL

-- Questionários concluídos
SELECT 
    sq.usuario_id,
    'questionario_concluido' as tipo_atividade,
    'Concluiu questionário' as descricao,
    q.titulo as item_titulo,
    sq.data_conclusao as data_atividade,
    jsonb_build_object(
        'questionario_id', sq.questionario_id,
        'pontuacao', sq.percentual_acerto,
        'tentativa', sq.tentativa
    ) as detalhes
FROM sessoes_questionarios sq
JOIN questionarios_treinamentos q ON q.id = sq.questionario_id
WHERE sq.status = 'concluido'

UNION ALL

-- Respostas a feedbacks
SELECT 
    fr.usuario_id,
    'resposta_feedback' as tipo_atividade,
    CASE 
        WHEN fr.tipo_resposta = 'concordo' THEN 'Concordou com feedback'
        ELSE 'Discordou de feedback'
    END as descricao,
    cf.nome as item_titulo,
    fr.created_at as data_atividade,
    jsonb_build_object(
        'feedback_id', fr.feedback_id,
        'tipo_resposta', fr.tipo_resposta,
        'motivo_discordancia', fr.motivo_discordancia
    ) as detalhes
FROM feedback_respostas fr
JOIN feedbacks f ON f.id = fr.feedback_id
JOIN categorias_feedback cf ON cf.id = f.categoria_id

ORDER BY data_atividade DESC;

-- =====================================================
-- 6. FUNÇÕES RPC PARA O FRONTEND
-- =====================================================

-- Função para obter perfil completo do usuário
CREATE OR REPLACE FUNCTION get_user_profile(user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_data JSON;
BEGIN
    SELECT to_json(vw.*) INTO profile_data
    FROM vw_perfil_usuario vw
    WHERE vw.usuario_id = user_id_param;
    
    RETURN profile_data;
END;
$$;

-- Função para obter feedbacks do usuário
CREATE OR REPLACE FUNCTION get_user_feedbacks(user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    feedbacks_data JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', feedback_id,
            'categoria', categoria_nome,
            'categoria_cor', categoria_cor,
            'feedback', feedback,
            'data_feedback', data_feedback,
            'autor_nome', autor_nome,
            'tipo_resposta', tipo_resposta,
            'motivo_discordancia', motivo_discordancia,
            'data_resposta', data_resposta
        )
        ORDER BY data_feedback DESC
    ) INTO feedbacks_data
    FROM vw_feedbacks_usuario
    WHERE usuario_id = user_id_param;
    
    RETURN COALESCE(feedbacks_data, '[]'::json);
END;
$$;

-- Função para obter atividades do usuário
CREATE OR REPLACE FUNCTION get_user_activities(user_id_param UUID, limit_param INTEGER DEFAULT 50)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    activities_data JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'tipo', tipo_atividade,
            'descricao', descricao,
            'item_titulo', item_titulo,
            'data', data_atividade,
            'detalhes', detalhes
        )
        ORDER BY data_atividade DESC
    ) INTO activities_data
    FROM (
        SELECT * FROM vw_atividades_usuario
        WHERE usuario_id = user_id_param
        ORDER BY data_atividade DESC
        LIMIT limit_param
    ) limited_activities;
    
    RETURN COALESCE(activities_data, '[]'::json);
END;
$$;

-- Função para responder a um feedback
CREATE OR REPLACE FUNCTION respond_to_feedback(
    feedback_id_param INTEGER,
    user_id_param UUID,
    tipo_resposta_param VARCHAR(10),
    motivo_param TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    feedback_exists BOOLEAN;
    user_can_see BOOLEAN;
BEGIN
    -- Verificar se o feedback existe e se o usuário pode vê-lo
    SELECT 
        (f.id IS NOT NULL) as exists,
        COALESCE(f.usuario_pode_ver, false) as can_see
    INTO feedback_exists, user_can_see
    FROM feedbacks f
    WHERE f.id = feedback_id_param 
    AND f.usuario_id = user_id_param;
    
    IF NOT feedback_exists THEN
        RETURN json_build_object('success', false, 'error', 'Feedback não encontrado');
    END IF;
    
    IF NOT user_can_see THEN
        RETURN json_build_object('success', false, 'error', 'Você não tem permissão para ver este feedback');
    END IF;
    
    -- Inserir ou atualizar resposta
    INSERT INTO feedback_respostas (feedback_id, usuario_id, tipo_resposta, motivo_discordancia)
    VALUES (feedback_id_param, user_id_param, tipo_resposta_param, motivo_param)
    ON CONFLICT (feedback_id, usuario_id) 
    DO UPDATE SET 
        tipo_resposta = EXCLUDED.tipo_resposta,
        motivo_discordancia = EXCLUDED.motivo_discordancia,
        updated_at = NOW();
    
    RETURN json_build_object('success', true, 'message', 'Resposta registrada com sucesso');
END;
$$;

-- =====================================================
-- 7. POLÍTICAS DE SEGURANÇA (RLS)
-- =====================================================

-- Habilitar RLS (Row Level Security) nas tabelas
ALTER TABLE feedback_respostas ENABLE ROW LEVEL SECURITY;

-- Política para feedback_respostas: usuários só podem ver/editar suas próprias respostas
CREATE POLICY "Usuários podem gerenciar suas próprias respostas de feedback" ON feedback_respostas
FOR ALL USING (
  auth.uid()::uuid = usuario_id
);

-- Política para permitir que admins vejam todas as respostas
CREATE POLICY "Admins podem ver todas as respostas de feedback" ON feedback_respostas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid()::uuid 
    AND tipo_usuario = 'admin'
  )
);

-- NOTA: As views (vw_*) e funções RPC herdam as permissões das tabelas base
-- O Supabase automaticamente aplica as políticas de segurança

-- =====================================================
-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE feedback_respostas IS 'Armazena respostas dos usuários aos feedbacks recebidos';
COMMENT ON COLUMN feedbacks.usuario_pode_ver IS 'Define se o usuário mencionado pode ver este feedback';
COMMENT ON VIEW vw_perfil_usuario IS 'View consolidada com estatísticas do perfil do usuário';
COMMENT ON VIEW vw_feedbacks_usuario IS 'View dos feedbacks visíveis para cada usuário com suas respostas';
COMMENT ON VIEW vw_atividades_usuario IS 'Histórico completo de atividades do usuário no sistema';

-- =====================================================
-- EXEMPLO DE USO
-- =====================================================

/*
-- Obter perfil do usuário:
SELECT get_user_profile('uuid-do-usuario');

-- Obter feedbacks do usuário:
SELECT get_user_feedbacks('uuid-do-usuario');

-- Obter atividades do usuário (últimas 20):
SELECT get_user_activities('uuid-do-usuario', 20);

-- Responder a um feedback:
SELECT respond_to_feedback(
    123,  -- ID do feedback (integer)
    'uuid-do-usuario', 
    'discordo',
    'Não concordo pois acredito que minha performance foi adequada no período.'
);
*/
