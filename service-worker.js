const CACHE_NAME = 'logistica-clubber-v9'; // Força a atualização para a versão mais recente e robusta.

// Arquivos locais (App Shell) que podem ser cacheados de forma segura.
const localUrlsToCache = [
  './',
  './index.html',
  './detalhes.html',
  './style.css',
  './script.js',
  './assets/logisticaclubber.png',
  './assets/mapa.jpg'
];

// Arquivos de terceiros que precisam de tratamento especial de CORS.
const thirdPartyUrlsToCache = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700&display=swap'
];

// Evento de Instalação: Salva os arquivos do App Shell no cache.
self.addEventListener('install', event => {
  self.skipWaiting(); // Força o novo Service Worker a se tornar ativo imediatamente.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Adicionando arquivos locais ao cache.');
        // Cacheia os arquivos locais primeiro.
        const localCachePromise = cache.addAll(localUrlsToCache);

        // Em paralelo, cacheia os arquivos de terceiros com modo 'no-cors'.
        const thirdPartyCachePromises = thirdPartyUrlsToCache.map(url => {
          const request = new Request(url, { mode: 'no-cors' });
          return fetch(request).then(response => cache.put(request, response));
        });

        // Espera todas as operações de cache terminarem.
        return Promise.all([localCachePromise, ...thirdPartyCachePromises]);
      })
  );
});

// Evento de Ativação: Limpa caches antigos.
// Isso é crucial para garantir que, ao atualizar o PWA, o usuário receba os novos arquivos.
self.addEventListener('activate', event => {
  clients.claim(); // Faz com que o SW ativo controle todas as abas abertas imediatamente.
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
});
// Evento de Fetch: Intercepta as requisições de rede.
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Estratégia "Network First" para a planilha do Google:
  // Tenta buscar na rede primeiro para ter dados sempre atualizados. Se falhar, usa o cache.
  if (requestUrl.href.includes('docs.google.com/spreadsheets')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return fetch(event.request)
          .then(networkResponse => {
            // Se a resposta da rede for bem-sucedida, clona e guarda no cache para uso offline futuro.
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Se a rede falhar (offline), tenta pegar a última versão salva do cache.
            console.log('Falha na rede. Servindo dados da planilha do cache.');
            // Retorna undefined se não encontrar no cache, para que o erro de rede seja propagado.
            return cache.match(event.request);
          });
      })
    );
    return;
  }

  // Estratégia "Cache First" para todos os outros arquivos:
  // Responde imediatamente com o cache se o arquivo existir. Se não, busca na rede.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se encontrarmos uma correspondência no cache, retornamos ela.
        if (response) {
          return response;
        }
        // Caso contrário, buscamos na rede e tentamos cachear para uso futuro.
        return fetch(event.request).then(networkResponse => {
            // Não cacheia respostas de erro ou de extensões do chrome
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'chrome-extension') {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
            return networkResponse;
          }
        ).catch(error => {
            // Se a busca na rede falhar (e não estava no cache), retorna um fallback.
            console.error('SW: Falha no fetch (rede e cache). Request:', event.request.url, error);
            // Para requisições de navegação (ex: abrir uma página), retorna a página principal.
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            // Para outros tipos de requisição (imagens, css), a falha é simplesmente propagada.
            // O navegador mostrará um ícone de imagem quebrada, por exemplo.
          });
      })
  );
});