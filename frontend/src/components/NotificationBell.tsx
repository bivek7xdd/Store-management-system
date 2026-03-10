import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, X, AlertTriangle, CreditCard, Package, Info, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification } from '@/services/notifications';
import { cn } from '@/lib/utils';

const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead, dismiss } = useNotifications();

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'debt_due':
                return <CreditCard className="h-4 w-4 text-red-500" />;
            case 'low_stock':
                return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'expiring_product':
                return <Package className="h-4 w-4 text-orange-500" />;
            default:
                return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const getNotificationLink = (notification: Notification) => {
        if (notification.reference_type === 'debt') {
            return '/debtors';
        }
        if (notification.reference_type === 'product') {
            return '/inventory';
        }
        return '#';
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (notification.status === 'unread') {
            await markAsRead(notification.id);
        }
        setOpen(false);
    };

    const handleDismiss = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        await dismiss(id);
    };

    const visibleNotifications = notifications.filter(n => n.status !== 'dismissed').slice(0, 10);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 rounded-full hover:bg-slate-100"
                >
                    <Bell className="h-5 w-5 text-slate-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h4 className="font-semibold text-slate-900">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-teal-600 hover:text-teal-700"
                            onClick={markAllAsRead}
                        >
                            <CheckCheck className="mr-1 h-3 w-3" />
                            Mark all read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                        </div>
                    ) : visibleNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                            <Bell className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {visibleNotifications.map((notification) => (
                                <Link
                                    key={notification.id}
                                    to={getNotificationLink(notification)}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={cn(
                                        "flex items-start gap-3 p-3 hover:bg-slate-50 transition-colors cursor-pointer",
                                        notification.status === 'unread' && "bg-teal-50/50"
                                    )}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-sm",
                                            notification.status === 'unread' ? "font-medium text-slate-900" : "text-slate-700"
                                        )}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            {formatTimeAgo(notification.created_at)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => handleDismiss(e, notification.id)}
                                        className="flex-shrink-0 p-1 rounded hover:bg-slate-200 transition-colors"
                                    >
                                        <X className="h-3 w-3 text-slate-400" />
                                    </button>
                                </Link>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {notifications.length > 0 && (
                    <div className="border-t p-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-slate-600 hover:text-teal-600"
                            asChild
                        >
                            <Link to="/notifications" onClick={() => setOpen(false)}>
                                View all notifications
                            </Link>
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};

export default NotificationBell;
