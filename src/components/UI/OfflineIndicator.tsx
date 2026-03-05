import React, { useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';

export function OfflineIndicator() {
  const { isOnline } = useOffline();
  const [showDetails, setShowDetails] = useState(false);

  // Indicateur compact (dans la barre de navigation)
  const CompactIndicator = () => (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800">
      {isOnline ? (
        <>
          <Wifi className="w-3 h-3 text-green-500" />
          <span className="text-green-500">En ligne</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 text-red-500" />
          <span className="text-red-500">Hors-ligne</span>
        </>
      )}
    </div>
  );

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <CompactIndicator />
      </button>
    </div>
  );
}

export default OfflineIndicator;
