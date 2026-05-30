import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { syncService } from "./services/syncService";
import { waitForServiceWorker, checkServiceWorkerStatus } from "./utils/pwaUtils";

import { db } from "./db/db";

// Initialize sync service
syncService.init();

// Verify Data persistence
db.products.count();
db.sales.count();

// Enhanced service worker registration for both dev and production
const updateSW = registerSW({
  onNeedRefresh() {
    console.log("New content available, please refresh.");
    // Auto-refresh in development for faster iteration
    if (import.meta.env.DEV) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log("App ready to work offline.");
  },
  onRegistered(r) {
    console.log("SW Registered: " + r);
    // Less aggressive checking in development
    if (!import.meta.env.DEV) {
      setInterval(async () => {
        const isActive = await checkServiceWorkerStatus();
        if (!isActive) {
          console.warn('Service worker not active, attempting to register again');
          r?.update();
        }
      }, 30000); // Check every 30 seconds in production only
    }
  },
  onRegisterError(error) {
    console.log("SW registration error", error);
  },
});

// Render the app immediately in both dev and production
createRoot(document.getElementById("root")!).render(<App />);
