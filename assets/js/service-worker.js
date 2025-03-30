// Versão do cache - atualize para forçar a atualização de todos os recursos em cache
const CACHE_VERSION = 'v1.1';
const CACHE_NAME = `clinical-manager-${CACHE_VERSION}`;

// Recursos estáticos que sempre serão armazenados em cache para funcionamento offline
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/auth/login.html',
  '/offline/index.html',
  '/assets/css/app.css',
  '/assets/css/auth.css',
  '/assets/js/api.js',
  '/assets/js/app.js',
  '/assets/js/forms.js',
  '/assets/js/index.js',
  '/assets/imgs/carroussel-1.jpg',
  '/assets/imgs/carroussel-2.jpg',
  '/assets/imgs/carroussel-3.jpg'
];

// Instalação do Service Worker - armazena recursos estáticos em cache
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando Service Worker...');
  
  // Pré-armazena recursos estáticos
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Armazenando recursos em cache');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        // Força a ativação imediata do service worker
        return self.skipWaiting();
      })
  );
});

// Ativação do Service Worker - limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando Service Worker...');
  
  // Limpa caches antigos
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Service Worker ativado!');
        return self.clients.claim();
      })
  );
});

// Estratégia de cache: Cache First, depois rede
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Estratégia específica para recursos da API
  if (event.request.url.includes('/api/')) {
    handleApiRequest(event);
    return;
  }
  
  // Estratégia para recursos estáticos: Cache First, depois rede
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Recurso encontrado no cache, retorna imediatamente
          return cachedResponse;
        }
        
        // Recurso não encontrado no cache, busca na rede
        return fetch(event.request)
          .then((response) => {
            // Verifica se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone a resposta, pois ela só pode ser consumida uma vez
            const responseToCache = response.clone();
            
            // Armazena a resposta no cache para uso futuro
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch((error) => {
            console.log('[Service Worker] Erro ao buscar recurso:', error);
            
            // Para páginas HTML, retorna a página offline se disponível
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline/index.html');
            }
            
            // Se não for uma página HTML e houver erro, retorna um erro padrão
            return new Response('Recurso não disponível offline', {
              status: 503,
              statusText: 'Serviço indisponível'
            });
          });
      })
  );
});

// Função para lidar com requisições à API
function handleApiRequest(event) {
  event.respondWith(
    // Tenta buscar da rede primeiro
    fetch(event.request)
      .then((response) => {
        // Clone a resposta para armazenar no cache
        const responseToCache = response.clone();
        
        // Armazena a resposta no cache de API
        caches.open(`${CACHE_NAME}-api`)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch((error) => {
        console.log('[Service Worker] Erro ao buscar da API, tentando do cache:', error);
        
        // Se falhar, tenta buscar do cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            // Retorna o resultado em cache se disponível
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Se não houver cache, retorna um erro específico para a API
            return new Response(JSON.stringify({
              success: false,
              error: 'Não foi possível conectar ao servidor. Você está offline.'
            }), {
              status: 503,
              statusText: 'Serviço indisponível',
              headers: { 'Content-Type': 'application/json' }
            });
          });
      })
  );
}

// Evento de sincronização em segundo plano (para processar operações pendentes)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Evento de sincronização em segundo plano:', event.tag);
  
  if (event.tag === 'process-pending-operations') {
    event.waitUntil(processPendingOperations());
  }
});

// Função para processar operações pendentes quando a conexão for restabelecida
function processPendingOperations() {
  return new Promise((resolve) => {
    // Envie uma mensagem para as páginas ativas
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          action: 'PROCESS_PENDING_OPERATIONS'
        });
      });
      resolve();
    });
  });
}

// Notificação de atualização de Service Worker disponível
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});