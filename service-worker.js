const CACHE_NAME = 'logistica-clubber-v33'; // Mude a versão a cada atualização importante de arquivos

// Arquivos locais (App Shell) que podem ser cacheados de forma segura.
const localUrlsToCache = [
  './',
  './index.html',
  './detalhes.html',
  './style.css',
  './script.js',
  './assets/mapa.jpg',
  './assets/logisticaclubber.jpg' // Adiciona o ícone com o nome de arquivo correto
];

// Arquivos de terceiros que precisam de tratamento especial de CORS.
const thirdPartyUrlsToCache = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', // Garante que o mapa funcione offline
  'https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700&display=swap',
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
  'https://cdn.jsdelivr.net/npm/flatpickr', // Adiciona o script principal do flatpickr
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/pt.js'
];

// Evento de Instalação: Salva os arquivos do App Shell no cache.
self.addEventListener('install', event => {
  self.skipWaiting(); // Força o novo Service Worker a se tornar ativo imediatamente.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Iniciando instalação resiliente de cache.');

        // 1. Cacheia o App Shell local de forma atômica. Se um falhar, a instalação falha.
        const localCachePromise = cache.addAll(localUrlsToCache).catch(error => {
          console.error('SW: Falha crítica ao cachear App Shell. A instalação será abortada.', error);
          throw error; // Propaga o erro para falhar o event.waitUntil
        });

        // 2. Cacheia os arquivos de terceiros de forma resiliente.
        const thirdPartyCachePromises = thirdPartyUrlsToCache.map(url => {
          const request = new Request(url, { mode: 'no-cors' });
          return fetch(request)
            .then(response => cache.put(request, response))
            .catch(err => console.warn(`SW: Falha ao cachear recurso de terceiro (não-crítico): ${url}`, err));
        });

        // Promise.all garante que a instalação só termine após todas as tentativas de cache.
        return Promise.all([localCachePromise, ...thirdPartyCachePromises]);
      })
  );
});

// Evento de Ativação: Limpa caches antigos.
// Isso é crucial para garantir que, ao atualizar o PWA, o usuário receba os novos arquivos.
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // Limpa caches antigos
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('Service Worker: Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          })
      );

      // Força o SW a controlar todas as abas abertas imediatamente.
      await clients.claim();

      // Notifica todos os clientes (abas) para que eles possam recarregar.
      const allClients = await clients.matchAll({ type: 'window' });
      allClients.forEach(client => {
        client.postMessage({ type: 'NEW_VERSION_ACTIVATED' });
        })
      );
    })
  );
});

// --- FETCH EVENT STRATEGIES ---

/**
 * Network First Strategy (for Google Sheets API)
 * Tries network, falls back to cache, then to an error if both fail.
 */
function networkFirst(event) {
  return caches.open(CACHE_NAME).then(cache => {
    return fetch(event.request)
      .then(networkResponse => {
        if (networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      })
      .catch(async () => {
        console.log('Network failed. Serving from cache for:', event.request.url);
        const cachedResponse = await cache.match(event.request);
        // If found in cache, return it. Otherwise, return a proper error response.
        return cachedResponse || new Response(JSON.stringify({ error: "Network and cache failed" }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      });
  });
}

/**
 * Stale-While-Revalidate Strategy (for images and dynamic assets)
 * Responds from cache immediately, then updates the cache from the network in the background.
 */
function staleWhileRevalidate(event) {
  return caches.open(CACHE_NAME).then(cache => {
    return cache.match(event.request).then(cachedResponse => {
      // Fetch from network in the background to update the cache.
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      });

      // Return cached response immediately if available, otherwise wait for the network.
      return cachedResponse || fetchPromise;
    });
  });
}

/**
 * Cache First Strategy (for App Shell assets)
 * Tries cache, falls back to network, then to a fallback page for navigation.
 */
function cacheFirst(event) {
  // Para recursos de terceiros, a busca no cache precisa ser mais flexível
  // para encontrar a resposta "opaca" salva durante a instalação.
  const isThirdParty = thirdPartyUrlsToCache.some(url => event.request.url.startsWith(new URL(url, self.location).origin));
  const matchOptions = isThirdParty ? { ignoreVary: true, ignoreSearch: true } : undefined;

  return caches.match(event.request, matchOptions)
    .then(response => {
      // Se encontrarmos no cache, retornamos a resposta.
      if (response) {
        return response;
      }
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'chrome-extension') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return networkResponse;
      });
    })
    .catch(error => {
      console.error('SW: Fetch failed (network and cache). Request:', event.request.url, error);
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
      // For other assets like images, returning an error response is safer than undefined.
      return new Response('', { status: 503, statusText: 'Service Unavailable' });
    });
}

// Evento de Fetch: Intercepta as requisições de rede.
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // 1. Ignore Google Analytics and other non-essential requests.
  if (requestUrl.hostname.includes('google-analytics.com') || requestUrl.hostname.includes('googletagmanager.com')) {
    return; // Let the browser handle it without interception.
  }

  // 2. Network First for Google Sheets data (dados da planilha).
  if (requestUrl.href.includes('docs.google.com/spreadsheets')) {
    event.respondWith(networkFirst(event));
    return;
  }

  // 3. Stale-While-Revalidate para o App Shell (JS, CSS), imagens e vídeos.
  // Isso garante que o app carregue rápido do cache, mas se atualize em segundo plano.
  // É a solução definitiva para o problema de atualização de imagens.
  if (['script', 'style', 'image', 'video'].includes(event.request.destination) || event.request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(event));
    return;
  }

  // 4. Cache First for all other requests (App Shell, CSS, JS, etc.).
  // This keeps the core app loading instantly.
  event.respondWith(cacheFirst(event));

});

// --- PUSH NOTIFICATION EVENTS ---

/**
 * Evento 'push': Chamado quando uma notificação push é recebida do servidor.
 */
self.addEventListener('push', event => {
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('SW: Push data não é um JSON válido.', e);
    data = { title: 'Nova Notificação', body: event.data.text() };
  }

  const { title, body, icon, data: notificationData } = data;

  const options = {
    body: body,
    icon: icon || './assets/logisticaclubber.jpg', // Ícone padrão
    badge: './assets/logisticaclubber.jpg', // Ícone para a barra de status do Android
    vibrate: [100, 50, 100], // Vibração [vibra, pausa, vibra]
    data: notificationData || { url: './index.html' }, // Dados para usar no clique
    actions: [
      { action: 'explore', title: 'Ver Detalhes' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Evento 'notificationclick': Chamado quando o usuário clica na notificação.
 */
self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const urlToOpen = notification.data.url || './index.html';

  notification.close(); // Fecha a notificação

  // Abre a janela do PWA ou foca nela se já estiver aberta, e navega para a URL.
  event.waitUntil(clients.openWindow(urlToOpen));
});