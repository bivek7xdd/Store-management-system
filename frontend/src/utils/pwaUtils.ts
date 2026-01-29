// PWA utility functions for better offline handling

export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

export const checkServiceWorkerStatus = async (): Promise<boolean> => {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return !!registration && !!registration.active;
  } catch (error) {
    console.error('Error checking service worker status:', error);
    return false;
  }
};

export const forceServiceWorkerUpdate = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      console.log('Service worker updated');
    }
  } catch (error) {
    console.error('Error updating service worker:', error);
  }
};

// Check if the app is running offline
export const isAppOffline = (): boolean => {
  return !navigator.onLine;
};

// Wait for service worker to be ready
export const waitForServiceWorker = (): Promise<ServiceWorkerRegistration | null> => {
  return new Promise((resolve) => {
    if (!isServiceWorkerSupported()) {
      resolve(null);
      return;
    }

    if (navigator.serviceWorker.controller) {
      resolve(navigator.serviceWorker.getRegistration());
      return;
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      resolve(navigator.serviceWorker.getRegistration());
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      resolve(navigator.serviceWorker.getRegistration());
    }, 5000);
  });
};