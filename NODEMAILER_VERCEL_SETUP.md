# 📧 Nodemailer + Gmail na Vercel - Setup Rápido

## ✅ **O que já está pronto:**

1. **API Serverless:** `/api/send-email.js` criada
2. **Frontend atualizado:** `emailService.js` usa a API
3. **Variáveis:** Usa suas variáveis existentes (`VITE_EMAIL_USER` e `VITE_EMAIL_APP_PASSWORD`)
4. **Package.json:** Nodemailer adicionado
5. **Sistema anti-spam:** Mantido funcionando

## 🚀 **Como funciona agora:**

### **Fluxo:**
1. **Frontend** chama `/api/send-email`
2. **API Vercel** usa Nodemailer + Gmail SMTP  
3. **Gmail** envia o email diretamente
4. **Sistema** aplica delays anti-spam

### **Ordem de tentativas:**
1. **Nodemailer via API** (preferido)
2. Web3Forms (backup)
3. EmailJS (backup)  
4. Formspree (backup)

## ⚙️ **Suas variáveis já funcionam:**

Na Vercel, você já tem:
```
VITE_EMAIL_USER=seu-email@gmail.com
VITE_EMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

A API usa exatamente essas! Não precisa criar novas.

## 🧪 **Para testar:**

1. **Faça deploy** na Vercel (com as variáveis que já tem)
2. **Acesse o sistema**
3. **Vá em "Meu Perfil" > "Configurações"**  
4. **Clique "Enviar Email de Teste"**

### **Logs esperados no console:**
```
Método de envio falhou, tentando próximo... (se outros falharem)
✅ Email enviado com sucesso via Nodemailer
```

## 🔧 **Se der erro:**

### **Erro 500 na API:**
- Verifique se as variáveis estão na Vercel
- Aguarde alguns minutos após adicionar
- Faça redeploy se necessário

### **Erro de autenticação Gmail:**
- Confirme que App Password está correto
- Verifique se verificação em duas etapas está ativa
- Teste com email pessoal primeiro

### **Como verificar se API está funcionando:**
Abra no navegador:
```
https://seu-site.vercel.app/api/send-email
```

Deve retornar: `{"error":"Method not allowed"}` (isso é correto)

## 📊 **Vantagens desta solução:**

- ✅ **Usa suas variáveis existentes**
- ✅ **Gmail SMTP direto** (como você queria)
- ✅ **Sem configuração adicional**
- ✅ **Nodemailer robusto**
- ✅ **Delays anti-spam mantidos**
- ✅ **Fallbacks automáticos**
- ✅ **Logs detalhados**

## 🎯 **Resultado final:**

Agora você tem **exatamente** o que pediu:
- Gmail via Nodemailer
- Usando suas variáveis atuais
- API backend própria
- Sistema anti-spam funcionando
- Sem configurações extras

**Faça o deploy e teste!** 🚀
