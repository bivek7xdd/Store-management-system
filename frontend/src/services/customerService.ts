import api from './api';
import { db } from '../db/db';
import { Customer } from '../types';
import { syncService } from './syncService';

export const customerService = {
  async listCustomers(): Promise<Customer[]> {
    const isOnline = syncService.getStatus().isOnline;
    if (isOnline) {
      try {
        const response = await api.get('/customers');
        const customers = response.data.data;
        // Update local cache
        await db.customers.bulkPut(customers);
        return customers;
      } catch (error) {
        console.error('Failed to fetch customers online, falling back to cache:', error);
      }
    }
    return await db.customers.toArray();
  },

  async searchCustomers(query: string): Promise<Customer[]> {
    const isOnline = syncService.getStatus().isOnline;
    if (isOnline) {
      try {
        const response = await api.get(`/customers/search?q=${query}`);
        return response.data.data;
      } catch (error) {
        console.error('Search online failed, falling back to cache:', error);
      }
    }
    return await db.customers
      .where('name')
      .startsWithIgnoreCase(query)
      .or('phone')
      .startsWith(query)
      .toArray();
  },

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    const isOnline = syncService.getStatus().isOnline;
    if (isOnline) {
      const response = await api.post('/customers', customer);
      const newCustomer = response.data.data;
      await db.customers.put(newCustomer);
      return newCustomer;
    } else {
      const newCustomer: Customer = {
        id: crypto.randomUUID(),
        name: customer.name || '',
        phone: customer.phone || '',
        loyalty_status: 'regular',
        purchase_count: 0,
        loyalty_points: 0,
        store_id: '', // To be filled by sync or backend
        created_at: new Date().toISOString(),
        synced: 0,
      };
      await db.customers.put(newCustomer);
      return newCustomer;
    }
  },

  async getGuestCustomer(): Promise<Customer | undefined> {
    return await db.customers.where('name').equals('Guest').first();
  },

  isEligibleForLoyaltyDiscount: (purchaseCount: number) => {
    // Every 5th purchase gets a discount.
    // If they have 4 previous purchases, this 5th one qualifies.
    // count: 0, 1, 2, 3, 4(Disc), 5, 6, 7, 8, 9(Disc)...
    return (purchaseCount + 1) % 5 === 0;
  }
};
