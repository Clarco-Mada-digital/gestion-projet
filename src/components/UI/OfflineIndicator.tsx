import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Database, Cloud, CloudOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';
import { Button } from './Button';
import { Card } from './Card';

export function OfflineIndicator() {
  const { isOnline, isOfflineMode, pendingSyncCount, forceSync, getSyncStatus } = useOffline();
  const [showDetails, setShowDetails] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const syncStatus = getSyncStatus();

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await forceSync();
    } finally {
      setIsSyncing(false);
    }
  };

  // Indicateur compact (dans la barre de navigation)
  const CompactIndicator = () => (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800">
      {isOnline ? (
        <>
          <Wifi className={`w-3 h-3 ${syncStatus.color.replace('text-', 'text-')}`} />
          <span className={syncStatus.color}>{syncStatus.message}</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 text-red-500" />
          <span className="text-red-500">Hors-ligne</span>
        </>
      )}
      {pendingSyncCount > 0 && (
        <span className="bg-yellow-500 text-white px-1.5 py-0.5 rounded-full text-xs">
          {pendingSyncCount}
        </span>
      )}
    </div>
  );

  // Indicateur détaillé (panneau déroulant)
  const DetailedIndicator = () => (
    <Card className="absolute top-full right-0 mt-2 w-80 shadow-lg z-50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Statut de connexion
          </h3>
          <button
            onClick={() => setShowDetails(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        {/* Statut principal */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 mb-4">
          {isOnline ? (
            <Cloud className="w-5 h-5 text-green-500" />
          ) : (
            <CloudOff className="w-5 h-5 text-red-500" />
          )}
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-white">
              {isOnline ? 'Connecté' : 'Hors-ligne'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isOnline ? 'Synchronisation automatique activée' : 'Mode hors-ligne activé'}
            </p>
          </div>
        </div>

        {/* Synchronisation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Synchronisation
              </span>
            </div>
            <div className="flex items-center gap-2">
              {syncStatus.status === 'synced' && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              {syncStatus.status === 'pending' && (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <span className={`text-sm font-medium ${syncStatus.color}`}>
                {syncStatus.message}
              </span>
            </div>
          </div>

          {pendingSyncCount > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Modifications en attente
                </span>
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                {pendingSyncCount} modification(s) seront synchronisées lorsque vous serez connecté
              </p>
              {isOnline && (
                <Button
                  onClick={handleForceSync}
                  disabled={isSyncing}
                  size="sm"
                  className="w-full"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Synchronisation...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Synchroniser maintenant
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {!isOnline && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <WifiOff className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-800 dark:text-red-200">
                  Mode hors-ligne
                </span>
              </div>
              <p className="text-xs text-red-700 dark:text-red-300">
                Vous pouvez continuer à utiliser l'application. Vos modifications seront synchronisées automatiquement lorsque la connexion sera rétablie.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <CompactIndicator />
      </button>

      {showDetails && (
        <DetailedIndicator />
      )}
    </div>
  );
}

// Indicateur simple pour la barre d'état
export function SimpleOfflineIndicator() {
  const { isOnline, pendingSyncCount, getSyncStatus } = useOffline();
  const syncStatus = getSyncStatus();

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <div className="flex items-center gap-1">
          <Wifi className={`w-4 h-4 ${syncStatus.color.replace('text-', 'text-')}`} />
          <span className={`text-xs ${syncStatus.color}`}>
            {syncStatus.message}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <WifiOff className="w-4 h-4 text-red-500" />
          <span className="text-xs text-red-500">Hors-ligne</span>
        </div>
      )}
      {pendingSyncCount > 0 && (
        <span className="bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs">
          {pendingSyncCount}
        </span>
      )}
    </div>
  );
}

// Badge de synchronisation pour les éléments individuels
export function SyncBadge({ synced, lastSync }: { synced: boolean; lastSync?: string }) {
  if (synced) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle className="w-3 h-3" />
        <span className="text-xs">Synchronisé</span>
      </div>
    );
  }

  if (lastSync) {
    const syncDate = new Date(lastSync);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60));
    
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <Cloud className="w-3 h-3" />
        <span className="text-xs">Sync: {diffMinutes}min</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-gray-400">
      <CloudOff className="w-3 h-3" />
      <span className="text-xs">Hors-ligne</span>
    </div>
  );
}

export default OfflineIndicator;
