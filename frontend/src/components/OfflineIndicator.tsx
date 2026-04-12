import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingSales: number;
  pendingProducts?: number;
  pendingCategories?: number;
  pendingSuppliers?: number;
  isSyncing: boolean;
  syncError?: string | null;
  lastSyncTime?: Date | null;
  className?: string;
}

export function OfflineIndicator({
  isOnline,
  pendingSales,
  pendingProducts = 0,
  pendingCategories = 0,
  pendingSuppliers = 0,
  isSyncing,
  syncError,
  lastSyncTime,
  className
}: OfflineIndicatorProps) {
  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusIcon = () => {
    if (isSyncing) return <Loader2 className="h-3 w-3 animate-spin" />;
    if (syncError) return <AlertCircle className="h-3 w-3" />;
    if (isOnline) return <Wifi className="h-3 w-3" />;
    return <WifiOff className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (isSyncing) return 'Syncing...';
    if (syncError) return 'Sync failed';
    if (isOnline) return 'Online';
    return 'Offline';
  };

  const getStatusVariant = () => {
    if (isSyncing) return 'secondary';
    if (syncError) return 'destructive';
    if (isOnline) return 'default';
    return 'outline';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Connection Status Badge */}
      <Badge 
        variant={getStatusVariant()}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1',
          !isOnline && 'border-orange-200 bg-orange-50 text-orange-700',
          isOnline && !isSyncing && !syncError && 'border-green-200 bg-green-50 text-green-700'
        )}
      >
        {getStatusIcon()}
        <span className="text-xs font-medium">{getStatusText()}</span>
      </Badge>

      {/* Pending Items Counter */}
      {(pendingSales > 0 || pendingProducts > 0 || pendingCategories > 0 || pendingSuppliers > 0) && (
        <Badge 
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 border-blue-200"
        >
          <span className="text-xs font-medium">
            {pendingSales} sale{pendingSales !== 1 ? 's' : ''}
            {pendingProducts > 0 && `, ${pendingProducts} product${pendingProducts !== 1 ? 's' : ''}`}
            {pendingCategories > 0 && `, ${pendingCategories} categor${pendingCategories !== 1 ? 'ies' : 'y'}`}
            {pendingSuppliers > 0 && `, ${pendingSuppliers} supplier${pendingSuppliers !== 1 ? 's' : ''}`}
          </span>
        </Badge>
      )}

      {/* Sync Status Details */}
      {(lastSyncTime || syncError) && (
        <div className="hidden sm:flex items-center text-xs text-muted-foreground">
          {syncError ? (
            <span className="text-red-600">Error: {syncError}</span>
          ) : (
            <span>Last sync: {formatLastSync(lastSyncTime)}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default OfflineIndicator;