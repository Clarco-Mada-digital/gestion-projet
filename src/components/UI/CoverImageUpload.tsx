import React, { useState, useRef, useCallback } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { firebaseStorageService } from '../../services/collaboration/firebaseStorageService';
import { localImageService } from '../../services/localImageService';

interface CoverImageUploadProps {
  currentImage?: string;
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved: () => void;
  projectId?: string;
  projectSource?: 'local' | 'firebase';
  className?: string;
}

export function CoverImageUpload({
  currentImage,
  onImageUploaded,
  onImageRemoved,
  projectId,
  projectSource = 'local',
  className = ''
}: CoverImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(async (file: File) => {
    // Vérifier que c'est bien une image
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide (JPG, PNG, GIF, etc.)');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      if (projectSource === 'firebase') {
        // Pour les projets Firebase, utiliser le service Firebase
        const maxSize = 5 * 1024 * 1024; // 5MB pour Firebase
        if (file.size > maxSize) {
          throw new Error('L\'image est trop volumineuse. Taille maximale: 5MB');
        }

        const uploadedFile = await firebaseStorageService.uploadFile(
          file,
          'project-covers',
          {
            projectId,
            uploadedBy: 'current-user' // À remplacer avec l'ID utilisateur réel
          }
        );

        onImageUploaded(uploadedFile.url);
      } else {
        // Pour les projets locaux, utiliser le service base64
        const validation = localImageService.validateImageFile(file);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        // Compresser si nécessaire
        let processedFile = file;
        if (file.size > 1024 * 1024) { // Si > 1MB, compresser
          processedFile = await localImageService.compressImage(file);
        }

        // Convertir en base64
        const base64Image = await localImageService.convertImageToBase64(processedFile);
        onImageUploaded(base64Image);
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'upload de l\'image. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onImageUploaded, projectId, projectSource]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleRemoveImage = useCallback(() => {
    onImageRemoved();
  }, [onImageRemoved]);

  // Déterminer les limites selon le type de projet
  const maxSize = projectSource === 'firebase' ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
  const maxSizeText = projectSource === 'firebase' ? '5MB' : '2MB';

  return (
    <div className={`space-y-4 ${className}`}>
      {currentImage ? (
        // Affichage de l'image actuelle
        <div className="relative group">
          <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700">
            <img
              src={currentImage}
              alt="Image de couverture"
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                  disabled={isUploading}
                >
                  {isUploading ? 'Upload...' : 'Changer'}
                </button>
                <button
                  onClick={handleRemoveImage}
                  className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
          
          {isUploading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Upload en cours...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Zone d'upload quand il n'y a pas d'image
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload en cours... {Math.round(uploadProgress)}%
              </p>
              {uploadProgress > 0 && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  {isDragging ? 'Relâchez l\'image ici' : 'Ajouter une image de couverture'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Glissez-déposez ou cliquez pour sélectionner
                </p>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
                <p>Formats acceptés: JPG, PNG, GIF, WebP</p>
                <p>Taille maximale: {maxSizeText}</p>
                <p>Dimensions recommandées: 1920x1080px</p>
                {projectSource === 'local' && (
                  <p className="text-amber-600 dark:text-amber-400">
                    💾 Stockage local (base64)
                  </p>
                )}
                {projectSource === 'firebase' && (
                  <p className="text-blue-600 dark:text-blue-400">
                    ☁️ Stockage cloud (Firebase)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
