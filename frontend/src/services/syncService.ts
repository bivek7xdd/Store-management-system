import { db } from '../db/db';
import api from './api';
import { OfflineStatus, SyncProgress } from '../types';

// Check if user is authenticated before attempting sync
const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Event emitter for sync status updates
class SyncEventEmitter extends EventTarget {
  emit(eventName: string, data?: any) {
    this.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }
}

const syncEvents = new SyncEventEmitter();

// Sync status state
let syncStatus: OfflineStatus = {
  isOnline: navigator.onLine,
  pendingSales: 0,
  lastSyncTime: null,
  isSyncing: false,
  syncError: null,
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
};

// Utility function for exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const calculateRetryDelay = (attempt: number): number => {
  const exponentialDelay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
  return Math.min(exponentialDelay, RETRY_CONFIG.maxDelay);
};

// Update sync status and emit events
const updateSyncStatus = (updates: Partial<OfflineStatus>) => {
  syncStatus = { ...syncStatus, ...updates };
  syncEvents.emit('statusChange', syncStatus);
};

// Get pending sales count
const updatePendingSalesCount = async () => {
  try {
    const count = await db.sales.where('synced').equals(0).count();
    updateSyncStatus({ pendingSales: count });
  } catch (error) {
    console.error('Failed to count pending sales:', error);
  }
};

export const syncService = {
  // Get current sync status
  getStatus: (): OfflineStatus => ({ ...syncStatus }),

  // Subscribe to status changes
  onStatusChange: (callback: (status: OfflineStatus) => void) => {
    const handler = (event: CustomEvent) => callback(event.detail);
    syncEvents.addEventListener('statusChange', handler as EventListener);

    // Return unsubscribe function
    return () => {
      syncEvents.removeEventListener('statusChange', handler as EventListener);
    };
  },

  // Subscribe to sync progress
  onSyncProgress: (callback: (progress: SyncProgress) => void) => {
    const handler = (event: CustomEvent) => callback(event.detail);
    syncEvents.addEventListener('syncProgress', handler as EventListener);

    return () => {
      syncEvents.removeEventListener('syncProgress', handler as EventListener);
    };
  },

  syncSales: async (retryAttempt = 0): Promise<boolean> => {
    if (!isAuthenticated()) {
      return false;
    }

    if (!navigator.onLine) {
      console.log('Offline: Skipping sync');
      updateSyncStatus({ syncError: 'Device is offline' });
      return false;
    }

    try {
      updateSyncStatus({ isSyncing: true, syncError: null });

      const unsyncedSales = await db.sales.where('synced').equals(0).toArray();

      if (unsyncedSales.length === 0) {
        console.log('No unsynced sales found');
        updateSyncStatus({
          isSyncing: false,
          lastSyncTime: new Date(),
          pendingSales: 0
        });
        return true;
      }

      console.log(`Syncing ${unsyncedSales.length} sales...`);

      // Emit initial progress
      syncEvents.emit('syncProgress', {
        total: unsyncedSales.length,
        completed: 0,
        current: 'Starting sync...'
      });

      let syncedCount = 0;
      const errors: string[] = [];

      for (const sale of unsyncedSales) {
        console.log("Raw sale data from DB:", JSON.stringify(sale, null, 2));  // Log exactly what's retrieved from DB

        let payload: any = null;
        try {
          // Emit progress update
          syncEvents.emit('syncProgress', {
            total: unsyncedSales.length,
            completed: syncedCount,
            current: `Syncing sale ${sale.id}...`
          });

          // Trim and validate customer fields
          const cleanedSale = {
            ...sale,
            customer_name: (sale.customer_name || '').trim(),
            customer_phone: (sale.customer_phone || '').trim(),
          };

          // Prepare payload matching CreateSaleData
          payload = {
            sales_type: cleanedSale.sales_type,
            amount_paid: cleanedSale.amount_paid,
            total_amount: cleanedSale.total_amount,
            note: cleanedSale.note,
            discount_applied: cleanedSale.discount_applied,
            customer_name: cleanedSale.customer_name,
            customer_phone: cleanedSale.customer_phone,
            items: cleanedSale.items,
          };

          console.log("Transformed sale data payload:", JSON.stringify(payload, null, 2));

          // Validate key fields, including customer details for credit
          if (payload.sales_type === 'credit' && (!payload.customer_name || !payload.customer_phone)) {
            console.error("Customer details missing for credit sale:", payload);
            throw new Error("Customer details required for credit sales");
          }

          console.log(`Syncing sale ID ${sale.id}...`);
          const response = await api.post('sales/create', payload);

          // Update local sale to synced
          if (sale.id) {
            await db.sales.update(sale.id, {
              synced: 1,
            });
          }

          syncedCount++;
          console.log(`Sale ID ${sale.id} synced successfully`);
        } catch (error: any) {
          const errorMsg = `Failed to sync sale ${sale.id}: ${error}`;
          console.warn(errorMsg);
          console.error("Full backend error response:", JSON.stringify(error.response?.data, null, 2));
          console.error("Raw DB data:", JSON.stringify(sale, null, 2));
          console.error("Transformed payload:", JSON.stringify(payload, null, 2));
          errors.push(errorMsg);
        }
      }

      // Final progress update
      syncEvents.emit('syncProgress', {
        total: unsyncedSales.length,
        completed: syncedCount,
        current: 'Sync completed'
      });

      const success = errors.length === 0;
      updateSyncStatus({
        isSyncing: false,
        lastSyncTime: new Date(),
        syncError: success ? null : `${errors.length} sales failed to sync`,
      });

      await updatePendingSalesCount();
      return success;

    } catch (error) {
      console.error('Sync failed:', error);

      // Implement retry logic
      if (retryAttempt < RETRY_CONFIG.maxRetries) {
        const retryDelay = calculateRetryDelay(retryAttempt);
        console.log(`Retrying sync in ${retryDelay}ms (attempt ${retryAttempt + 1}/${RETRY_CONFIG.maxRetries})`);

        updateSyncStatus({
          isSyncing: false,
          syncError: `Sync failed, retrying in ${Math.round(retryDelay / 1000)}s...`
        });

        await delay(retryDelay);
        return syncService.syncSales(retryAttempt + 1);
      }

      updateSyncStatus({
        isSyncing: false,
        syncError: `Sync failed after ${RETRY_CONFIG.maxRetries} attempts: ${error}`
      });

      return false;
    }
  },

  syncProducts: async (retryAttempt = 0): Promise<boolean> => {
    if (!isAuthenticated()) {
      return false;
    }

    if (!navigator.onLine) {
      console.log('Offline: Skipping product sync');
      return false;
    }

    try {
      console.log('Syncing products for offline use...');
      const response = await api.get('products?limit=1000');
      const products = response.data.data || [];

      if (products.length > 0) {
        await db.products.bulkPut(products);
        console.log(`Cached ${products.length} products`);
      }

      return true;
    } catch (error) {
      console.error('Failed to sync products:', error);

      // Implement retry logic for products too
      if (retryAttempt < RETRY_CONFIG.maxRetries) {
        const retryDelay = calculateRetryDelay(retryAttempt);
        console.log(`Retrying product sync in ${retryDelay}ms (attempt ${retryAttempt + 1}/${RETRY_CONFIG.maxRetries})`);

        await delay(retryDelay);
        return syncService.syncProducts(retryAttempt + 1);
      }

      return false;
    }
  },

  // Manual sync trigger
  triggerSync: async (): Promise<boolean> => {
    if (!isAuthenticated()) {
      return false;
    }

    if (!navigator.onLine) {
      updateSyncStatus({ syncError: 'Cannot sync while offline' });
      return false;
    }

    const salesSuccess = await syncService.syncSales();
    const productsSuccess = await syncService.syncProducts();

    return salesSuccess && productsSuccess;
  },

  // Initialize sync service
  init: () => {
    // Update online status
    const handleOnline = () => {
      console.log('Online detected');
      updateSyncStatus({ isOnline: true, syncError: null });
      if (isAuthenticated()) {
        console.log('User authenticated, triggering sync...');
        syncService.triggerSync();
      }
    };

    const handleOffline = () => {
      console.log('Offline detected');
      updateSyncStatus({
        isOnline: false,
        isSyncing: false,
        syncError: 'Device is offline'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial status setup
    updateSyncStatus({ isOnline: navigator.onLine });

    // Update pending sales count on init
    updatePendingSalesCount();

    // Initial sync check on load if online and authenticated
    if (navigator.onLine && isAuthenticated()) {
      syncService.triggerSync();
    }

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },

  // Update pending sales count (useful after creating offline sales)
  updatePendingSalesCount,
};
