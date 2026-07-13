const CACHE_NAME = 'logistica-clubber-v52'; // **IMPORTANTE**: Mude a versão a cada nova atualização

// Arquivos essenciais do App Shell. `index.html` e `script.js` são omitidos de propósito.
const APP_SHELL_ASSETS = [
  './',
  './style.css',
  './assets/mapa.jpg',
  './assets/logisticaclubber.jpg',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
  'https://cdn.jsdelivr.net/npm/flatpickr',
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/pt.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('SW: Cacheando core assets.');
        // Adiciona os assets de forma resiliente. Se um falhar, não quebra a instalação toda.
        for (const asset of APP_SHELL_ASSETS) {
          try {
            await cache.add(asset);
          } catch (err) {
            console.warn(`SW: Falha ao cachear ${asset}`, err);
          }
        }
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // Limpa caches antigos para evitar conflitos.
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
      // Assume o controle de todas as abas abertas imediatamente.
      await clients.claim();
      // **NOVO**: Notifica todos os clientes (abas) que uma nova versão foi ativada.
      const allClients = await clients.matchAll({ type: 'window' });
      allClients.forEach(client => {
        client.postMessage({ type: 'NEW_VERSION_ACTIVATED' });
      });
    })()
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições que não são GET, requisições de range (vídeos) e para a API do Google.
  // O Service Worker não deve interceptar essas chamadas.
  if (request.method !== 'GET' || request.headers.has('range') || url.hostname.includes('docs.google.com')) {
    return; // Não intercepta, deixa a rede cuidar disso.
  }

  // 1. ESTRATÉGIA PARA PÁGINAS HTML (Navegação)
  // Network falling back to Cache: Tenta a rede primeiro para obter a versão mais recente.
  // Se a rede falhar, serve a página do cache para permitir o acesso offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch (error) {
          console.log(`SW: Falha na rede para navegação. Servindo do cache: ${request.url}`);
          return caches.match(request);
        }
      })()
    );
    return;
  }

  // 2. ESTRATÉGIA PARA ASSETS DO APP SHELL (CSS, JS, Fontes)
  // Stale-While-Revalidate: Serve do cache imediatamente para velocidade máxima.
  // Em paralelo, busca uma nova versão na rede para atualizar o cache para a próxima visita.
  if (APP_SHELL_ASSETS.some(asset => url.pathname.endsWith(asset.replace('./', '/')))) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);

        const networkFetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
          console.warn(`SW: Falha ao buscar ${request.url} em segundo plano.`, err);
        });

        // Retorna o cache se existir, senão, espera a rede.
        return cachedResponse || networkFetchPromise;
      })()
    );
    return;
  }

  // 3. ESTRATÉGIA PARA IMAGENS E MÍDIAS DINÂMICAS (Stale-While-Revalidate)
  // Serve do cache imediatamente para velocidade. Em paralelo, busca na rede para atualizar o cache.
  // Isso garante que as imagens sejam atualizadas na próxima visita sem bloquear a renderização inicial.
  if (request.destination === 'image' || request.destination === 'video') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);

        const networkFetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
          console.warn(`SW: Falha ao buscar mídia ${request.url} em segundo plano.`, err);
        });

        return cachedResponse || networkFetchPromise;
      })()
    );
    return;
  }
});