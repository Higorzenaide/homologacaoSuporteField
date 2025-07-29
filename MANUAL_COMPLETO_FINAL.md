# Manual Completo - Portfólio Suporte Field Desktop

## 🌐 **URL de Acesso**
**https://azwjmfed.manus.space**

---

## 📋 **Visão Geral**

O Portfólio Suporte Field é uma plataforma completa para gerenciamento de treinamentos e notícias da equipe de suporte técnico da Desktop Fibra Internet. O sistema oferece controle de acesso baseado em funções, upload de arquivos, visualização de PDFs e muito mais.

---

## 🔐 **Sistema de Autenticação**

### **Tipos de Usuário**
- **Administrador**: Acesso completo - pode criar, editar, excluir treinamentos, notícias e gerenciar usuários
- **Usuário**: Acesso somente leitura - pode visualizar treinamentos e notícias

### **Login**
1. Clique no botão "Entrar" no canto superior direito
2. Digite seu email e senha
3. Clique em "Entrar"

### **Usuário Administrador Padrão**
- **Email**: admin@desktop.com.br
- **Senha**: (definida no Supabase)

---

## 👥 **Gerenciamento de Usuários** (Apenas Admins)

### **Acessar Página de Usuários**
1. Faça login como administrador
2. Clique no menu do usuário (canto superior direito)
3. Selecione "Gerenciar Usuários" ou clique na aba "Usuários"

### **Criar Novo Usuário**
1. Na página de usuários, clique em "Novo Usuário"
2. Preencha os campos:
   - **Email**: Email do funcionário
   - **Nome**: Nome completo
   - **Cargo**: Função na empresa
   - **Telefone**: Telefone de contato
   - **Tipo**: Administrador ou Usuário
   - **Status**: Ativo/Inativo
3. Clique em "Criar"
4. **Importante**: O sistema criará uma senha temporária que deve ser compartilhada com o usuário

### **Editar Usuário**
1. Na lista de usuários, clique em "Editar" ao lado do usuário desejado
2. Modifique os campos necessários
3. Clique em "Atualizar"

### **Desativar Usuário**
1. Na lista de usuários, clique em "Desativar" ao lado do usuário
2. Confirme a ação

---

## 📚 **Gerenciamento de Treinamentos**

### **Visualizar Treinamentos**
- Acesse a aba "Treinamentos"
- Use os filtros por categoria ou busque por nome/descrição
- Clique em "Baixar" para fazer download do arquivo
- **NOVO**: Clique no título do treinamento para visualizar o PDF diretamente no site

### **Adicionar Novo Treinamento** (Apenas Admins)
1. Na página de treinamentos, clique em "Novo Treinamento"
2. Preencha os campos:
   - **Título**: Nome do treinamento
   - **Categoria**: Selecione uma categoria existente
   - **Descrição**: Descrição detalhada
   - **Arquivo**: Upload do arquivo PDF (recomendado) ou PPT
   - **Tags**: Palavras-chave para facilitar busca
3. Clique em "Salvar"

### **Editar Treinamento** (Apenas Admins)
1. Localize o treinamento na lista
2. Clique no menu "⋮" ao lado do treinamento
3. Selecione "Editar"
4. Modifique os campos necessários
5. Opcionalmente, faça upload de um novo arquivo
6. Clique em "Salvar"

### **Excluir Treinamento** (Apenas Admins)
1. Localize o treinamento na lista
2. Clique no menu "⋮" ao lado do treinamento
3. Selecione "Excluir"
4. Confirme a ação

---

## 📰 **Gerenciamento de Notícias**

### **Visualizar Notícias**
- Acesse a aba "Notícias"
- Navegue pelas notícias mais recentes
- Use filtros por categoria se necessário

### **Adicionar Nova Notícia** (Apenas Admins)
1. Na página de notícias, clique em "Nova Notícia"
2. Preencha os campos:
   - **Título**: Título da notícia
   - **Conteúdo**: Texto completo da notícia
   - **Categoria**: Selecione uma categoria
   - **Autor**: Nome do autor
   - **Destaque**: Marque se a notícia deve aparecer em destaque
3. Clique em "Salvar"

### **Editar Notícia** (Apenas Admins)
1. Localize a notícia na lista
2. Clique no menu "⋮" ao lado da notícia
3. Selecione "Editar"
4. Modifique os campos necessários
5. Clique em "Salvar"

### **Excluir Notícia** (Apenas Admins)
1. Localize a notícia na lista
2. Clique no menu "⋮" ao lado da notícia
3. Selecione "Excluir"
4. Confirme a ação

---

## 📄 **Visualizador de PDF**

### **Como Usar**
1. Na página de treinamentos, clique no título de qualquer treinamento em PDF
2. O visualizador abrirá em tela cheia com as seguintes funcionalidades:
   - **Navegação**: Use os botões "Anterior" e "Próxima" ou digite o número da página
   - **Zoom**: Botões de zoom in/out ou clique em "100%" para resetar
   - **Download**: Botão para baixar o arquivo
   - **Fechar**: Botão "X" para fechar o visualizador

### **Controles do Teclado**
- **Setas**: Navegar entre páginas
- **Esc**: Fechar visualizador
- **+/-**: Zoom in/out

---

## 🔧 **Configurações Técnicas**

### **Banco de Dados (Supabase)**
- **URL**: https://uitgrdymxjxigbtufodb.supabase.co
- **Bucket de Storage**: "arquivos"
- **Tabelas**: usuarios, treinamentos, noticias, categorias

### **Tipos de Arquivo Suportados**
- **Treinamentos**: PDF (recomendado), PPT, PPTX
- **Visualização**: Apenas PDFs podem ser visualizados no site
- **Tamanho máximo**: 50MB por arquivo

### **Segurança**
- Row Level Security (RLS) ativado
- Políticas de acesso baseadas em função do usuário
- Autenticação via Supabase Auth

---

## 🚀 **Funcionalidades Implementadas**

### ✅ **Sistema de Autenticação**
- Login/logout seguro
- Controle de acesso por função
- Recuperação de senha
- Sessões persistentes

### ✅ **Gerenciamento de Usuários**
- CRUD completo de usuários
- Tipos de usuário (admin/usuário)
- Controle de status ativo/inativo

### ✅ **Repositório de Treinamentos**
- Upload de arquivos PDF/PPT
- Organização por categorias
- Sistema de busca e filtros
- Visualizador de PDF integrado
- Controle de downloads

### ✅ **Sistema de Notícias**
- Publicação de notícias diárias
- Sistema de categorias
- Notícias em destaque
- Editor de conteúdo

### ✅ **Interface Responsiva**
- Design adaptável para desktop, tablet e mobile
- Cores corporativas da Desktop Fibra Internet
- Interface moderna e intuitiva

### ✅ **Segurança e Controle**
- Políticas de acesso granulares
- Soft delete (exclusão lógica)
- Auditoria de ações
- Backup automático via Supabase

---

## 📞 **Suporte Técnico**

Para dúvidas ou problemas técnicos:
- **Email**: suporte@desktop.com.br
- **WhatsApp**: Botão disponível na página inicial
- **Telefone**: Botão "Ligar Agora" na página inicial

---

## 🔄 **Atualizações Futuras**

### **Funcionalidades Planejadas**
- Sistema de notificações em tempo real
- Relatórios de uso e estatísticas
- Integração com sistemas internos
- App mobile nativo
- Sistema de comentários nos treinamentos

### **Melhorias Contínuas**
- Otimização de performance
- Novos tipos de arquivo suportados
- Melhorias na interface do usuário
- Funcionalidades de colaboração

---

## 📊 **Estatísticas do Sistema**

O sistema exibe automaticamente:
- Total de treinamentos disponíveis
- Número de técnicos atendidos
- Taxa de satisfação
- Total de downloads
- Categorias ativas

---

**Versão**: 2.0 - Sistema Completo com Autenticação
**Data**: Janeiro 2025
**Desenvolvido por**: Manus AI para Desktop Fibra Internet

