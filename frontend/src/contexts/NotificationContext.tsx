import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService, Notification } from '@/services/notifications';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    dismiss: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    // Derive unread count from state
    const unreadCount = notifications.filter(n => n.status === 'unread').length;

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const data = await notificationService.getNotifications();
            // Sort by created_at descending (newest first)
            const sortedData = [...data].sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setNotifications(sortedData);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            // we don't strictly need to store just count, but it ensures we're syncing
            await notificationService.getUnreadCount();
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        try {
            // Optimistic UI update
            setNotifications(prev => prev.map(n => 
                n.id === id ? { ...n, status: 'read', updated_at: new Date().toISOString() } : n
            ));

            await notificationService.markAsRead(id);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            // Revert state if necessary by refetching
            fetchNotifications();
        }
    }, [fetchNotifications]);

    const markAllAsRead = useCallback(async () => {
        try {
            const unreadIds = notifications.filter(n => n.status === 'unread').map(n => n.id);
            if (unreadIds.length === 0) return;

            // Optimistic UI update
            setNotifications(prev => prev.map(n => 
                n.status === 'unread' ? { ...n, status: 'read', updated_at: new Date().toISOString() } : n
            ));

            await notificationService.markAllAsRead();
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            fetchNotifications();
        }
    }, [notifications, fetchNotifications]);

    const dismiss = useCallback(async (id: string) => {
        try {
            // Optimistic UI update
            setNotifications(prev => prev.map(n => 
                n.id === id ? { ...n, status: 'dismissed', updated_at: new Date().toISOString() } : n
            ));

            await notificationService.dismiss(id);
        } catch (error) {
            console.error('Failed to dismiss notification:', error);
            fetchNotifications();
        }
    }, [fetchNotifications]);

    // Initial fetch — only if authenticated
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchNotifications();
        }

        // Poll for new notifications every 60 seconds — only if authenticated
        const interval = setInterval(() => {
            const currentToken = localStorage.getItem('token');
            if (navigator.onLine && currentToken) {
                fetchNotifications();
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        dismiss,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
