import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/styles.css";
import "./styles/tailwind.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Unregister any active service worker to prevent localhost Vite HMR conflicts
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
  if ("caches" in window) {
    caches.keys().then((names) => {
      for (let name of names) {
        caches.delete(name);
      }
    });
  }
}
