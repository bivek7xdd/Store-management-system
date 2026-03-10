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
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, status: 'read' as const } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, status: 'read' as const }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }, []);

    const dismiss = useCallback(async (id: string) => {
        try {
            await notificationService.dismiss(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, status: 'dismissed' as const } : n)
            );
            // Update unread count if the notification was unread
            const notification = notifications.find(n => n.id === id);
            if (notification && notification.status === 'unread') {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to dismiss notification:', error);
        }
    }, [notifications]);

    // Fetch unread count on mount and periodically
    useEffect(() => {
        fetchUnreadCount();
        fetchNotifications();

        // Poll for new notifications every 60 seconds
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 60000);

        return () => clearInterval(interval);
    }, [fetchUnreadCount, fetchNotifications]);

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
