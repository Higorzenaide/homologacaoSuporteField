# 🕐 Sistema de Sessão Automática

Sistema completo de gerenciamento de sessões com expiração automática por inatividade.

## 📋 Visão Geral

O sistema monitora a atividade do usuário e encerra automaticamente a sessão após um período de inatividade, melhorando a segurança da aplicação.

### ✨ Características

- ⏰ **Monitoramento automático** de atividade do usuário
- ⚠️ **Aviso antecipado** antes da expiração
- 🔒 **Logout automático** quando a sessão expira
- 🎯 **Detecção inteligente** de atividade (mouse, teclado, scroll, etc.)
- ⚙️ **Configuração flexível** para diferentes ambientes
- 📱 **Interface responsiva** com modais informativos

---

## 🏗️ Arquitetura

### Componentes Principais

```
📁 Sistema de Sessão
├── 🔧 sessionService.js          # Lógica core do sistema
├── ⚙️ sessionConfig.js           # Configurações e presets
├── 🔔 SessionWarningModal.jsx    # Modal de aviso de expiração
├── 📊 SessionIndicator.jsx       # Indicador visual opcional
└── 🔗 AuthContext.jsx            # Integração com autenticação
```

---

## ⚙️ Configuração

### Tempos de Sessão (Configuráveis)

```javascript
// Preset Production (Padrão)
SESSION_TIMEOUT: 2 horas     // Tempo total da sessão
WARNING_TIME: 5 minutos      // Aviso antes de expirar
CHECK_INTERVAL: 30 segundos  // Frequência de verificação

// Preset Development  
SESSION_TIMEOUT: 15 minutos  // Para testes rápidos
WARNING_TIME: 2 minutos     
CHECK_INTERVAL: 10 segundos  

// Preset Demo
SESSION_TIMEOUT: 2 minutos   // Demonstrações
WARNING_TIME: 30 segundos    
CHECK_INTERVAL: 5 segundos   
```

### Como Alterar a Configuração

**1. Editar `src/config/sessionConfig.js`:**
```javascript
export const SESSION_PRESETS = {
  production: {
    SESSION_TIMEOUT: 4 * 60 * 60 * 1000, // 4 horas
    WARNING_TIME: 10 * 60 * 1000,        // 10 minutos
    // ...
  }
};
```

**2. Usar preset específico:**
```javascript
// Em sessionService.js
const config = getSessionConfig('extended'); // para sessões longas
```

---

## 🎯 Detecção de Atividade

### Eventos Monitorados
- `mousedown`, `mousemove` - Movimento do mouse
- `keypress`, `keydown` - Digitação
- `scroll` - Rolagem da página
- `touchstart`, `touchmove` - Toque (mobile)
- `click` - Cliques
- `focus`, `blur` - Foco em elementos
- `visibilitychange` - Mudança de aba

### Sistema de Throttle
- Evita sobrecarga com muitos eventos
- Registra atividade no máximo a cada 1 segundo (configurável)
- Performance otimizada

---

## 🔔 Interface do Usuário

### Modal de Aviso
**Aparece 5 minutos antes da expiração:**
- 🕐 **Timer visual** mostrando tempo restante
- ✅ **Botão "Continuar Conectado"** - Estende por mais 2 horas
- 🚪 **Botão "Sair Agora"** - Logout imediato
- ⚠️ **Design responsivo** com gradientes e animações

### Indicador de Sessão (Opcional)
**Widget no canto da tela:**
- 📊 **Progresso visual** da sessão
- 🕐 **Tempo restante** em formato legível
- 📋 **Detalhes expandidos** com informações técnicas
- 🎨 **Cores dinâmicas** baseadas no tempo restante

---

## 🔧 Integração Técnica

### No AuthContext
```javascript
import sessionService from '../services/sessionService';

// Iniciar monitoramento após login
startSessionMonitoring();

// Callbacks para eventos de sessão
onWarning: () => setShowSessionWarning(true)
onTimeout: () => logout()
```

### No App.jsx
```javascript
import SessionWarningModal from './components/SessionWarningModal';

<SessionWarningModal
  isOpen={showSessionWarning}
  onExtend={extendSession}
  onLogout={logoutFromSession}
/>
```

---

## 🚀 Funcionamento

### 1. **Login do Usuário**
- Sistema inicia monitoramento automático
- Timers configurados baseados na configuração
- Eventos de atividade são bindados

### 2. **Período de Atividade**
- Cada ação do usuário reseta os timers
- Sistema opera silenciosamente em background
- Verificações periódicas do status

### 3. **Aproximação do Timeout**
- 5 minutos antes: Modal de aviso aparece
- Timer visual mostra contagem regressiva
- Usuário pode estender ou sair

### 4. **Expiração da Sessão**
- Se não há interação: Logout automático
- Limpeza completa de dados e timers
- Redirecionamento para página inicial

---

## 🛡️ Segurança

### Medidas Implementadas

- ✅ **Limpeza completa** de localStorage no logout
- ✅ **Desconexão** de subscriptions ativas
- ✅ **Invalidação** de timers e intervals
- ✅ **Redirecionamento** forçado após logout
- ✅ **Verificação contínua** de estado da sessão

### Cenários Cobertos

- 🔒 **Usuário esquece de fazer logout**
- 💻 **Computador fica desatendido**
- 📱 **Aplicação em segundo plano**
- 🌐 **Perda de conexão temporária**
- 🔄 **Refresh acidental da página**

---

## 🎛️ Customização

### Para Ambientes Específicos

**Desenvolvimento:**
```javascript
// sessionConfig.js
const config = getSessionConfig('development');
// Sessão de 15 minutos para testes rápidos
```

**Produção:**
```javascript
const config = getSessionConfig('production');
// Sessão de 2 horas com alta segurança
```

**Demo/Apresentação:**
```javascript
const config = getSessionConfig('demo');
// Sessão de 2 minutos para demonstrações
```

### Personalizando Mensagens

```javascript
// sessionConfig.js
export const SESSION_MESSAGES = {
  WARNING_TITLE: 'Sua sessão vai expirar!',
  WARNING_MESSAGE: 'Clique para continuar...',
  // ...
};
```

---

## 🔄 Estados do Sistema

| Estado | Descrição | Ação |
|--------|-----------|------|
| `🟢 Ativo` | Usuário logado e ativo | Monitoramento normal |
| `🟡 Próximo` | < 5 min para expirar | Mostrar modal de aviso |
| `🔴 Expirado` | Tempo esgotado | Logout automático |
| `⚫ Inativo` | Usuário deslogado | Sistema parado |

---

## 🐛 Debugging

### Indicador Visual (Desenvolvimento)
```javascript
// App.jsx - Descomente para mostrar
<SessionIndicator />
```

**Mostra:**
- ⏱️ Tempo restante em tempo real
- 📅 Último acesso registrado
- 📊 Progresso visual da sessão
- 🎯 Status atual do sistema

### Logs do Console
```javascript
🕐 Iniciando monitoramento de sessão...
⚠️ Sessão próxima do timeout - mostrando aviso
⏰ Sessão expirada - fazendo logout automático
🛑 Parando monitoramento de sessão...
```

---

## 🎯 Benefícios

### Para Segurança
- 🔒 **Reduz riscos** de acesso não autorizado
- ⏰ **Força logout** em computadores esquecidos
- 🛡️ **Protege dados** sensíveis automaticamente

### Para Experiência do Usuário
- ⚠️ **Aviso antecipado** evita perda de trabalho
- 🔄 **Extensão fácil** com um clique
- 📱 **Interface intuitiva** e responsiva

### Para Administração
- ⚙️ **Configuração flexível** por ambiente
- 📊 **Monitoramento transparente** de atividade
- 🔧 **Fácil manutenção** e debugging

---

## 📝 Resumo de Implementação

✅ **SessionService** - Lógica core implementada  
✅ **SessionConfig** - Configurações flexíveis criadas  
✅ **Modal de Aviso** - Interface amigável implementada  
✅ **Integração AuthContext** - Sistema conectado  
✅ **Detecção de Atividade** - Eventos monitorados  
✅ **Limpeza de Recursos** - Memória gerenciada  
✅ **Indicador Visual** - Debugging facilitado  
✅ **Documentação Completa** - Sistema documentado  

**O sistema está pronto para uso em produção! 🚀**
