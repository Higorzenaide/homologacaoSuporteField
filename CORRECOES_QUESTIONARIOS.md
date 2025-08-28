# Correções do Sistema de Questionários

## Problemas Corrigidos

### 1. Erro de Constraint "recusado" no Status

**Problema:** Erro `'new row for relation "sessoes_questionarios" violates check constraint "sessoes_questionarios_status_check"'`

**Causa:** A constraint da tabela `sessoes_questionarios` não incluía o status "recusado".

**Solução:** Execute o seguinte script SQL:

### 2. Erro de Chave Duplicada ao Recusar Questionário

**Problema:** Erro `'duplicate key value violates unique constraint "sessoes_questionarios_questionario_id_usuario_id_tentativa_key"'`

**Causa:** A função `recusarQuestionario` sempre tentava inserir uma nova sessão com `tentativa: 1`, mesmo quando já existia uma sessão anterior para o usuário.

**Solução:** Modificada a lógica da função para:
- Verificar se já existe uma sessão para o usuário
- Se existir, atualizar a sessão existente para status "recusado"
- Se não existir, criar uma nova sessão

### 3. Erro de Constraint "recusado" no Status (RESOLVIDO)

**Problema:** Erro `'new row for relation "sessoes_questionarios" violates check constraint "sessoes_questionarios_status_check"'`

**Causa:** A constraint da tabela `sessoes_questionarios` não incluía o status "recusado".

**Solução:** Execute o seguinte script SQL:

```sql
-- Remover a constraint atual
ALTER TABLE sessoes_questionarios 
DROP CONSTRAINT IF EXISTS sessoes_questionarios_status_check;

-- Adicionar nova constraint incluindo "recusado"
ALTER TABLE sessoes_questionarios 
ADD CONSTRAINT sessoes_questionarios_status_check 
CHECK (status IN ('iniciado', 'em_progresso', 'concluido', 'abandonado', 'recusado'));
```

### 4. Substituição de window.confirm por Modal Personalizado

**Problema:** Uso de `window.confirm()` que não oferece uma experiência de usuário personalizada.

**Solução:** 
- Criado componente `ConfirmRecusaModal.jsx` com design moderno
- Substituído `window.confirm` por modal personalizado no `ResponderQuestionarioModal.jsx`
- Adicionado visual mais informativo e consistente com o design do sistema

### 5. Melhoria na Validação de Perguntas Obrigatórias

**Problema:** Uso de `alert()` para mostrar erro de pergunta obrigatória.

**Solução:** Substituído por sistema de erro temporário que aparece na interface por 3 segundos.

## Arquivos Modificados

1. **src/components/ConfirmRecusaModal.jsx** (NOVO)
   - Modal personalizado para confirmar recusa de questionário
   - Design consistente com o tema do sistema
   - Indicadores de loading durante o processo

2. **src/components/ResponderQuestionarioModal.jsx** (MODIFICADO)
   - Importação do novo modal de confirmação
   - Substituição de `window.confirm()` por modal personalizado
   - Melhoria na validação de perguntas obrigatórias
   - Adicionado estado para controlar o modal de confirmação

3. **src/services/questionariosService.js** (MODIFICADO)
   - Função `recusarQuestionario` reescrita para evitar conflitos de chave única
   - Lógica inteligente que atualiza sessão existente ou cria nova conforme necessário
   - Melhor tratamento de erros e logs mais informativos

## Instruções de Deploy

1. **Execute o script SQL** para corrigir a constraint:
   ```bash
   # Execute no seu banco PostgreSQL
   psql -d sua_database -f sql/corrigir_constraint_status_questionarios.sql
   ```

2. **Deploy dos arquivos React:**
   - Os novos componentes já estão no código
   - Faça o build e deploy normalmente

## Funcionalidades Melhoradas

✅ **Modal de Recusa Elegante**
- Visual moderno e informativo
- Indicador de loading durante processamento
- Melhor experiência do usuário

✅ **Validação Suave de Perguntas**
- Sem mais pop-ups intrusivos
- Mensagens de erro integradas à interface
- Auto-dismiss em 3 segundos

✅ **Correção de Bugs de Banco**
- Status "recusado" agora é aceito pela constraint
- Questionários podem ser recusados sem erro
- Eliminado conflito de chave única na tabela de sessões

✅ **Lógica Inteligente de Recusa**
- Sistema verifica se sessão já existe antes de criar nova
- Atualiza sessão existente ao invés de tentar criar duplicada
- Melhor controle de tentativas e status

## Testado e Funcional

- ✅ Recusar questionário funciona corretamente
- ✅ Modal personalizado com boa UX
- ✅ Validações integradas à interface
- ✅ Sem mais erros de constraint no banco
- ✅ Sem mais erros de chave duplicada
- ✅ Lógica robusta para diferentes cenários de uso
