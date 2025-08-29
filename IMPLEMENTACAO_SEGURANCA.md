# 🔒 GUIA DE IMPLEMENTAÇÃO DAS MELHORIAS DE SEGURANÇA

## 📋 **PASSOS PARA IMPLEMENTAÇÃO**

### 🚨 **PASSO 1: IMPLEMENTAR CORREÇÕES CRÍTICAS NO BANCO**

1. **Execute o script de segurança no banco de dados:**
```sql
-- Execute: sql/correcoes_seguranca_criticas.sql
-- ATENÇÃO: Faça backup antes!
```

2. **Migrar senhas existentes para hash:**
```sql
-- Após executar o script acima, execute:
SELECT migrate_passwords_to_hash();
```

3. **Verificar se as novas funções estão funcionando:**
```sql
-- Teste a autenticação:
SELECT * FROM authenticate_user_secure('email@test.com', 'senha123');

-- Teste criação de usuário:
SELECT * FROM create_user_secure('novo@test.com', 'senha123', 'Teste User');
```

### 🔧 **PASSO 2: ATUALIZAR SERVIÇOS FRONTEND**

Os seguintes arquivos foram atualizados com melhorias de segurança:

#### **Novos Arquivos Criados:**
- ✅ `src/services/securityService.js` - Serviço central de segurança
- ✅ `api/send-email-secure.js` - API segura de email
- ✅ `sql/correcoes_seguranca_criticas.sql` - Correções SQL

#### **Arquivos Modificados:**
- ✅ `src/services/authService.js` - Rate limiting e validações
- ✅ `src/services/usuariosService.js` - Sanitização de dados
- ✅ `src/services/firstLoginService.js` - Validações robustas

### 🔄 **PASSO 3: ATUALIZAR CHAMADAS DE API**

**Substitua as chamadas antigas pelas novas funções seguras:**

```javascript
// ANTES:
supabase.rpc('authenticate_user', {...})
supabase.rpc('create_user', {...})
supabase.rpc('update_user_password_first_login', {...})

// DEPOIS:
supabase.rpc('authenticate_user_secure', {...})
supabase.rpc('create_user_secure', {...})
supabase.rpc('update_user_password_first_login_secure', {...})
```

### 📧 **PASSO 4: MIGRAR API DE EMAIL**

1. **Substitua o arquivo atual:**
```bash
# Renomeie ou faça backup do atual
mv api/send-email.js api/send-email-old.js

# Use a nova versão segura
cp api/send-email-secure.js api/send-email.js
```

2. **Configure variáveis de ambiente:**
```bash
# No Vercel, adicione:
ALLOWED_ORIGINS=https://seu-dominio.com,https://homologacao-seu-dominio.com
```

### 🛡️ **PASSO 5: CONFIGURAÇÕES DE PRODUÇÃO**

#### **Headers de Segurança (Vercel):**
Adicione ao `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

#### **Limpeza Automática de Logs:**
```sql
-- Configurar limpeza automática (se pg_cron estiver disponível)
SELECT cron.schedule('cleanup-logs', '0 2 * * *', 'SELECT cleanup_old_logs();');
```

---

## 🧪 **TESTES DE SEGURANÇA**

### **Teste 1: Rate Limiting**
```javascript
// Teste múltiplas tentativas de login
for (let i = 0; i < 10; i++) {
  await authService.login('test@email.com', 'senha_errada');
}
// Deve bloquear após 5 tentativas
```

### **Teste 2: Validação de Entrada**
```javascript
// Teste entradas maliciosas
const dadosMaliciosos = {
  nome: "<script>alert('xss')</script>",
  email: "javascript:alert('xss')",
  senha: "123" // Muito curta
};

const result = await usuariosService.criarUsuario(dadosMaliciosos);
// Deve retornar erros de validação
```

### **Teste 3: Autenticação**
```javascript
// Teste com senhas em hash
const loginResult = await authService.login('user@test.com', 'senha123');
// Deve funcionar com senhas hasheadas e texto plano (transição)
```

---

## 📊 **MONITORAMENTO**

### **Logs de Segurança para Monitorar:**
- `LOGIN_ATTEMPT` - Tentativas de login
- `LOGIN_FAILED` - Falhas de login
- `LOGIN_RATE_LIMIT_EXCEEDED` - Rate limit atingido
- `PASSWORD_CHANGE_ATTEMPT` - Tentativas de alteração de senha
- `USER_CREATE_ATTEMPT` - Tentativas de criação de usuário

### **Alertas Recomendados:**
1. **5+ tentativas de login falharam para o mesmo email**
2. **Rate limit atingido múltiplas vezes**
3. **Tentativas de XSS detectadas**
4. **Criação de usuários admin**

---

## 🚨 **VERIFICAÇÕES PÓS-IMPLEMENTAÇÃO**

### ✅ **Checklist de Segurança:**
- [ ] Senhas estão sendo hasheadas (verificar no banco)
- [ ] Rate limiting está funcionando
- [ ] Validações de entrada estão ativas
- [ ] Logs de segurança estão sendo gerados
- [ ] APIs retornam headers de segurança
- [ ] CORS está restrito aos domínios corretos
- [ ] Funções antigas foram removidas/renomeadas

### 🔍 **Comandos de Verificação:**
```sql
-- Verificar se senhas estão hasheadas
SELECT email, LEFT(senha, 10) as senha_inicio 
FROM usuarios 
WHERE senha LIKE '$2%';

-- Verificar logs de auditoria
SELECT * FROM auth_attempts 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar ações de usuário
SELECT * FROM user_actions 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## ⚠️ **IMPORTANTE**

### **Backup Obrigatório:**
Antes de implementar qualquer mudança em produção:
1. Faça backup completo do banco
2. Teste em ambiente de homologação
3. Tenha plano de rollback pronto

### **Rollback (se necessário):**
```sql
-- Reverter para funções antigas (se guardou backup)
-- Restaurar backup do banco
-- Reverter código para versão anterior
```

### **Suporte:**
Em caso de problemas:
1. Verifique logs de erro no console
2. Confirme se variáveis de ambiente estão configuradas
3. Teste individualmente cada nova função
4. Monitore logs de segurança

---

**🎯 Resultado esperado:** Sistema significativamente mais seguro com proteções contra as principais vulnerabilidades identificadas, mantendo a funcionalidade existente.
