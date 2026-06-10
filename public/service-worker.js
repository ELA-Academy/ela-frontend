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
