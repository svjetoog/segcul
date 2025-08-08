// js/service-worker.js

// Nombre y versión del caché. Cambiar la versión fuerza la actualización del caché.
const CACHE_NAME = 'segcul-cache-v2';

// Archivos esenciales de la aplicación (el "App Shell") que se guardarán para funcionar offline.
const urlsToCache = [
  '/',
  '/index.html',
  //'/styles.css',
  '/js/main.js',
  '/js/ui.js',
  '/js/firebase.js',
  '/js/onboarding.js',
  '/js/components/timelinePrincipal.js',
  '/images/icons/icon-72x72.png',
  '/images/icons/icon-96x96.png',
  '/images/icons/icon-128x128.png',
  '/images/icons/icon-144x144.png',
  '/images/icons/icon-152x152.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-384x384.png',
  '/images/icons/icon-512x512.png'
];

// Evento 'install': Se dispara cuando el Service Worker se instala por primera vez.
// Aquí es donde guardamos en caché todos nuestros archivos del App Shell.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Si el nombre del caché no es el actual, lo eliminamos.
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Tomar control de todas las pestañas abiertas inmediatamente.
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    
    caches.match(event.request)
      .then(response => {
        
        if (response) {
          return response;
        }
        
        return fetch(event.request);
      }
    )
  );
});