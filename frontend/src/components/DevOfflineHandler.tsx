import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export function DevOfflineHandler({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [swActive, setSwActive] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if service worker is actually active
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setSwActive(true);
      }).catch(() => {
        setSwActive(false);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Only show warning if offline AND service worker is NOT active
  // If SW is active, offline features work fine
  if (import.meta.env.DEV && !isOnline && !swActive) {
    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <div className="bg-orange-100 border border-orange-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <WifiOff className="h-5 w-5 text-orange-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-orange-800">
                Development Mode - Offline
              </h3>
              <p className="text-xs text-orange-700 mt-1">
                Service worker not active. Offline features won't work until you reload.
              </p>
            </div>
            <button 
              onClick={() => setShowOfflineMessage(false)}
              className="text-orange-600 hover:text-orange-800 text-sm"
            >
              ×
            </button>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
          >
            <RefreshCw className="h-3 w-3" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default DevOfflineHandler;