# 🏢 Suporte Field - Sistema de Gestão

Sistema completo de gestão de treinamentos e suporte técnico para a Desktop Fibra Internet.

## 🚀 Deploy Rápido

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/seu-usuario/suporte-field)

## ✨ Funcionalidades

### 🏠 **Página Inicial**
- Estatísticas editáveis em tempo real
- Cards de métricas personalizáveis
- Interface limpa e profissional

### 📚 **Treinamentos**
- CRUD completo de treinamentos
- Sistema de categorias dinâmicas
- Upload de arquivos PDF
- Comentários e curtidas
- Filtros avançados

### 📰 **Notícias**
- Gerenciamento de notícias
- Categorias específicas
- Sistema de publicação

### 🔗 **Links Importantes**
- Gerenciamento de links úteis
- Categorização por cores
- Ícones personalizáveis

### 👤 **Usuários**
- Controle de acesso por níveis
- Gestão de usuários (admin)
- Autenticação segura

### 💬 **Interações**
- Sistema de comentários
- Curtidas nos treinamentos
- Contadores em tempo real

## 🛠️ Tecnologias

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Deploy**: Vercel
- **Ícones**: Lucide React

## 🚀 Como Fazer Deploy

### 1. **Clone o Repositório**
```bash
git clone https://github.com/seu-usuario/suporte-field.git
cd suporte-field
```

### 2. **Configure Variáveis de Ambiente**
```bash
cp .env.example .env
# Edite o .env com suas configurações do Supabase
```

### 3. **Configure o Banco de Dados**
Execute os SQLs na pasta `/sql` no seu Supabase:
1. `database_complete_setup.sql`
2. `sistema_interacao_treinamentos.sql`
3. `criar_tabelas_categorias.sql`
4. `criar_tabela_links.sql`

### 4. **Deploy na Vercel**
1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente
3. Deploy automático!

## ⚙️ Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_APP_NAME=Suporte Field
VITE_APP_DESCRIPTION=Sistema de Gestão de Treinamentos
```

## 👥 Usuários Padrão

### Admin
- **Email**: admin@desktop.com.br
- **Senha**: admin123
- **Permissões**: Acesso total

### Técnico
- **Email**: tecnico1@desktop.com.br
- **Senha**: tecnico123
- **Permissões**: Usuário padrão

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
├── pages/              # Páginas principais
├── services/           # Serviços de API
├── contexts/           # Contextos React
├── lib/               # Utilitários
└── data/              # Dados mock

sql/                   # Scripts SQL
├── database_complete_setup.sql
├── sistema_interacao_treinamentos.sql
├── criar_tabelas_categorias.sql
└── criar_tabela_links.sql
```

## 🔒 Controle de Acesso

### **Visitantes**
- Visualizar treinamentos
- Visualizar notícias
- Visualizar links importantes

### **Usuários Autenticados**
- Todas as permissões de visitantes
- Comentar em treinamentos
- Curtir treinamentos

### **Administradores**
- Todas as permissões anteriores
- Gerenciar treinamentos
- Gerenciar notícias
- Gerenciar links
- Gerenciar usuários
- Gerenciar categorias
- Editar estatísticas

## 📊 Funcionalidades Avançadas

### **Sistema de Categorias**
- Categorias dinâmicas para treinamentos
- Categorias específicas para notícias
- Cores personalizáveis
- Reordenação por drag-and-drop

### **Sistema de Interações**
- Comentários com edição inline
- Sistema de curtidas
- Contadores em tempo real
- Notificações de mudanças

### **Upload de Arquivos**
- Upload seguro via Supabase Storage
- Suporte a PDFs
- Visualização inline
- Download direto

## 🔄 Atualizações

Para fazer atualizações:
```bash
git add .
git commit -m "✨ Nova funcionalidade"
git push
```

A Vercel fará deploy automático a cada push!

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs da Vercel
2. Confirme configurações do Supabase
3. Teste localmente primeiro

## 📄 Licença

Este projeto é propriedade da Desktop Fibra Internet.

---

**Desenvolvido com ❤️ para Desktop Fibra Internet**

