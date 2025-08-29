# 📧 Configuração de Notificações por Email - Gmail SMTP

## 🎯 Objetivo

Este sistema permite que as notificações do Portal Suporte Field sejam enviadas também por email, além das notificações internas do sistema.

## 🚀 Funcionalidades Implementadas

### ✅ **Serviço de Email**
- **Gmail SMTP Integration**: Envio de emails através do Gmail
- **Templates HTML Responsivos**: Emails bonitos e profissionais
- **Fallback Automático**: Se um método falhar, tenta outro
- **Rate Limiting**: Controle de frequência para evitar spam

### ✅ **Tipos de Notificação Suportados**
- 🎓 **Treinamentos Obrigatórios**: Quando novos treinamentos obrigatórios são criados
- ⏰ **Lembretes de Treinamento**: Para treinamentos pendentes ou próximos ao vencimento
- 📚 **Novos Treinamentos**: Quando novos treinamentos (não obrigatórios) são disponibilizados
- 📰 **Notícias**: Quando novas notícias são publicadas
- ⚙️ **Sistema**: Notificações importantes do sistema
- 📝 **Feedbacks**: Quando o usuário recebe novos feedbacks

### ✅ **Configurações do Usuário**
- **Ativar/Desativar**: Cada usuário pode controlar se quer receber emails
- **Frequência**: Imediato, Diário ou Semanal
- **Tipos Seletivos**: Escolher quais tipos de notificação receber
- **Email de Teste**: Testar se a configuração está funcionando

## 🛠️ Configuração do Gmail SMTP

### Passo 1: Configurar Gmail
1. **Acesse sua conta Gmail**
2. **Vá em "Gerenciar sua Conta Google"**
3. **Acesse "Segurança"**
4. **Habilite "Verificação em duas etapas"** (obrigatório)
5. **Crie uma "Senha de app"**:
   - Vá em "Segurança" > "Senhas de app"
   - Selecione "Email" como app
   - Copie a senha gerada (16 caracteres)

### Passo 2: Configurar Variáveis de Ambiente

#### **Para Deploy Local (.env.local)**
```env
# Gmail SMTP Configuration
VITE_EMAIL_USER=seu-email@gmail.com
VITE_EMAIL_APP_PASSWORD=sua-senha-de-app-16-caracteres
VITE_EMAIL_FROM=suporte@desktop.com.br
VITE_EMAIL_API_KEY=opcional-para-api-externa
```

#### **Para Deploy na Vercel**
1. Acesse o painel da Vercel
2. Vá em "Settings" > "Environment Variables"
3. Adicione as variáveis:

```
VITE_EMAIL_USER = seu-email@gmail.com
VITE_EMAIL_APP_PASSWORD = abcd efgh ijkl mnop
VITE_EMAIL_FROM = suporte@desktop.com.br
```

#### **Para Deploy no Netlify**
1. Acesse o painel do Netlify
2. Vá em "Site settings" > "Environment variables"
3. Adicione as mesmas variáveis acima

### Passo 3: Configurar Banco de Dados
Execute o SQL no Supabase SQL Editor:

```sql
-- Execute o arquivo: sql/adicionar_configuracoes_email.sql
```

## 📋 Como Usar

### 1. **Configuração Automática**
- O sistema está configurado para enviar emails automaticamente
- Novos usuários recebem emails por padrão
- Emails são enviados junto com as notificações internas

### 2. **Configurações do Usuário**
- Acesse "Meu Perfil" > aba "Configurações"
- Configure suas preferências de email
- Teste o envio com "Enviar Email de Teste"

### 3. **Para Administradores**
- Todas as notificações criadas no AdminModal enviam emails automaticamente
- O sistema respeita as preferências individuais de cada usuário
- Logs de email são mantidos para auditoria

## 🎨 Templates de Email

### Design Responsivo
- **Layout moderno** com cores da marca
- **Responsivo** para mobile e desktop
- **Ícones coloridos** para cada tipo de notificação
- **Botões de ação** para acessar o sistema

### Personalização por Tipo
- **Treinamentos Obrigatórios**: Cor vermelha, urgência alta
- **Lembretes**: Cor laranja, com alertas de prazo
- **Notícias**: Cor verde, informativo
- **Sistema**: Cor roxa, importante
- **Feedbacks**: Cor azul, informativo

## 🔧 Opções de Integração

### Opção 1: Gmail SMTP (Recomendado)
```javascript
// Configuração automática via emailService
const result = await emailService.sendNotificationEmail(
  userEmail, 
  userName, 
  notification
);
```

### Opção 2: API Externa (Avançado)
Para usar serviços como SendGrid, Mailgun, etc.:

```javascript
// Configure a API no emailService.js
const response = await fetch('/api/send-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify(emailData)
});
```

### Opção 3: Supabase Functions (Futuro)
```sql
-- Usar função RPC do Supabase
SELECT send_notification_email(
  'usuario@email.com',
  'Assunto',
  '<html>...</html>',
  'Texto...'
);
```

## 📊 Monitoramento

### Logs de Email
- Todos os emails são registrados na tabela `email_logs`
- Status: `queued`, `sent`, `failed`, `delivered`
- Rastreamento de erros e estatísticas

### Analytics (Futuro)
- Taxa de entrega
- Taxa de abertura
- Cliques em links
- Preferências dos usuários

## 🔒 Segurança

### Boas Práticas Implementadas
- **App Passwords**: Não usar senha principal do Gmail
- **Rate Limiting**: Pausas entre emails para evitar bloqueios
- **Fallback**: Se Gmail falhar, tenta métodos alternativos
- **Validação**: Verificar se usuário quer receber emails
- **RLS**: Row Level Security nos logs

### Proteções
- **Anti-Spam**: Respeita preferências do usuário
- **Privacidade**: Usuários controlam seus dados
- **Auditoria**: Logs completos de todas as operações

## 🐛 Solução de Problemas

### Email não está sendo enviado
1. **Verificar variáveis de ambiente**:
   ```javascript
   console.log('Email enabled:', emailService.isEmailEnabled());
   ```

2. **Verificar App Password do Gmail**:
   - Senha deve ter 16 caracteres
   - Verificação em duas etapas deve estar ativa

3. **Verificar logs no console**:
   ```javascript
   // Logs aparecem no console do navegador
   ```

### Usuário não recebe emails
1. **Verificar se tem email cadastrado**
2. **Verificar preferências do usuário**
3. **Verificar pasta de spam**
4. **Testar com "Enviar Email de Teste"**

### Rate Limiting do Gmail
- Gmail permite ~500 emails/dia para contas gratuitas
- Para uso corporativo, considere G Suite
- Implementado delay de 100ms entre emails

## 📈 Próximos Passos

### Melhorias Futuras
- [ ] **Rich Analytics**: Dashboard de estatísticas de email
- [ ] **Templates Personalizáveis**: Admin pode editar templates
- [ ] **Agendamento**: Emails em horários específicos
- [ ] **Anexos**: Enviar PDFs de treinamentos
- [ ] **Integração WhatsApp**: Notificações via WhatsApp

### Integrações Avançadas
- [ ] **SendGrid Integration**: Para empresas
- [ ] **Amazon SES**: Para alta escalabilidade
- [ ] **Firebase Cloud Messaging**: Para push notifications

## 📝 Suporte

Para dúvidas ou problemas:
1. Verifique os logs no console do navegador
2. Consulte a documentação do Gmail SMTP
3. Teste com um email de exemplo
4. Verifique se todas as variáveis estão configuradas

---

## ⚡ Início Rápido

1. **Configure Gmail**: Crie App Password
2. **Configure Variáveis**: Adicione no seu provedor de hosting
3. **Execute SQL**: `sql/adicionar_configuracoes_email.sql`
4. **Teste**: Use "Enviar Email de Teste" no perfil
5. **Pronto!** Emails serão enviados automaticamente

O sistema funciona em paralelo com as notificações internas - se o email falhar, as notificações do sistema continuam funcionando normalmente.
