import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, Music, Video, File } from 'lucide-react';
import { cloudinaryService, UploadedFile } from '../../services/collaboration/cloudinaryService';

interface FileUploadProps {
  onFileUploaded: (file: UploadedFile) => void;
  taskId?: string;
  projectId?: string;
  maxSize?: number; // en octets
  acceptedTypes?: string[];
  multiple?: boolean;
  className?: string;
}

export function FileUpload({
  onFileUploaded,
  taskId,
  projectId,
  maxSize = 25 * 1024 * 1024, // Augmenté à 25MB pour Cloudinary
  acceptedTypes = ['image/*', 'audio/*', 'video/*', '.pdf', '.doc', '.docx', '.txt'],
  multiple = false,
  className = ''
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Vérification de la taille
        if (file.size > maxSize) {
          alert(`Le fichier ${file.name} est trop volumineux. Taille maximale: ${maxSize / 1024 / 1024}MB`);
          continue;
        }

        // Vérification du type
        const category = cloudinaryService.categorizeFile(file.type, file.name);
        console.log(`Upload du fichier: ${file.name} (${category})`);

        // Upload vers Cloudinary
        const uploadedFile = await cloudinaryService.uploadFile(
          file,
          {
            taskId,
            projectId,
            uploadedBy: 'current-user' // À remplacer avec l'ID utilisateur réel
          }
        );

        onFileUploaded(uploadedFile);
        setUploadProgress(((i + 1) / files.length) * 100);
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'upload du fichier. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onFileUploaded, taskId, projectId, maxSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

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

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  }, [handleFileUpload]);

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return <Image className="w-8 h-8 text-green-500" />;
      case 'audio': return <Music className="w-8 h-8 text-blue-500" />;
      case 'video': return <Video className="w-8 h-8 text-purple-500" />;
      case 'document': return <FileText className="w-8 h-8 text-red-500" />;
      default: return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Zone d'upload */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
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
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600">
              Upload en cours... {Math.round(uploadProgress)}%
            </p>
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragging ? 'Relâchez les fichiers ici' : 'Glissez-déposez les fichiers ici'}
              </p>
              <p className="text-sm text-gray-500">
                ou cliquez pour sélectionner
              </p>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <p>Types acceptés: Images, Audio, Vidéo, Documents</p>
              <p>Taille maximale: {maxSize / 1024 / 1024}MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Aperçu des types de fichiers */}
      <div className="mt-4 grid grid-cols-4 gap-4 text-center">
        <div className="space-y-2">
          {getFileIcon('image')}
          <p className="text-xs text-gray-600">Images</p>
          <p className="text-xs text-gray-400">JPG, PNG, GIF...</p>
        </div>
        <div className="space-y-2">
          {getFileIcon('audio')}
          <p className="text-xs text-gray-600">Audio</p>
          <p className="text-xs text-gray-400">MP3, WAV, OGG...</p>
        </div>
        <div className="space-y-2">
          {getFileIcon('video')}
          <p className="text-xs text-gray-600">Vidéo</p>
          <p className="text-xs text-gray-400">MP4, AVI, MOV...</p>
        </div>
        <div className="space-y-2">
          {getFileIcon('document')}
          <p className="text-xs text-gray-600">Documents</p>
          <p className="text-xs text-gray-400">PDF, DOC, TXT...</p>
        </div>
      </div>
    </div>
  );
}
