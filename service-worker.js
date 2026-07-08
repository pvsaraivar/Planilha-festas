// service-worker.js (versão de desativação)
// Este Service Worker foi projetado para substituir a versão antiga e, em seguida,
// não fazer nada. Ele efetivamente "desliga" o cache do Service Worker para
// resolver problemas persistentes de atualização de conteúdo.

self.addEventListener('install', event => {
  // Força o novo Service Worker a se tornar ativo imediatamente.
  self.skipWaiting();
  console.log('Service Worker de desativação instalado.');
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // Limpa TODOS os caches antigos para garantir um estado limpo.
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      console.log('Service Worker de desativação ativado e caches antigos limpos.');
    })()
  );
});

self.addEventListener('fetch', event => {
  // Não intercepta nenhuma requisição, deixando o navegador lidar com tudo.
  return;
});