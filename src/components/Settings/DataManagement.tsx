import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { ExportableData } from '../../context/AppContext';
import { firebaseService } from '../../services/collaboration/firebaseService';
import { User as FirebaseUser } from 'firebase/auth';
import { FileJson, Table as TableIcon, FileText, Upload, Database, ShieldAlert } from 'lucide-react';

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

  // Exporter les données en JSON
  const handleExportJSON = () => {
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
        message: 'Données JSON exportées avec succès!',
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

  // Exporter les données en CSV
  const handleExportCSV = () => {
    try {
      const userMap = new Map(state.users.map(u => [u.id, u.name]));
      
      const headers = [
        'Projet', 'Tâche', 'Statut', 'Priorité', 'Date début', 'Date échéance', 
        'Assignés', 'Tags', 'Sous-tâches (Total)', 'Sous-tâches (Faites)', 
        'Notes', 'Heures estimées', 'Créé le', 'Mis à jour le'
      ];

      const rows = state.projects.flatMap(project => 
        project.tasks.map(task => [
          project.name,
          task.title,
          task.status,
          task.priority,
          task.startDate || '',
          task.dueDate || '',
          task.assignees.map(id => userMap.get(id) || id).join('; '),
          task.tags.join('; '),
          task.subTasks.length,
          task.subTasks.filter(st => st.completed).length,
          (task.notes || task.description || '').replace(/\n/g, ' '),
          task.estimatedHours || 0,
          task.createdAt,
          task.updatedAt
        ])
      );

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `gestion-projet-tasks-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setImportStatus({
        type: 'success',
        message: 'Données CSV exportées avec succès!',
      });
    } catch (error) {
      console.error('Erreur lors de l\'exportation CSV:', error);
      setImportStatus({ type: 'error', message: 'Erreur lors de l\'exportation CSV' });
    } finally {
      setTimeout(() => setImportStatus({ type: 'idle', message: '' }), 5000);
    }
  };

  // Exporter les données en Markdown
  const handleExportMarkdown = () => {
    try {
      const userMap = new Map(state.users.map(u => [u.id, u.name]));
      let md = `# Exportation des Projets - ${new Date().toLocaleDateString('fr-FR')}\n\n`;

      state.projects.forEach(project => {
        md += `## Projets : ${project.name}\n`;
        md += `**Statut :** ${project.status}  \n`;
        md += `**Description :** ${project.description || 'Aucune description'}  \n\n`;

        if (project.tasks && project.tasks.length > 0) {
          md += `### Tâches\n\n`;
          project.tasks.forEach(task => {
            md += `#### ${task.title} [${task.status}]\n`;
            md += `- **Priorité :** ${task.priority}\n`;
            md += `- **Échéance :** ${task.dueDate || 'Non définie'}\n`;
            md += `- **Assignés :** ${task.assignees.map(id => userMap.get(id) || id).join(', ') || 'Personne'}\n`;
            if (task.tags && task.tags.length > 0) md += `- **Tags :** ${task.tags.join(', ')}\n`;
            if (task.description) md += `- **Description :** ${task.description}\n`;
            
            if (task.subTasks && task.subTasks.length > 0) {
              md += `- **Sous-tâches :**\n`;
              task.subTasks.forEach(st => {
                md += `  - [${st.completed ? 'x' : ' '}] ${st.title}\n`;
              });
            }
            
            if (task.notes) md += `\n**Notes :**\n${task.notes}\n`;
            md += `\n---\n\n`;
          });
        } else {
          md += `*Aucune tâche dans ce projet.*\n\n---\n\n`;
        }
      });

      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `gestion-projet-export-${new Date().toISOString().split('T')[0]}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setImportStatus({
        type: 'success',
        message: 'Données Markdown exportées avec succès!',
      });
    } catch (error) {
      console.error('Erreur lors de l\'exportation Markdown:', error);
      setImportStatus({ type: 'error', message: 'Erreur lors de l\'exportation Markdown' });
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

        // Mettre à jour l'état avec les données chargées
        dispatch({ type: 'IMPORT_DATA', payload: data });

        // Sauvegarder dans le localStorage avec les clés attendues par AppContext
        const { projects, users, theme, emailSettings, appSettings } = data;

        localStorage.setItem('astroProjectManagerData', JSON.stringify({
          projects,
          users,
          theme,
          currentView: state.currentView
        }));

        if (emailSettings) {
          localStorage.setItem('astroProjectManagerEmailSettings', JSON.stringify(emailSettings));
        }

        if (appSettings) {
          localStorage.setItem('astroProjectManagerAppSettings', JSON.stringify(appSettings));
        }

        if (theme) {
          localStorage.setItem('astroProjectManagerTheme', theme);
        }

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
      localStorage.removeItem('astroProjectManagerData');
      localStorage.removeItem('astroProjectManagerAppSettings');
      localStorage.removeItem('astroProjectManagerEmailSettings');
      localStorage.removeItem('astroProjectManagerTheme');
      window.location.reload();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <Database className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Gestion des données
        </h2>
      </div>

      <div className="space-y-8">
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
            <div className="bg-blue-50 dark:bg-blue-900 border border-blue-100 dark:border-blue-800 rounded-md p-4 flex items-center justify-between">
              <div className="flex items-center">
                {cloudUser.photoURL ? (
                  <img src={cloudUser.photoURL} alt="Avatar" className="w-10 h-10 rounded-full mr-3 border-2 border-white shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-200 dark:bg-blue-700 flex items-center justify-center mr-3 text-blue-700 dark:text-blue-200 font-bold">
                    {cloudUser.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-200">Connecté en tant que</p>
                  <p className="text-sm text-blue-700 dark:text-blue-200">{cloudUser.displayName || cloudUser.email}</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-white dark:bg-gray-800 text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-700 hover:border-red-300 dark:hover:border-red-700"
              >
                Déconnexion
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleLogin}
              className="bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={handleExportJSON}
              className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white flex flex-col items-center justify-center py-5 h-auto transition-all hover:scale-105 shadow-lg group"
            >
              <FileJson className="w-8 h-8 mb-2 group-hover:rotate-6 transition-transform" />
              <span className="font-bold">JSON</span>
              <span className="text-[10px] opacity-80">Sauvegarde complète</span>
            </Button>

            <Button
              onClick={handleExportCSV}
              className="bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-800 text-white flex flex-col items-center justify-center py-5 h-auto transition-all hover:scale-105 shadow-lg group"
            >
              <TableIcon className="w-8 h-8 mb-2 group-hover:rotate-6 transition-transform" />
              <span className="font-bold">CSV</span>
              <span className="text-[10px] opacity-80">Excel / Tableur</span>
            </Button>

            <Button
              onClick={handleExportMarkdown}
              className="bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-800 text-white flex flex-col items-center justify-center py-5 h-auto transition-all hover:scale-105 shadow-lg group"
            >
              <FileText className="w-8 h-8 mb-2 group-hover:rotate-6 transition-transform" />
              <span className="font-bold">Markdown</span>
              <span className="text-[10px] opacity-80">Lisible (MD)</span>
            </Button>

            <div className="relative">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-800 text-white w-full h-full flex flex-col items-center justify-center py-5 transition-all hover:scale-105 shadow-lg group"
              >
                <Upload className="w-8 h-8 mb-2 group-hover:-translate-y-1 transition-transform" />
                <span className="font-bold">Importer</span>
                <span className="text-[10px] opacity-80">Restaurer JSON</span>
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

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-3 flex items-center">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Zone de danger
            </h4>
            <Button
              onClick={handleReset}
              variant="outline"
              className="text-red-600 border-red-600 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 px-6 py-2 transition-colors flex items-center"
            >
              <ShieldAlert className="w-4 h-4 mr-2" />
              Réinitialiser toutes les données
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Attention : Cette action supprimera définitivement toutes les tâches, projets et réglages de cet appareil.
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
            <li>Exportez en <strong>JSON</strong> pour créer une sauvegarde complète que vous pourrez réimporter plus tard.</li>
            <li>Exportez en <strong>CSV</strong> pour analyser vos tâches dans Excel, Google Sheets ou d'autres tableurs.</li>
            <li>Exportez en <strong>Markdown</strong> pour obtenir une version lisible et documentée de vos projets, idéale pour les rapports ou l'archivage.</li>
            <li>Importez des données au format JSON pour restaurer une sauvegarde précédente.</li>
            <li>Le format Markdown est structuré par projet, incluant les descriptions, priorités et l'état des sous-tâches.</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
