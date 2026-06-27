const CACHE_NAME = 'logistica-clubber-v2'; // Incrementamos a versão do cache
// Lista de arquivos essenciais para o funcionamento offline do aplicativo (App Shell).
const urlsToCache = [
  '/',
  '/index.html',
  '/detalhes.html',
  '/style.css',
  '/script.js',
  '/logisticaclubber.png',
  '/assets/mapa.jpg',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700&display=swap'
];

// Evento de Instalação: Salva os arquivos do App Shell no cache.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Evento de instalação. Cache aberto.');
        // O addAll é atômico. Se um arquivo falhar, a instalação inteira falha.
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Falha ao adicionar arquivos ao cache durante a instalação:', error);
        });
      })
  );
});

// Evento de Ativação: Limpa caches antigos.
// Isso é crucial para garantir que, ao atualizar o PWA, o usuário receba os novos arquivos.
self.addEventListener('activate', event => {
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
        );
      })
  );
});