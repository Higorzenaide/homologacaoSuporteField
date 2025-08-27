-- Script para verificar a estrutura real das tabelas
-- Execute este primeiro para entender os tipos corretos

-- 1. Verificar estrutura da tabela noticias
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'noticias'
ORDER BY ordinal_position;

-- 2. Verificar estrutura da tabela treinamentos
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'treinamentos'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela usuarios
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- 4. Verificar estrutura das tabelas de analytics existentes
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('notification_analytics', 'noticias_analytics', 'treinamentos_analytics')
ORDER BY table_name, ordinal_position;
