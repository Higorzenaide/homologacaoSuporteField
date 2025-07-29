# 🚀 Instruções de Deploy na Vercel

## 📋 Pré-requisitos

1. **Conta na Vercel**: Crie uma conta em [vercel.com](https://vercel.com)
2. **Banco Supabase**: Configure o banco de dados no Supabase

## 🗄️ Configuração do Banco de Dados

### 1. Execute os SQLs no Supabase (nesta ordem):
```sql
-- 1. Criar tabelas de categorias
-- Execute: criar_tabelas_categorias.sql

-- 2. Criar tabela de links importantes  
-- Execute: criar_tabela_links.sql

-- 3. Criar tabela de estatísticas
-- Execute: create_estatisticas_table.sql

-- 4. Corrigir RLS das estatísticas
-- Execute: fix_rls_estatisticas.sql
```

### 2. Configurar Storage no Supabase:
- Crie um bucket chamado `arquivos`
- Configure as políticas de acesso público para leitura
- Configure upload apenas para usuários autenticados

## 🌐 Deploy na Vercel

### Método 1: Via Interface Web
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Faça upload do ZIP ou conecte ao GitHub
4. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`: URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase
5. Clique em "Deploy"

### Método 2: Via CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

## ⚙️ Variáveis de Ambiente

Configure estas variáveis no painel da Vercel:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_APP_NAME=Suporte Field
VITE_APP_DESCRIPTION=Sistema de Gestão de Treinamentos e Suporte Técnico
```

## 👥 Usuários Padrão

Após configurar o banco, crie estes usuários no Supabase Auth:

### Admin:
- **Email**: admin@desktop.com.br
- **Senha**: admin123
- **Papel**: admin

### Usuário Técnico:
- **Email**: tecnico1@desktop.com.br  
- **Senha**: tecnico123
- **Papel**: user

## 🎯 Funcionalidades do Sistema

### ✅ Implementadas:
- 🏠 **Página Inicial**: Estatísticas editáveis
- 📚 **Treinamentos**: CRUD completo com categorias dinâmicas
- 📰 **Notícias**: Sistema de notícias com categorias
- 🔗 **Links Importantes**: Gerenciamento de links úteis
- 👤 **Usuários**: Gerenciamento de usuários (admin)
- 💬 **Comentários**: Sistema de comentários nos treinamentos
- ❤️ **Curtidas**: Sistema de curtidas nos treinamentos
- 🎨 **Categorias**: Gerenciamento dinâmico de categorias
- 📊 **Estatísticas**: Contadores editáveis na página inicial

### 🔒 Controle de Acesso:
- **Visitantes**: Visualizam treinamentos, notícias e links
- **Usuários**: Podem comentar e curtir
- **Admins**: Acesso completo ao sistema

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Deploy**: Vercel
- **Ícones**: Lucide React

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs da Vercel
2. Confirme se as variáveis de ambiente estão corretas
3. Verifique se o banco Supabase está configurado corretamente

## 🎉 Pronto!

Após seguir estes passos, seu sistema estará funcionando perfeitamente na Vercel!

