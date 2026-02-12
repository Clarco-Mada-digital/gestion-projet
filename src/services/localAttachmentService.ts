/**
 * Services pour la gestion des fichiers joints des tâches locales
 */

import { Attachment } from '../types';

export interface LocalAttachmentService {
  /**
   * Convertit un fichier en base64 pour les tâches locales
   */
  convertFileToBase64(file: File): Promise<string>;

  /**
   * Valide qu'un fichier est acceptable pour les tâches locales
   */
  validateFile(file: File): { isValid: boolean; error?: string };

  /**
   * Crée un objet Attachment à partir d'un fichier pour les tâches locales
   */
  createLocalAttachment(file: File, base64Url: string): Attachment;

  /**
   * Vérifie si l'extension est supportée
   */
  isSupportedExtension(filename: string): boolean;

  /**
   * Détermine le type de fichier
   */
  getFileType(file: File): 'image' | 'video' | 'audio' | 'document' | 'other';
}

export const localAttachmentService: LocalAttachmentService = {
  /**
   * Convertit un fichier en base64
   */
  async convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Retourner l'URL data complète
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Valide qu'un fichier est acceptable
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    // Vérifier la taille (max 5MB pour les fichiers locaux)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { isValid: false, error: 'Le fichier est trop volumineux (max 5MB pour les tâches locales)' };
    }

    // Vérifier les types supportés
    const supportedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      // Documents
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Audio/Video
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3',
      'video/mp4', 'video/mpeg', 'video/ogg', 'video/webm',
      // Autres
      'application/zip', 'application/x-zip-compressed'
    ];

    if (!supportedTypes.includes(file.type) && !this.isSupportedExtension(file.name)) {
      return {
        isValid: false,
        error: 'Type de fichier non supporté. Utilisez images, audio, vidéo, PDF, documents Office, TXT ou ZIP'
      };
    }

    return { isValid: true };
  },

  /**
   * Vérifie si l'extension est supportée
   */
  isSupportedExtension(filename: string): boolean {
    const supportedExtensions = [
      // Images
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
      // Documents
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.rtf',
      // Audio/Video
      '.mp3', '.wav', '.ogg', '.m4a',
      '.mp4', '.mov', '.avi', '.webm', '.mkv',
      // Autres
      '.zip', '.rar', '.7z'
    ];

    return supportedExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  },

  /**
   * Crée un objet Attachment pour les tâches locales
   */
  createLocalAttachment(file: File, base64Url: string): Attachment {
    const fileType = this.getFileType(file);

    return {
      id: `local-${file.name}-${Date.now()}`,
      name: file.name,
      type: fileType,
      url: base64Url,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'local-user'
    };
  },

  /**
   * Détermine le type de fichier
   */
  getFileType(file: File): 'image' | 'video' | 'audio' | 'document' | 'other' {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';

    if (file.type.includes('pdf') ||
      file.type.includes('document') ||
      file.type.includes('spreadsheet') ||
      file.type.includes('presentation') ||
      file.type.includes('text')) {
      return 'document';
    }

    // Check by extension fallback
    const name = file.name.toLowerCase();
    if (name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.avi') || name.endsWith('.webm') || name.endsWith('.mkv')) return 'video';
    if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.ogg') || name.endsWith('.m4a')) return 'audio';

    return 'other';
  }
};

/**
 * Hook React pour gérer les fichiers joints locaux
 */
export const useLocalAttachments = () => {
  const handleLocalFileUpload = async (file: File): Promise<Attachment> => {
    // Valider le fichier
    const validation = localAttachmentService.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Convertir en base64
    const base64Url = await localAttachmentService.convertFileToBase64(file);

    // Créer l'attachment
    return localAttachmentService.createLocalAttachment(file, base64Url);
  };

  return {
    handleLocalFileUpload,
    validateFile: localAttachmentService.validateFile
  };
};
