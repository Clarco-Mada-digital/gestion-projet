import React, { useState, useRef, useCallback } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cloudinaryService } from '../../services/collaboration/cloudinaryService';
import { localImageService } from '../../services/localImageService';

interface CoverImageUploadProps {
  currentImage?: string;
  currentImagePublicId?: string;
  onImageUploaded: (imageUrl: string, publicId?: string) => void;
  onImageRemoved: () => void;
  projectId?: string;
  projectSource?: 'local' | 'firebase';
  className?: string;
}

export function CoverImageUpload({
  currentImage,
  currentImagePublicId,
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
      const isCloudProject = projectSource === 'firebase' || projectSource === 'cloud';
      if (isCloudProject) {
        // Log l'ancienne image vers la corbeille si elle existe avant d'uploader la nouvelle
        if (currentImage && currentImagePublicId && !currentImage.startsWith('data:')) {
          cloudinaryService.logToTrash(currentImage, currentImagePublicId, 'image', "replaced_project_cover");
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          throw new Error('L\'image est trop volumineuse. Taille maximale: 10MB');
        }

        const uploadedFile = await cloudinaryService.uploadFile(
          file,
          {
            projectId,
            uploadedBy: 'current-user'
          }
        );

        onImageUploaded(uploadedFile.url, uploadedFile.publicId);
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
  }, [onImageUploaded, projectId, projectSource, currentImage, currentImagePublicId]);

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
    const isCloudProject = projectSource === 'firebase' || projectSource === 'cloud';
    if (isCloudProject && currentImage && currentImagePublicId && !currentImage.startsWith('data:')) {
      cloudinaryService.logToTrash(currentImage, currentImagePublicId, 'image', "removed_project_cover");
    }
    onImageRemoved();
  }, [onImageRemoved, currentImage, currentImagePublicId, projectSource]);

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
            relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300
            ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.01]' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}
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
            <div className="py-4 space-y-3">
              <div className="flex justify-center">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 border-2 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
                  <div
                    className="absolute inset-0 border-2 border-indigo-600 rounded-full animate-spin border-t-transparent"
                  ></div>
                </div>
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Optimisation et upload... {Math.round(uploadProgress)}%
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mb-3 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {isDragging ? 'Déposez l\'image' : 'Image de couverture'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG ou WebP jusqu'à {maxSizeText}
                </p>
              </div>

              {/* Badges de statut discrets */}
              <div className="mt-3 flex items-center gap-2">
                {projectSource === 'local' ? (
                  <span className="flex items-center px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-[10px] font-medium text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                    💾 Local (Base64)
                  </span>
                ) : (
                  <span className="flex items-center px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                    ☁️ Cloud (Cloudinary)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
