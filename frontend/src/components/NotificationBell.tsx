import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, AlertTriangle, CreditCard, Package, Info, CheckCheck, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification } from '@/services/notifications';
import { cn } from '@/lib/utils';

const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead, dismiss } = useNotifications();

    const getNotificationConfig = (type: Notification['type']) => {
        switch (type) {
            case 'debt_due':
                return { icon: CreditCard, color: 'text-[#DA291C]', bg: 'bg-[#DA291C]/10', dot: 'bg-[#DA291C]' };
            case 'low_stock':
                return { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-900/20', dot: 'bg-amber-400' };
            case 'expiring_product':
                return { icon: Package, color: 'text-orange-400', bg: 'bg-orange-900/20', dot: 'bg-orange-400' };
            default:
                return { icon: Info, color: 'text-blue-400', bg: 'bg-blue-900/20', dot: 'bg-blue-400' };
        }
    };

    const getNotificationLink = (notification: Notification) => {
        if (notification.reference_type === 'debt') return '/debtors';
        if (notification.reference_type === 'product') return '/inventory';
        return '#';
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (notification.status === 'unread') await markAsRead(notification.id);
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
                <button className="relative h-8 w-8 rounded-[2px] flex items-center justify-center text-[#555555] hover:text-white hover:bg-[#1A1A1A] transition-colors">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-[2px] bg-[#DA291C] text-[9px] font-bold text-white leading-none">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>

            <PopoverContent
                className="w-[320px] p-0 bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2px] shadow-2xl shadow-black/50"
                align="end"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A]">
                    <div className="flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5 text-[#DA291C]" />
                        <h4 className="text-[12px] font-normal text-[#AAAAAA] uppercase tracking-[1px]">Notifications</h4>
                        {unreadCount > 0 && (
                            <span className="text-[10px] bg-[#DA291C] text-white px-1.5 py-0.5 rounded-[2px] font-medium">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-1 text-[11px] text-[#888888] hover:text-white transition-colors uppercase tracking-[0.8px]"
                        >
                            <CheckCheck className="w-3 h-3" />
                            Mark all read
                        </button>
                    )}
                </div>

                {/* List */}
                <ScrollArea className="h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#DA291C] border-t-transparent" />
                        </div>
                    ) : visibleNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-[#555555]">
                            <Bell className="h-8 w-8 mb-3 opacity-30" />
                            <p className="text-[12px] uppercase tracking-[1px]">No notifications</p>
                        </div>
                    ) : (
                        <div>
                            {visibleNotifications.map((notification, i) => {
                                const config = getNotificationConfig(notification.type);
                                const IconComp = config.icon;
                                const isUnread = notification.status === 'unread';
                                return (
                                    <Link
                                        key={notification.id}
                                        to={getNotificationLink(notification)}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={cn(
                                            "flex items-start gap-3 px-4 py-3 border-b border-[#111111] transition-colors group",
                                            isUnread ? "bg-[#111111] hover:bg-[#181818]" : "hover:bg-[#0F0F0F]"
                                        )}
                                    >
                                        {/* Icon */}
                                        <div className={`shrink-0 w-7 h-7 rounded-[2px] flex items-center justify-center mt-0.5 ${config.bg}`}>
                                            <IconComp className={`w-3.5 h-3.5 ${config.color}`} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className={cn(
                                                    "text-[13px] leading-snug truncate",
                                                    isUnread ? "text-white font-medium" : "text-[#CCCCCC]"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                {isUnread && (
                                                    <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${config.dot}`} />
                                                )}
                                            </div>
                                            <p className="text-[11px] text-[#888888] line-clamp-2 leading-relaxed">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-[#666666] mt-1 uppercase tracking-[0.5px]">
                                                {formatTimeAgo(notification.created_at)}
                                            </p>
                                        </div>

                                        {/* Dismiss */}
                                        <button
                                            onClick={(e) => handleDismiss(e, notification.id)}
                                            className="shrink-0 p-1 rounded-[2px] text-[#333333] hover:text-white hover:bg-[#303030] transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="border-t border-[#1A1A1A] px-4 py-2.5">
                        <Link
                            to="/notifications"
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-center gap-2 text-[11px] text-[#888888] hover:text-white uppercase tracking-[1px] transition-colors"
                        >
                            View all notifications
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};

export default NotificationBell;
