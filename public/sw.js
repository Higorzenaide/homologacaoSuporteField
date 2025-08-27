// Service Worker para notificações push
const CACHE_NAME = 'suporte-field-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/logo.jpeg'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar do cache se disponível
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Gerenciar notificações push
self.addEventListener('push', (event) => {
  console.log('Push event recebido:', event);

  let notificationData = {
    title: 'Suporte Field',
    body: 'Você tem uma nova notificação',
    icon: '/logo.jpeg',
    badge: '/logo.jpeg',
    tag: 'suporte-field-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/logo.jpeg'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
        data: data
      };
    } catch (error) {
      console.error('Erro ao processar dados do push:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Gerenciar cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Determinar URL para abrir
  let urlToOpen = '/';
  
  if (event.notification.data && event.notification.data.action_url) {
    urlToOpen = event.notification.data.action_url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Verificar se já existe uma janela aberta
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Focar na janela existente e navegar para a URL
            return client.focus().then(() => {
              return client.navigate(urlToOpen);
            });
          }
        }
        
        // Abrir nova janela se não houver janela aberta
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Gerenciar fechamento de notificações
self.addEventListener('notificationclose', (event) => {
  console.log('Notificação fechada:', event);
  
  // Aqui você pode enviar analytics ou fazer outras ações
  // quando o usuário fecha a notificação sem clicar
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(
      // Aqui você pode sincronizar dados ou fazer outras tarefas
      // quando o dispositivo voltar a ter conexão
      Promise.resolve()
    );
  }
});

// Gerenciar mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('Mensagem recebida no SW:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Configurações de notificação
const NOTIFICATION_OPTIONS = {
  icon: '/logo.jpeg',
  badge: '/logo.jpeg',
  vibrate: [200, 100, 200],
  requireInteraction: false,
  silent: false
};

// Função para mostrar notificação local
function showLocalNotification(title, options = {}) {
  const notificationOptions = {
    ...NOTIFICATION_OPTIONS,
    ...options
  };

  return self.registration.showNotification(title, notificationOptions);
}

// Exportar para uso global
self.showLocalNotification = showLocalNotification;
