import { db } from '../db/db';
import api from './api';
import { OfflineStatus, SyncProgress } from '../types';
import { Category, Supplier } from '../types';

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
  pendingProducts: 0,
  pendingCategories: 0,
  pendingSuppliers: 0,
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

// Get pending products count
const updatePendingProductsCount = async () => {
  try {
    const count = await db.products.where('synced').notEqual(1).count();
    updateSyncStatus({ pendingProducts: count });
  } catch (error) {
    console.error('Failed to count pending products:', error);
  }
};

// Get pending categories count
const updatePendingCategoriesCount = async () => {
  try {
    const count = await db.categories.where('synced').notEqual(1).count();
    updateSyncStatus({ pendingCategories: count });
  } catch (error) {
    console.error('Failed to count pending categories:', error);
  }
};

// Get pending suppliers count
const updatePendingSuppliersCount = async () => {
  try {
    const count = await db.suppliers.where('synced').notEqual(1).count();
    updateSyncStatus({ pendingSuppliers: count });
  } catch (error) {
    console.error('Failed to count pending suppliers:', error);
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

          // Prepare payload matching CreateSaleData
          payload = {
            sales_type: sale.sales_type,
            amount_paid: sale.amount_paid,
            total_amount: sale.total_amount,
            payments: sale.payments,
            note: sale.note,
            discount_applied: sale.discount_applied,
            customer_id: sale.customer_id,
            items: sale.items,
          };

          console.log("Transformed sale data payload:", JSON.stringify(payload, null, 2));

          // Validate key fields
          if (!payload.customer_id) {
            console.error("Customer ID missing for sale:", payload);
            throw new Error("Customer identification required for all sales");
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
      // First, upload any locally modified products
      const unsyncedProducts = await db.products.where('synced').notEqual(1).toArray();
      
      if (unsyncedProducts.length > 0) {
        console.log(`Syncing ${unsyncedProducts.length} local products to server...`);
        
        for (const product of unsyncedProducts) {
          try {
            // Handle deletion (synced = -1)
            if ((product as any).synced === -1) {
              if (!product.id.startsWith('temp-')) {
                await api.delete(`products/${product.id}`);
              }
              await db.products.delete(product.id);
              continue;
            }

            // Handle create or update
            const payload = {
              name: product.name,
              price: product.price,
              stock_quantity: product.stock_quantity,
              category_id: product.category_id,
              supplier_id: product.supplier_id,
              barcode: product.barcode,
              cost_price: product.cost_price,
              market_price: product.market_price,
              low_stock_threshold: product.low_stock_threshold,
              expires_at: product.expires_at,
              status: product.status,
              image_url: product.image_url,
              is_tracked: product.is_tracked,
            };

            if (product.id.startsWith('temp-')) {
              // Create new product
              const response = await api.post('products/create', payload);
              const createdProduct = response.data?.data || response.data;
              
              if (createdProduct && createdProduct.id) {
                await db.products.delete(product.id);
                await db.products.put({ ...createdProduct, synced: 1 });
              }
            } else {
              // Update existing product
              const response = await api.put(`products/${product.id}`, payload);
              const updatedProduct = response.data?.data || response.data;
              await db.products.put({ ...updatedProduct, synced: 1 });
            }
          } catch (error: any) {
            console.warn(`Failed to sync product ${product.id}:`, error.message);
          }
        }
      }

      // Then, download latest products from server
      console.log('Syncing products from server for offline use...');
      const response = await api.get('products?limit=1000');
      const products = response.data.data || [];

      if (products.length > 0) {
        // Mark all server products as synced
        const syncedProducts = products.map((p: any) => ({ ...p, synced: 1 }));
        await db.products.bulkPut(syncedProducts);
        console.log(`Cached ${products.length} products from server`);

        // --- T020: Sync variant cache & purge archived variants ---
        try {
          console.log('[Sync] Refreshing variant cache via POS catalog...');
          const catalogResp = await api.get('pos/catalog');
          const catalogItems = catalogResp.data?.data || [];
          
          for (const item of catalogItems) {
            // item.variants is returned as a JSON array from the backend
            const variants = Array.isArray(item.variants) ? item.variants : [];
            
            if (variants.length > 0) {
              // Upsert active variants
              const toCache = variants.map((v: any) => ({
                ...v,
                product_id: item.id,
                synced: 1,
              }));
              await db.product_variants.bulkPut(toCache);

              // Purge locally any variants for this product NOT in the server list
              const serverIds = new Set(variants.map((v: any) => v.id));
              const localVariants = await db.product_variants
                .where('product_id')
                .equals(item.id)
                .toArray();
              
              const toDelete = localVariants
                .filter(lv => !serverIds.has(lv.id))
                .map(lv => lv.id);
                
              if (toDelete.length > 0) {
                await db.product_variants.bulkDelete(toDelete);
                console.log(`[Sync] Purged ${toDelete.length} archived variants for product ${item.id}`);
              }
            } else {
              // If no variants on server, clear local variants for this product
              const localVariants = await db.product_variants
                .where('product_id')
                .equals(item.id)
                .toArray();
              if (localVariants.length > 0) {
                await db.product_variants.bulkDelete(localVariants.map(v => v.id));
              }
            }
          }
        } catch (variantSyncErr) {
          // Non-fatal: log but don't block
          console.warn('[Sync] Variant cache refresh failed:', variantSyncErr);
        }
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

  syncCategories: async (retryAttempt = 0): Promise<boolean> => {
    if (!isAuthenticated()) {
      return false;
    }

    if (!navigator.onLine) {
      console.log('Offline: Skipping category sync');
      return false;
    }

    try {
      const unsyncedCategories = await db.categories.where('synced').notEqual(1).toArray();

      if (unsyncedCategories.length === 0) {
        console.log('No unsynced categories found');
        return true;
      }

      console.log(`Syncing ${unsyncedCategories.length} categories...`);

      let syncedCount = 0;
      const errors: string[] = [];

      for (const category of unsyncedCategories) {
        try {
          // Handle deletion (synced = -1)
          if (category.synced === -1) {
            if (!category.id.startsWith('temp-cat-')) {
              await api.delete(`categories?category_id=${category.id}`);
            }
            await db.categories.delete(category.id);
            syncedCount++;
            continue;
          }

          // Handle create or update
          const payload = {
            name: category.name,
            description: category.description,
          };

          if (category.id.startsWith('temp-cat-')) {
            // Create new category
            const response = await api.post('categories/create', payload);
            const createdCategory = response.data?.data || response.data;
            
            if (createdCategory && createdCategory.id) {
              await db.categories.delete(category.id);
              await db.categories.put({ ...createdCategory, synced: 1 });
            }
          } else {
            // Update existing category
            const response = await api.put(`categories/${category.id}`, payload);
            const updatedCategory = response.data?.data || response.data;
            await db.categories.put({ ...updatedCategory, synced: 1 });
          }

          syncedCount++;
        } catch (error: any) {
          const errorMsg = `Failed to sync category ${category.id}: ${error.message}`;
          console.warn(errorMsg);
          errors.push(errorMsg);
        }
      }

      const success = errors.length === 0;
      console.log(`Category sync completed: ${syncedCount}/${unsyncedCategories.length} successful`);
      
      await updatePendingCategoriesCount();
      return success;
    } catch (error) {
      console.error('Category sync failed:', error);

      // Implement retry logic
      if (retryAttempt < RETRY_CONFIG.maxRetries) {
        const retryDelay = calculateRetryDelay(retryAttempt);
        console.log(`Retrying category sync in ${retryDelay}ms (attempt ${retryAttempt + 1}/${RETRY_CONFIG.maxRetries})`);

        await delay(retryDelay);
        return syncService.syncCategories(retryAttempt + 1);
      }

      return false;
    }
  },

  syncSuppliers: async (retryAttempt = 0): Promise<boolean> => {
    if (!isAuthenticated()) {
      return false;
    }

    if (!navigator.onLine) {
      console.log('Offline: Skipping supplier sync');
      return false;
    }

    try {
      const unsyncedSuppliers = await db.suppliers.where('synced').notEqual(1).toArray();

      if (unsyncedSuppliers.length === 0) {
        console.log('No unsynced suppliers found');
        return true;
      }

      console.log(`Syncing ${unsyncedSuppliers.length} suppliers...`);

      let syncedCount = 0;
      const errors: string[] = [];

      for (const supplier of unsyncedSuppliers) {
        try {
          // Handle deletion (synced = -1)
          if (supplier.synced === -1) {
            if (!supplier.id.startsWith('temp-sup-')) {
              await api.delete(`suppliers/${supplier.id}`);
            }
            await db.suppliers.delete(supplier.id);
            syncedCount++;
            continue;
          }

          // Handle create or update
          const payload = {
            name: supplier.name,
            address: supplier.address,
            phone_number: supplier.phone_number,
            email: supplier.email,
          };

          if (supplier.id.startsWith('temp-sup-')) {
            // Create new supplier
            const response = await api.post('suppliers/create', payload);
            const createdSupplier = response.data?.data || response.data;
            
            if (createdSupplier && createdSupplier.id) {
              await db.suppliers.delete(supplier.id);
              await db.suppliers.put({ ...createdSupplier, synced: 1 });
            }
          } else {
            // Update existing supplier
            const response = await api.put(`suppliers/${supplier.id}`, payload);
            const updatedSupplier = response.data?.data || response.data;
            await db.suppliers.put({ ...updatedSupplier, synced: 1 });
          }

          syncedCount++;
        } catch (error: any) {
          const errorMsg = `Failed to sync supplier ${supplier.id}: ${error.message}`;
          console.warn(errorMsg);
          errors.push(errorMsg);
        }
      }

      const success = errors.length === 0;
      console.log(`Supplier sync completed: ${syncedCount}/${unsyncedSuppliers.length} successful`);
      
      await updatePendingSuppliersCount();
      return success;
    } catch (error) {
      console.error('Supplier sync failed:', error);

      // Implement retry logic
      if (retryAttempt < RETRY_CONFIG.maxRetries) {
        const retryDelay = calculateRetryDelay(retryAttempt);
        console.log(`Retrying supplier sync in ${retryDelay}ms (attempt ${retryAttempt + 1}/${RETRY_CONFIG.maxRetries})`);

        await delay(retryDelay);
        return syncService.syncSuppliers(retryAttempt + 1);
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
    const categoriesSuccess = await syncService.syncCategories();
    const suppliersSuccess = await syncService.syncSuppliers();
    const productsSuccess = await syncService.syncProducts();

    return salesSuccess && categoriesSuccess && suppliersSuccess && productsSuccess;
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

    // Update pending counts on init
    updatePendingSalesCount();
    updatePendingProductsCount();
    updatePendingCategoriesCount();
    updatePendingSuppliersCount();

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

  // Update pending counts (useful after creating offline items)
  updatePendingCounts: async () => {
    await updatePendingSalesCount();
    await updatePendingProductsCount();
    await updatePendingCategoriesCount();
    await updatePendingSuppliersCount();
  },
};
