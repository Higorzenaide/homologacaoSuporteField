-- ========================================
-- Função RPC para Atualizar Ordem dos Treinamentos
-- ========================================

-- Função para atualizar múltiplos treinamentos de uma vez
CREATE OR REPLACE FUNCTION update_treinamentos_ordem(updates JSONB)
RETURNS TEXT AS $$
DECLARE
    update_item JSONB;
    affected_rows INTEGER := 0;
BEGIN
    -- Iterar sobre cada update no array
    FOR update_item IN SELECT * FROM jsonb_array_elements(updates)
    LOOP
        UPDATE treinamentos 
        SET ordem = (update_item->>'ordem')::INTEGER,
            updated_at = NOW()
        WHERE id = (update_item->>'id')::INTEGER 
        AND ativo = true;
        
        -- Contar linhas afetadas
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        
        -- Log de debug
        RAISE LOG 'Treinamento % atualizado para ordem %', 
            update_item->>'id', 
            update_item->>'ordem';
    END LOOP;
    
    RETURN 'Ordem atualizada com sucesso para ' || jsonb_array_length(updates) || ' treinamentos';
END;
$$ LANGUAGE plpgsql;

-- Adicionar permissões para a função
GRANT EXECUTE ON FUNCTION update_treinamentos_ordem(JSONB) TO authenticated;

-- Verificação
SELECT 'Função update_treinamentos_ordem criada com sucesso!' AS resultado;
