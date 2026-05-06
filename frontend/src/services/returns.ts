import api from './api';
import { Return, PendingReturnItem, PendingReturn } from '../types';
import { db } from '../db/db';

export const returnsService = {
  // Sync offline pending returns
  syncReturns: async (pendingReturns: PendingReturn[]) => {
    try {
      const response = await api.post('/returns/sync', { returns: pendingReturns });
      return response.data;
    } catch (error) {
      console.error('Error syncing returns:', error);
      throw error;
    }
  },

  // Process a return (online or offline)
  processReturn: async (
    sale_id: string,
    refund_amount: number,
    refund_method: string,
    items: PendingReturnItem[],
    isOnline: boolean
  ) => {
    if (isOnline) {
      try {
        const response = await api.post('/returns', {
          sale_id,
          refund_amount,
          refund_method,
          items,
        });
        return response.data;
      } catch (error) {
        console.error('Online return processing failed, saving offline', error);
        return await returnsService.saveReturnOffline(sale_id, refund_amount, refund_method, items);
      }
    } else {
      return await returnsService.saveReturnOffline(sale_id, refund_amount, refund_method, items);
    }
  },

  // Save return to local Dexie DB for later syncing
  saveReturnOffline: async (
    sale_id: string,
    refund_amount: number,
    refund_method: string,
    items: PendingReturnItem[]
  ) => {
    const offlineId = crypto.randomUUID();
    const pendingReturn: PendingReturn = {
      offlineId,
      sale_id,
      refund_amount,
      refund_method,
      items,
      synced: 0,
      created_at: new Date().toISOString(),
    };
    
    await db.pending_returns.add(pendingReturn);
    return { message: 'Return saved offline successfully', offlineId };
  },

  // Fetch returns history
  getReturnsHistory: async (params?: { reason?: string, start_date?: string, end_date?: string }) => {
    try {
      const response = await api.get('/returns', { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching returns history:', error);
      throw error;
    }
  },
  
  // Fetch details for a specific return
  getReturnDetails: async (id: string) => {
    try {
      const response = await api.get(`/returns/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching return details for ${id}:`, error);
      throw error;
    }
  }
};
