import React, { useEffect, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

const UpdateNotifier = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [initialBuildTime, setInitialBuildTime] = useState(null);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkVersion = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
        if (!response.ok) return;
        const data = await response.json();

        if (data && data.buildTime) {
          if (!initialBuildTime) {
            if (isMounted) setInitialBuildTime(data.buildTime);
          } else if (data.buildTime > initialBuildTime) {
            if (isMounted) setUpdateAvailable(true);
          }
        }
      } catch (err) {
        // Silent catch if offline or error
      }
    };

    // Initial check
    checkVersion();

    // Poll every 45 seconds
    const interval = setInterval(checkVersion, 45000);

    // Check when user returns to the tab
    const handleFocus = () => {
      checkVersion();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [initialBuildTime]);

  const handleReload = async () => {
    setReloading(true);
    try {
      // 1. Clear CacheStorage API caches
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      // 2. Unregister Service Workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      }
    } catch (err) {
      // Ignore cache clearing errors
    }

    // 3. Force Cache-Busting Hard Navigation (Identical to Ctrl + Shift + R / Ctrl + F5)
    setTimeout(() => {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("_upd", Date.now().toString());
      window.location.href = currentUrl.toString();
    }, 150);
  };

  if (!updateAvailable) return null;

  return (
    <button
      type="button"
      onClick={handleReload}
      disabled={reloading}
      className="btn btn-sm text-white d-inline-flex align-items-center gap-1.5 px-3 py-1 font-semibold text-xs rounded-pill shadow-sm hover-scale"
      style={{
        background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        border: "none",
        color: "#ffffff",
        fontSize: "12px",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.35)",
        zIndex: 1050,
      }}
      title="A new frontend update has been deployed. Click to restart!"
    >
      {reloading && <RefreshCw size={13} className="spin-icon" />}
      <span>{reloading ? "Restarting..." : "Restart to Update ➔"}</span>
    </button>
  );
};

export default UpdateNotifier;
