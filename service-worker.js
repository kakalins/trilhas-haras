const CACHE_NAME = 'mapa-do-haras-cache-v1';
// Lista de arquivos essenciais da aplicação para salvar em cache
const CORE_ASSETS = [
    '/',
    'index.html',
    'manifest.json',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    // Adicione aqui os caminhos para os ícones, ex: 'icon-192.png'
];

// Evento 'install': Salva os arquivos essenciais no cache
self.addEventListener('install', event => {
    console.log('Service Worker: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Service Worker: Adicionando core assets ao cache.');
            return cache.addAll(CORE_ASSETS);
        })
    );
    self.skipWaiting();
});

// Evento 'activate': Limpa caches antigos se houver uma nova versão
self.addEventListener('activate', event => {
    console.log('Service Worker: Ativando...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Limpando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Evento 'fetch': Intercepta requisições
// Estratégia: Cache-first, depois network. Para os tiles do mapa, ele salva no cache conforme são baixados.
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // Se a resposta está no cache, retorna do cache
            if (cachedResponse) {
                // console.log('Retornando do cache:', event.request.url);
                return cachedResponse;
            }

            // Se não está no cache, busca na rede
            return fetch(event.request).then(networkResponse => {
                // Clona a resposta para poder salvar no cache e retornar ao navegador
                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME).then(cache => {
                    // Salva a nova resposta no cache para uso offline futuro
                    // Isso é crucial para os tiles do mapa!
                    cache.put(event.request, responseToCache);
                    // console.log('Salvando no cache:', event.request.url);
                });

                return networkResponse;
            });
        }).catch(error => {
            console.error('Fetch falhou; talvez esteja offline sem cache:', error);
            // Pode-se retornar uma página de fallback offline aqui, se desejar
        })
    );
});