import React, { useState } from 'react';
import { Download, Trash2, Eye, FileText, Image, Music, Video, File, Calendar, User } from 'lucide-react';
import { UploadedFile, cloudinaryService } from '../../services/collaboration/cloudinaryService';

interface FileListProps {
  files: UploadedFile[];
  onFileDelete?: (file: UploadedFile) => void;
  showProjectInfo?: boolean;
  className?: string;
}

export function FileList({ files, onFileDelete, showProjectInfo = false, className = '' }: FileListProps) {
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (file: UploadedFile) => {
    const size = 20;
    // Vérification du type (Cloudinary catégorise souvent par extension ou type MIME)
    const category = cloudinaryService.categorizeFile(file.type || '', file.name || '');

    switch (category) {
      case 'image':
        return <Image className="w-5 h-5 text-green-500" />;
      case 'audio':
        return <Music className="w-5 h-5 text-blue-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-red-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const handlePreview = (file: UploadedFile) => {
    const category = cloudinaryService.categorizeFile(file.type || '', file.name || '');
    if (category === 'image') {
      setPreviewFile(file);
    } else {
      // Pour les non-images, ouvrir dans un nouvel onglet
      window.open(file.url, '_blank');
    }
  };

  const handleDownload = (file: UploadedFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (file: UploadedFile) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${file.name}" ?`)) {
      try {
        await cloudinaryService.deleteFile(file.projectId || '', file.taskId, file.url);
        onFileDelete?.(file);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du fichier');
      }
    }
  };

  if (files.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <File className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>Aucun fichier uploadé</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(file)}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {file.name}
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center space-x-1">
                  <FileText className="w-3 h-3" />
                  {file.type}
                </span>
                <span>{formatFileSize(file.size)}</span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(file.uploadedAt)}
                </span>
                {showProjectInfo && file.projectId && (
                  <span className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    {file.uploadedBy}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Bouton preview */}
            {file.type === 'image' && (
              <button
                onClick={() => handlePreview(file)}
                className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Aperçu"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}

            {/* Bouton télécharger */}
            <button
              onClick={() => handleDownload(file)}
              className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
              title="Télécharger"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Bouton supprimer */}
            {onFileDelete && (
              <button
                onClick={() => handleDelete(file)}
                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Modal d'aperçu pour les images */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="max-w-4xl max-h-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {previewFile.name}
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>{formatFileSize(previewFile.size)}</p>
                  <p>{formatDate(previewFile.uploadedAt)}</p>
                </div>
                <button
                  onClick={() => handleDownload(previewFile)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
