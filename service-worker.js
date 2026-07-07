const CACHE_NAME = 'logistica-clubber-v43'; // Mude a versão a cada atualização importante de arquivos

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

      // Notifica todos os clientes (abas) para que eles possam recarregar, se necessário.
      const allClients = await clients.matchAll({ type: 'window' });
      allClients.forEach(client => {
        client.postMessage({ type: 'NEW_VERSION_ACTIVATED' });
      });
    })()
  ); // A chamada da IIFE estava faltando e havia um parêntese extra.
});

// --- FETCH EVENT STRATEGIES ---

/**
 * Network First Strategy: Tries network, falls back to cache.
 * Ideal para recursos que mudam com frequência, como imagens de eventos.
 */
function networkFirst(event) {
  return new Promise((resolve) => {
    // 1. Tenta buscar da rede primeiro.
    fetch(event.request).then(networkResponse => {
      // Se a resposta da rede for bem-sucedida (status 200-299),
      // atualiza o cache e retorna a nova resposta.
      if (networkResponse.ok) {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
      }
      // Retorna a resposta da rede, seja ela 200 OK ou 304 Not Modified.
      // O navegador saberá o que fazer com a resposta 304 (usar seu próprio cache).
      resolve(networkResponse);
    }).catch(async () => {
      // 2. Se a rede falhar completamente (offline), busca no cache do Service Worker.
      const cachedResponse = await caches.match(event.request);
      // Retorna a resposta do cache ou, se não houver, deixa o navegador falhar.
      resolve(cachedResponse);
    }
    );
  });
}
function staleWhileRevalidate(event) {
  return new Promise(async (resolve, reject) => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(event.request);

    // Inicia a busca na rede. Esta promessa será usada para atualizar o cache
    // ou como fallback se não houver nada no cache.
    const networkFetchPromise = fetch(event.request)
      .then(networkResponse => {
        if (networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse; // Retorna a resposta da rede para a cadeia de promessas.
      });

    // Se tivermos uma resposta no cache, a retornamos imediatamente.
    // A busca na rede continuará em segundo plano para atualizar o cache para a próxima visita.
    // Se não houver cache, aguardamos a resposta da rede (ou seu erro).
    resolve(cachedResponse || networkFetchPromise);
  });
}

// Evento de Fetch: Intercepta as requisições de rede.
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Ignora requisições de range (vídeos). O cache não suporta respostas parciais (206).
  // Isso corrige o erro "Partial response (status code 206) is unsupported".
  if (event.request.headers.has('range')) {
    return; // Deixa o navegador lidar com a requisição diretamente.
  }

  // 1. Ignore Google Analytics and other non-essential requests.
  if (requestUrl.hostname.includes('google-analytics.com') || requestUrl.hostname.includes('googletagmanager.com')) {
    return; // Let the browser handle it without interception.
  }

  // 2. Network First para o HTML principal. Garante que a estrutura do site esteja sempre atualizada.
  // Isso quebra o ciclo de cache que impedia o script.js novo de ser carregado.
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event));
    return;
  }

  // 2. Deixa o navegador gerenciar o script.js diretamente (Network Only).
  // Isso resolve o problema de cache do script e garante que o eventImageMap esteja sempre atualizado.
  if (requestUrl.pathname.endsWith('/script.js')) {
    return; // Não intercepta, deixa a rede cuidar disso.
  }

  // 3. Network First para imagens e vídeos. Garante que o conteúdo visual esteja sempre atualizado.
  if (
    event.request.destination === 'image' ||
    event.request.destination === 'video'
  ) {
    event.respondWith(networkFirst(event));
    return;
  }

  // 3. Stale-While-Revalidate para o resto (CSS, fontes, navegação).
  // Isso garante que o app carregue rápido do cache, mas se atualize em segundo plano.
  event.respondWith(staleWhileRevalidate(event));

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