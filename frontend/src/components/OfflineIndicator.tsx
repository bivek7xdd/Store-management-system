import React from 'react';
import { cn } from '@/lib/utils';
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
    if (diffMins < 60) return `${diffMins}M ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}H ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}D ago`;
  };

  const getStatusIcon = () => {
    if (isSyncing) return <Loader2 className="h-3 w-3 animate-spin" />;
    if (syncError) return <AlertCircle className="h-3 w-3" />;
    if (isOnline) return <Wifi className="h-3 w-3" />;
    return <WifiOff className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (isSyncing) return 'Syncing';
    if (syncError) return 'Sync Error';
    if (isOnline) return 'Online';
    return 'Offline';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Connection Status Badge */}
      <div 
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border transition-colors',
          !isOnline && 'border-[#F13A2C]/30 bg-[#F13A2C]/10 text-[#F13A2C]',
          isOnline && !isSyncing && !syncError && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
          isSyncing && 'border-blue-500/30 bg-blue-500/10 text-blue-400',
          syncError && 'border-[#F13A2C] bg-[#F13A2C]/20 text-[#F13A2C]'
        )}
      >
        {getStatusIcon()}
        <span className="text-[10px] font-bold uppercase tracking-[1px]">{getStatusText()}</span>
      </div>

      {/* Pending Items Counter */}
      {(pendingSales > 0 || pendingProducts > 0 || pendingCategories > 0 || pendingSuppliers > 0) && (
        <div 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border border-[#303030] bg-[#111111] text-[#CCCCCC]"
        >
          <span className="text-[10px] font-bold uppercase tracking-[1px]">
            {pendingSales > 0 && `${pendingSales} Sale${pendingSales !== 1 ? 's' : ''}`}
            {pendingProducts > 0 && ` • ${pendingProducts} Product${pendingProducts !== 1 ? 's' : ''}`}
          </span>
        </div>
      )}

      {/* Sync Status Details */}
      {(lastSyncTime || syncError) && (
        <div className="hidden sm:flex items-center text-[10px] font-medium uppercase tracking-[0.5px] text-[#888888]">
          {syncError ? (
            <span className="text-[#F13A2C]">Error Encountered</span>
          ) : (
            <span>Synced: {formatLastSync(lastSyncTime)}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default OfflineIndicator;