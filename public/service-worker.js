const CACHE_NAME = "ela-academy-cache-v2";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/vite.svg",
  "/images/ELA-logo.png",
  "/images/icon-192.png",
  "/images/icon-512.png"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching shell assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // If it's a backend API request or websocket, bypass cache
  if (
    requestUrl.pathname.startsWith("/api") || 
    requestUrl.pathname.startsWith("/socket.io") || 
    event.request.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in the background to update the cache (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Ignore network errors in background update
          });
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            !networkResponse || 
            networkResponse.status !== 200 || 
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // If offline and requesting page/document, return cached index
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
    })
  );
});

// Push notification handlers
self.addEventListener("push", (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/images/ELA-logo.png",
    badge: "/images/ELA-logo.png",
    data: {
      url: data.url, // The full URL sent from the backend
    },
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  // This function ensures that if a window with the URL is already open, we focus it.
  // Otherwise, we open a new window.
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        let client = null;
        for (let i = 0; i < windowClients.length; i++) {
          const windowClient = windowClients[i];
          if (windowClient.url === urlToOpen && "focus" in windowClient) {
            client = windowClient;
            break;
          }
        }

        if (client) {
          return client.focus();
        } else if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
