const CACHE_NAME = 'logistica-clubber-v50'; // **IMPORTANTE**: Mude a versão a cada nova atualização

// Arquivos essenciais do App Shell. `index.html` e `script.js` são omitidos de propósito.
const CORE_ASSETS = [
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
      .then(cache => {
        console.log('SW: Cacheando core assets.');
        // Adiciona os assets de forma resiliente. Se um falhar, não quebra a instalação.
        const cachePromises = CORE_ASSETS.map(asset => {
          return cache.add(asset).catch(err => {
            console.warn(`SW: Falha ao cachear ${asset}`, err);
          });
        });
        return Promise.all(cachePromises);
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
    })()
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // **NOVO**: Ignora requisições de range (vídeos). O cache não suporta respostas parciais (206).
  // Isso corrige o erro "TypeError: Failed to fetch" e o 503 para vídeos.
  // Deixa o navegador lidar com o streaming de vídeo diretamente.
  if (request.headers.has('range')) {
    return; // Não intercepta, deixa a rede cuidar disso.
  }

  // **NOVO**: Ignora requisições para o Google Sheets para evitar problemas de CORS.
  // Deixa o navegador lidar com a busca de dados da planilha diretamente.
  if (url.hostname.includes('docs.google.com')) {
    return; // Não intercepta, deixa a rede cuidar disso.
  }

  // 1. **ESTRATÉGIA INFALÍVEL PARA ATUALIZAÇÃO**
  // Para requisições de navegação (HTML) e para o script.js, SEMPRE busca da rede.
  // Isso quebra o ciclo de cache e garante que o site e as imagens estejam sempre atualizados.
  if (request.mode === 'navigate' || url.pathname.endsWith('/script.js') || url.pathname.endsWith('/detalhes.html')) {
    // Network Only: Ignora o cache e vai direto para a rede.
    event.respondWith(
      fetch(request).catch(err => {
        console.error(`SW: Falha ao buscar ${request.url} da rede.`, err);
        // Como fallback, tenta servir do cache, mas é improvável que esteja lá.
        return caches.match(request);
      })
    );
    return;
  }

  // 2. ESTRATÉGIA PARA IMAGENS E MÍDIAS
  // Network First: Tenta a rede primeiro para ter sempre a imagem mais nova.
  // Se a rede falhar (offline), serve a versão que estiver no cache.
  if (request.destination === 'image' || request.destination === 'video' || request.destination === 'font') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const networkResponse = await fetch(request);
          // Se a resposta da rede for válida, armazena no cache e a retorna.
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // Se a rede falhar, busca no cache.
          const cachedResponse = await cache.match(request);
          return cachedResponse;
        }
      })
    );
    return;
  }

  // 3. ESTRATÉGIA PARA O RESTO (CSS, bibliotecas, etc.)
  // Stale-While-Revalidate: Serve do cache imediatamente para velocidade máxima.
  // Em paralelo, busca uma nova versão na rede para atualizar o cache para a próxima visita.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
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
    })
  );
});