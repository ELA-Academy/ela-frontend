const CACHE_NAME = "ela-academy-cache-v5";
const ASSETS_TO_CACHE = [
  "/vite.svg",
  "/images/ela-app-logo.png",
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

  // Handle HTML document navigations with Network-First strategy
  if (
    event.request.mode === "navigate" ||
    requestUrl.pathname === "/" ||
    requestUrl.pathname === "/index.html" ||
    (event.request.headers.get("accept") && event.request.headers.get("accept").includes("text/html"))
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in the background to update the cache (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
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
          // Do not cache HTML responses if requesting JS/CSS assets (e.g. from 404 rewrite)
          const contentType = networkResponse.headers.get("content-type") || "";
          if (
            (requestUrl.pathname.endsWith(".js") || requestUrl.pathname.endsWith(".css")) &&
            contentType.includes("text/html")
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        });
    })
  );
});

// Push notification handlers
self.addEventListener("push", (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/images/ela-app-logo.png",
    badge: "/images/ela-app-logo.png",
    data: {
      url: data.url,
    },
  };

  const badgePromise = ("setAppBadge" in navigator)
    ? navigator.setAppBadge(data.unread_count || 1).catch(() => {})
    : Promise.resolve();

  const notifPromise = self.registration.showNotification(data.title, options);

  event.waitUntil(Promise.all([badgePromise, notifPromise]));
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
