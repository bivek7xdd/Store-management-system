import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfflineFallback() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md mx-auto">
        <WifiOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          You're Offline
        </h1>
        <p className="text-gray-600 mb-6">
          It looks like you're not connected to the internet. The app is still available for offline use.
        </p>
        <Button 
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

export default OfflineFallback;