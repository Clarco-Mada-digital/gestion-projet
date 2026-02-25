import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { TrelloImportService } from '../../services/import/trelloImportService';
import { useApp } from '../../context/AppContext';
import { Project } from '../../types';
import { message } from 'antd';

interface TrelloImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (project: Project) => void;
  currentUserId?: string; // Ajout du paramètre
}

export function TrelloImportModal({ isOpen, onClose, onImportSuccess, currentUserId }: TrelloImportModalProps) {
  const { state, dispatch } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!TrelloImportService.validateTrelloFile(selectedFile)) {
        setError('Veuillez sélectionner un fichier JSON valide');
        return;
      }
      setFile(selectedFile);
      setError(null);
      
      // Prévisualisation rapide
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          setPreview({
            name: data.name,
            desc: data.desc,
            listsCount: data.lists?.length || 0,
            cardsCount: data.cards?.length || 0,
            membersCount: data.members?.length || 0
          });
        } catch (err) {
          setError('Fichier JSON invalide');
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setError(null);

    try {
      // Utiliser le currentUserId passé en paramètre
      const userId = currentUserId || 'import-user';
      
      const project = await TrelloImportService.importFromFile(file, userId);
      
      // Vérifier si le projet existe déjà
      const existingProject = state.projects.find((p: Project) => p.id === project.id);
      
      if (existingProject) {
        // Demander à l'utilisateur quoi faire
        const action = window.confirm(
          `Le projet "${project.name}" existe déjà.\n\n` +
          `Cliquez sur "OK" pour le remplacer (toutes les modifications locales seront perdues).\n` +
          `Cliquez sur "Annuler" pour conserver le projet existant.`
        );
        
        if (!action) {
          setIsImporting(false);
          return; // Annuler l'importation
        }
        
        // Remplacer le projet existant
        dispatch({
          type: 'UPDATE_PROJECT',
          payload: project
        });
        
        message.success(`Projet "${project.name}" mis à jour avec succès !`);
      } else {
        // Ajouter le nouveau projet
        dispatch({
          type: 'ADD_PROJECT',
          payload: project
        });

        onImportSuccess(project);
        message.success(`Projet "${project.name}" importé avec succès !`);
      }

      onClose();
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'importation');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Importer un projet Trello
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Zone de dépôt de fichier */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="trello-file-input"
            />
            <label
              htmlFor="trello-file-input"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <Upload className="w-12 h-12 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Cliquez pour sélectionner votre fichier d'export Trello
              </span>
              <span className="text-xs text-gray-500">
                Format JSON uniquement
              </span>
            </label>
          </div>

          {/* Prévisualisation */}
          {preview && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Aperçu du projet
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Nom:</span>
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {preview.name}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Listes:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {preview.listsCount}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Tâches:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {preview.cardsCount}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Membres:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {preview.membersCount}
                  </p>
                </div>
              </div>
              {preview.desc && (
                <div className="col-span-2">
                  <span className="text-gray-600 dark:text-gray-400">Description:</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {preview.desc}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-100">
                  Erreur
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleImport}
              disabled={!file || isImporting}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importation...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Importer le projet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
