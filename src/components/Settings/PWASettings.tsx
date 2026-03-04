import React, { useState, useEffect } from 'react';
import { Download, Upload, Trash2, RefreshCw, Database, Wifi, WifiOff, Smartphone, Monitor, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';

export function PWASettings() {
  const { 
    isOnline, 
    isOfflineMode, 
    offlineStats, 
    lastSyncTime, 
    pendingSyncCount,
    exportOfflineData, 
    importOfflineData, 
    clearOfflineData, 
    forceSync,
    loadOfflineData 
  } = useOffline();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Vérifier si l'application est installée comme PWA
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Vérifier si l'application est lancée comme PWA
    setIsPWAInstalled(window.matchMedia('(display-mode: standalone)').matches);

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Installer la PWA
  const installPWA = async () => {
    if (!deferredPrompt) {
      alert('L\'installation n\'est pas disponible');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsPWAInstalled(true);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Erreur lors de l\'installation PWA:', error);
    }
  };

  // Exporter les données
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportOfflineData();
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Importer des données
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const success = await importOfflineData(file);
      setImportStatus(success ? 'Importation réussie!' : 'Erreur lors de l\'importation');
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      setImportStatus('Erreur lors de l\'importation');
    } finally {
      setIsImporting(false);
    }
  };

  // Vider les données locales
  const handleClear = async () => {
    if (!confirm('Êtes-vous sûr de vouloir effacer toutes les données locales? Cette action est irréversible.')) {
      return;
    }

    setIsClearing(true);
    try {
      await clearOfflineData();
    } catch (error) {
      console.error('Erreur lors de l\'effacement:', error);
    } finally {
      setIsClearing(false);
    }
  };

  // Forcer la synchronisation
  const handleSync = async () => {
    if (!isOnline) {
      alert('Vous devez être connecté pour synchroniser les données');
      return;
    }

    setIsSyncing(true);
    try {
      await forceSync();
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Formater la date de dernière synchronisation
  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return 'Jamais';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Statut PWA */}
      <Card className="p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Application Progressive (PWA)
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isPWAInstalled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                {isPWAInstalled ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {isPWAInstalled ? 'Application installée' : 'Installation disponible'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isPWAInstalled 
                    ? 'L\'application est installée et fonctionne hors-ligne' 
                    : 'Installez l\'application pour un accès rapide et hors-ligne'
                  }
                </p>
              </div>
            </div>
            
            {!isPWAInstalled && deferredPrompt && (
              <Button onClick={installPWA}>
                <Download className="w-4 h-4 mr-2" />
                Installer
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p>
              💡 L'installation comme PWA vous permet d'utiliser l'application sans navigateur, 
              avec un accès rapide depuis votre écran d'accueil et un fonctionnement hors-ligne amélioré.
            </p>
          </div>
        </div>
      </Card>

      {/* Statut de connexion */}
      <Card className="p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          Connexion et synchronisation
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isOnline ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {isOnline ? 'Connecté' : 'Hors-ligne'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isOnline 
                    ? 'La synchronisation automatique est activée' 
                    : 'Mode hors-ligne - les modifications seront synchronisées plus tard'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {offlineStats.projectsCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Projets locaux
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {offlineStats.tasksCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Tâches locales
              </div>
            </div>
          </div>

          {pendingSyncCount > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {pendingSyncCount} modification(s) en attente
                </span>
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                Ces modifications seront synchronisées lorsque vous serez connecté
              </p>
              {isOnline && (
                <Button 
                  onClick={handleSync} 
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

          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Dernière synchronisation:</span>
            </div>
            <span className="font-medium">{formatLastSync(lastSyncTime)}</span>
          </div>
        </div>
      </Card>

      {/* Gestion des données */}
      <Card className="p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Gestion des données locales
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              variant="outline"
              className="w-full"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Exportation...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter les données
                </>
              )}
            </Button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isImporting}
              />
              <Button 
                disabled={isImporting}
                variant="outline"
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Importation...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importer des données
                  </>
                )}
              </Button>
            </div>
          </div>

          {importStatus && (
            <div className={`p-3 rounded-lg text-sm ${
              importStatus.includes('réussie') 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}>
              {importStatus}
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button 
              onClick={handleClear} 
              disabled={isClearing}
              variant="destructive"
              className="w-full"
            >
              {isClearing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Effacement...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Effacer toutes les données locales
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              ⚠️ Cette action supprimera toutes les données locales et ne peut être annulée.
            </p>
          </div>
        </div>
      </Card>

      {/* Informations hors-ligne */}
      <Card className="p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Fonctionnalités hors-ligne
        </h3>
        
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Création et modification</p>
              <p>Créez et modifiez des projets et tâches sans connexion</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Synchronisation automatique</p>
              <p>Vos modifications sont synchronisées dès que la connexion revient</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Accès rapide</p>
              <p>L'application installée fonctionne comme une application native</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Limitations</p>
              <p>Les fonctionnalités cloud (partage, synchronisation Google) nécessitent une connexion</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default PWASettings;
