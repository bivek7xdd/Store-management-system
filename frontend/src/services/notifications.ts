import api from './api';

export interface Notification {
    id: string;
    store_id: string;
    type: 'debt_due' | 'low_stock' | 'expiring_product' | 'system';
    title: string;
    message: string;
    reference_id: string | null;
    reference_type: string | null;
    status: 'unread' | 'read' | 'dismissed';
    created_at: string;
    updated_at: string;
}

export interface UnreadCount {
    count: number;
}

export const notificationService = {
    getNotifications: async () => {
        const response = await api.get<{ data: Notification[], message: string }>('/notifications');
        return response.data.data || [];
    },

    getUnreadCount: async () => {
        const response = await api.get<{ data: UnreadCount, message: string }>('/notifications/unread-count');
        return response.data.data.count || 0;
    },

    markAsRead: async (id: string) => {
        const response = await api.put<{ data: Notification, message: string }>(`/notifications/${id}/read`);
        return response.data.data;
    },

    markAllAsRead: async () => {
        await api.put('/notifications/mark-all-read');
    },

    dismiss: async (id: string) => {
        const response = await api.put<{ data: Notification, message: string }>(`/notifications/${id}/dismiss`);
        return response.data.data;
    },

    delete: async (id: string) => {
        await api.delete(`/notifications/${id}`);
    },
};
