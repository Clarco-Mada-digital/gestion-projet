import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { ExportableData } from '../../context/AppContext';

export function DataManagement() {
  const { state, dispatch } = useApp();
  const [importStatus, setImportStatus] = useState<{
    type: 'idle' | 'success' | 'error' | 'loading';
    message: string;
  }>({ type: 'idle', message: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            <div className={`mt-4 p-3 rounded-md ${
              importStatus.type === 'success' ? 'bg-green-100 text-green-800' :
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
