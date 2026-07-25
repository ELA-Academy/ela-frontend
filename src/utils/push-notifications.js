import api from "./api";

// A flag to ensure the subscription logic only runs once per session.
let isSubscribed = false;

// Helper function to convert the VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUser() {
  if (
    isSubscribed ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push messaging is not supported by this browser.");
    }
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/service-worker.js"
    );

    // Wait until the service worker is fully active and ready.
    await navigator.serviceWorker.ready;

    const existingSubscription =
      await registration.pushManager.getSubscription();
    if (existingSubscription) {
      // Re-post to server to ensure backend always has the latest subscription.
      // This handles cases where the server DB was reset or subscription was lost.
      try {
        await api.post("/push/subscribe", existingSubscription);
      } catch (e) {
        console.warn("Failed to re-sync push subscription with server:", e);
      }
      console.log("User push subscription synced with server.");
      isSubscribed = true;
      return;
    }

    // Request permission from the user
    const permission = await window.Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Permission for notifications was denied.");
      return;
    }

    const response = await api.get("/push/vapid-key");
    const applicationServerKey = urlBase64ToUint8Array(response.data.publicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey,
    });

    await api.post("/push/subscribe", subscription);
    console.log("User subscribed to push notifications successfully.");
    isSubscribed = true;
  } catch (error) {
    console.error("Failed to subscribe the user: ", error);
  }
}
