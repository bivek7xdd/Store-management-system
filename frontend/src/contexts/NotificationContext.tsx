import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService, Notification } from '@/services/notifications';
import { db } from '@/db/db';
import { useLiveQuery } from 'dexie-react-hooks';

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
    const [loading, setLoading] = useState(false);

    // Live query for notifications from Dexie
    const notifications = useLiveQuery(
        async () => {
            return await db.notifications
                .orderBy('created_at')
                .reverse()
                .toArray();
        },
        []
    ) || [];

    // Derive unread count from live query
    const unreadCount = notifications.filter(n => n.status === 'unread').length;

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const data = await notificationService.getNotifications();
            if (data.length > 0) {
                // Sync API data to Dexie
                await Promise.all(data.map(async (n) => {
                    // If we have a local version (matched by reference_id and type), 
                    // delete the local one before putting the backend one
                    if (n.reference_id) {
                        await db.notifications
                            .where('reference_id').equals(n.reference_id)
                            .filter(local => local.type === n.type && local.id.startsWith('local-'))
                            .delete();
                    }
                    return db.notifications.put(n);
                }));
            }
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
            // In an offline-first app, we'd rely on the main fetch to populate Dexie
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        try {
            // Update UI/Local DB first
            await db.notifications.update(id, { status: 'read', updated_at: new Date().toISOString() });

            // Sync with backend if online
            if (navigator.onLine) {
                await notificationService.markAsRead(id);
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            const unreadIds = notifications.filter(n => n.status === 'unread').map(n => n.id);
            if (unreadIds.length === 0) return;

            await db.notifications.where('id').anyOf(unreadIds).modify({
                status: 'read',
                updated_at: new Date().toISOString()
            });

            if (navigator.onLine) {
                await notificationService.markAllAsRead();
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }, [notifications]);

    const dismiss = useCallback(async (id: string) => {
        try {
            await db.notifications.update(id, { status: 'dismissed', updated_at: new Date().toISOString() });

            if (navigator.onLine) {
                await notificationService.dismiss(id);
            }
        } catch (error) {
            console.error('Failed to dismiss notification:', error);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchNotifications();

        // Poll for new notifications every 60 seconds
        const interval = setInterval(() => {
            if (navigator.onLine) {
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
