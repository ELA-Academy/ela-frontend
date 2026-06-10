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
  // --- THIS IS THE FIX ---
  // If we've already run this logic, or if push is not supported, stop.
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
  // --- END OF FIX ---

  try {
    const registration = await navigator.serviceWorker.register(
      "/service-worker.js"
    );

    // Wait until the service worker is fully active and ready. This is crucial.
    await navigator.serviceWorker.ready;

    const existingSubscription =
      await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log("User is already subscribed.");
      isSubscribed = true; // Mark as subscribed and stop.
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
    console.log("User subscribed successfully.");
    isSubscribed = true; // Mark as subscribed to prevent re-running.
  } catch (error) {
    console.error("Failed to subscribe the user: ", error);
  }
}
