/* Офлайн-режим SkillUp.

   Стратегия «сеть сначала, кеш как запасной»:
     • есть сеть  → всегда отдаём СВЕЖИЕ файлы (и обновляем кеш),
       иначе после первого запуска приложение навсегда осталось бы
       на старой версии — кеш-первым тут не годится;
     • нет сети   → отдаём кеш, приложение открывается как раньше.

   Номер версии поднимаем при каждом изменении списка файлов —
   так браузеры переустанавливают кеш. */

const CACHE = 'skillup-v3';
const FILES = [
  './',
  './index.html',
  './styles.css',
  './content.js',
  './store.js',
  './app.js',
  './cloud.js',
  './map.js',
  './onboarding.js',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request)
        .then((hit) => hit || caches.match('./index.html')))
  );
});
