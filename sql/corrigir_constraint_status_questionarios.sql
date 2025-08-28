-- ========================================
-- Correção da constraint de status para incluir "recusado"
-- ========================================

-- Remover a constraint atual
ALTER TABLE sessoes_questionarios 
DROP CONSTRAINT IF EXISTS sessoes_questionarios_status_check;

-- Adicionar nova constraint incluindo "recusado"
ALTER TABLE sessoes_questionarios 
ADD CONSTRAINT sessoes_questionarios_status_check 
CHECK (status IN ('iniciado', 'em_progresso', 'concluido', 'abandonado', 'recusado'));

-- Verificação
SELECT 'Constraint de status atualizada com sucesso para incluir "recusado"!' AS resultado;
