import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { ExportableData } from '../../context/AppContext';
import { firebaseService } from '../../services/collaboration/firebaseService';
import { User as FirebaseUser } from 'firebase/auth';

export function DataManagement() {
  const { state, dispatch } = useApp();
  const [importStatus, setImportStatus] = useState<{
    type: 'idle' | 'success' | 'error' | 'loading';
    message: string;
  }>({ type: 'idle', message: '' });

  const [cloudUser, setCloudUser] = useState<FirebaseUser | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Surveiller l'état de connexion
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthStateChange((user) => {
      setCloudUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await firebaseService.login();
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setImportStatus({ type: 'error', message: "Impossible de se connecter au service Cloud" });
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseService.logout();
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  };

  // Exporter les données
  const handleExport = () => {
    try {
      const dataToExport: ExportableData = {
        projects: state.projects,
        users: state.users,
        theme: state.theme,
        emailSettings: state.emailSettings,
        appSettings: state.appSettings,
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `gestion-projet-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setImportStatus({
        type: 'success',
        message: 'Données exportées avec succès!',
      });
    } catch (error) {
      console.error('Erreur lors de l\'exportation des données:', error);
      setImportStatus({
        type: 'error',
        message: 'Erreur lors de l\'exportation des données',
      });
    } finally {
      setTimeout(() => setImportStatus({ type: 'idle', message: '' }), 5000);
    }
  };

  // Importer des données
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus({ type: 'loading', message: 'Importation en cours...' });

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as ExportableData;

        // Valider les données importées
        if (!data.projects || !data.users) {
          throw new Error('Format de fichier invalide');
        }

        // Mettre à jour l'état avec les données importées
        dispatch({ type: 'IMPORT_DATA', payload: data });

        // Sauvegarder dans le localStorage
        localStorage.setItem('appState', JSON.stringify({
          ...state,
          projects: data.projects,
          users: data.users,
          theme: data.theme || state.theme,
          emailSettings: data.emailSettings || state.emailSettings,
          appSettings: data.appSettings || state.appSettings,
        }));

        setImportStatus({
          type: 'success',
          message: 'Données importées avec succès!',
        });
      } catch (error) {
        console.error('Erreur lors de l\'importation des données:', error);
        setImportStatus({
          type: 'error',
          message: 'Erreur: Fichier invalide ou corrompu',
        });
      } finally {
        // Réinitialiser l'input file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        setTimeout(() => setImportStatus({ type: 'idle', message: '' }), 5000);
      }
    };

    reader.onerror = () => {
      setImportStatus({
        type: 'error',
        message: 'Erreur lors de la lecture du fichier',
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => setImportStatus({ type: 'idle', message: '' }), 5000);
    };

    reader.readAsText(file);
  };

  // Réinitialiser les données
  const handleReset = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible.')) {
      localStorage.removeItem('appState');
      window.location.reload();
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Gestion des données</h2>

      <div className="space-y-6">
        {/* Section Cloud Sync */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-medium mb-3">Collaboration Cloud & Synchronisation</h3>
          <p className="text-sm text-gray-500 mb-4">
            Par défaut, vos données sont stockées <strong>uniquement sur votre appareil</strong> (Local Storage) pour une confidentialité totale.
            Connectez-vous pour pouvoir <strong>partager sélectivement</strong> certains projets dans le Cloud et collaborer en temps réel avec votre équipe.
          </p>

          {!firebaseService.isReady() ? (
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
              <p className="text-sm text-yellow-800 font-medium">Configuration requise</p>
              <p className="text-xs text-yellow-700 mt-1">
                Veuillez configurer les clés Firebase dans <code>src/lib/firebaseConfig.ts</code> pour activer cette fonctionnalité.
              </p>
            </div>
          ) : cloudUser ? (
            <div className="bg-blue-50 border border-blue-100 rounded-md p-4 flex items-center justify-between">
              <div className="flex items-center">
                {cloudUser.photoURL ? (
                  <img src={cloudUser.photoURL} alt="Avatar" className="w-10 h-10 rounded-full mr-3 border-2 border-white shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center mr-3 text-blue-700 font-bold">
                    {cloudUser.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-blue-900">Connecté en tant que</p>
                  <p className="text-sm text-blue-700">{cloudUser.displayName || cloudUser.email}</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                Déconnexion
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleLogin}
              className="bg-white border text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Se connecter avec Google
            </Button>
          )}
        </div>

        <div className="border-b pb-4">
          <h3 className="text-lg font-medium mb-3">Sauvegarde et restauration</h3>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Exporter les données
            </Button>

            <div className="relative">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              >
                Importer des données
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={handleReset}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Réinitialiser toutes les données
            </Button>
            <p className="text-sm text-gray-500 mt-1">
              Attention : Cette action supprimera toutes les données de l'application.
            </p>
          </div>

          {importStatus.type !== 'idle' && (
            <div className={`mt-4 p-3 rounded-md ${importStatus.type === 'success' ? 'bg-green-100 text-green-800' :
              importStatus.type === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
              {importStatus.message}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Instructions</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>Exportez vos données pour les sauvegarder sur votre ordinateur.</li>
            <li>Importez des données précédemment exportées pour les restaurer.</li>
            <li>Utilisez ces fonctionnalités pour transférer vos données vers un autre appareil.</li>
            <li>Le format des fichiers est JSON et peut être lu avec un éditeur de texte.</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
