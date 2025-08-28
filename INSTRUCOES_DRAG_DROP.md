# Instruções para Instalar React Beautiful DnD

Para o sistema de drag-and-drop funcionar corretamente, você precisa instalar a biblioteca `react-beautiful-dnd`.

## Comandos de Instalação

Execute um dos comandos abaixo no terminal:

### Usando npm:
```bash
npm install react-beautiful-dnd
```

### Usando yarn:
```bash
yarn add react-beautiful-dnd
```

## Arquivos Adicionados/Modificados

### 📁 **Novos Arquivos:**
- `sql/adicionar_coluna_ordem_treinamentos.sql` - Adiciona coluna ordem na tabela
- `sql/funcao_update_ordem_treinamentos.sql` - Função RPC para updates em batch
- `src/components/DraggableTreinamentoList.jsx` - Componente principal de drag-and-drop

### 📝 **Arquivos Modificados:**
- `src/services/treinamentosService.js` - Função para atualizar ordem + ordenação por ordem
- `src/pages/Treinamentos.jsx` - Botão toggle + integração com drag-and-drop

## Como Funciona

1. **Admin clica em "Reordenar Treinamentos"**
2. **Modo drag-and-drop é ativado**
3. **Admin arrasta cartões para nova posição**
4. **Ordem é salva automaticamente no banco**
5. **Todos os usuários veem a nova ordem**

## Banco de Dados

Certifique-se de executar os scripts SQL:

1. `sql/adicionar_coluna_ordem_treinamentos.sql`
2. `sql/funcao_update_ordem_treinamentos.sql`

Após instalar a biblioteca e executar os scripts, o sistema estará pronto para uso!
