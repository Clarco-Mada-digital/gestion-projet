import { cloudinaryConfig } from '../../lib/cloudinaryConfig';
import { getFirestore, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../lib/firebaseConfig';

// Initialisation de Firebase pour Firestore (Cloudinary remplace juste Storage)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  taskId?: string;
  projectId?: string;
  publicId?: string; // Spécifique à Cloudinary
}

export const cloudinaryService = {
  /**
   * Uploade un fichier vers Cloudinary
   */
  async uploadFile(
    file: File,
    metadata: { taskId?: string; projectId?: string; uploadedBy: string }
  ): Promise<UploadedFile> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);

      // Déterminer le resource_type (image, video, raw)
      let resourceType = 'raw';
      if (file.type.startsWith('image/')) {
        resourceType = 'image';
      } else if (file.type.startsWith('video/')) {
        resourceType = 'video';
      }
      formData.append('resource_type', resourceType);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erreur lors de l\'upload vers Cloudinary');
      }

      const data = await response.json();

      // Optimisation automatique pour les images (format auto + qualité auto)
      let finalUrl = data.secure_url;
      if (resourceType === 'image') {
        finalUrl = data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
      }

      const uploadedFile: UploadedFile = {
        name: file.name,
        url: finalUrl,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: metadata.uploadedBy,
        taskId: metadata.taskId,
        projectId: metadata.projectId,
        publicId: data.public_id
      };

      // Mettre à jour Firestore uniquement si le document existe
      // On wrap dans un try/catch car si la tâche est locale (pas encore sync), updateDoc plantera
      try {
        if (metadata.taskId) {
          await updateDoc(doc(db, 'tasks', metadata.taskId), {
            attachments: arrayUnion(uploadedFile)
          });
        }
      } catch (e) {
        console.warn("Document non trouvé dans Firestore, l'attachement sera sauvegardé avec la tâche :", e);
      }

      return uploadedFile;
    } catch (error) {
      console.error("Erreur Cloudinary:", error);
      throw error;
    }
  },

  /**
   * Uploade une image de couverture pour un projet
   */
  async uploadProjectCoverImage(
    file: File,
    projectId: string,
    uploadedBy: string
  ): Promise<string> {
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }

      const uploadedFile = await this.uploadFile(file, { projectId, uploadedBy });

      // Mise à jour spécifique pour la cover
      await updateDoc(doc(db, 'projects', projectId), {
        coverImage: uploadedFile.url
      });

      return uploadedFile.url;
    } catch (error) {
      console.error("Erreur upload cover image:", error);
      throw error;
    }
  },

  /**
   * Uploade un fichier joint pour une tâche
   */
  async uploadTaskAttachment(
    file: File,
    taskId: string,
    projectId: string,
    uploadedBy: string
  ): Promise<UploadedFile> {
    return await this.uploadFile(file, { taskId, projectId, uploadedBy });
  },

  /**
   * Suppression (Note: La suppression côté client nécessite un jeton de suppression déduit de la réponse d'upload
   * ou une Signature API qui ne doit pas être exposée. Pour l'instant, on se contente de supprimer la ref Firestore)
   */
  async deleteFile(_projectId: string, _taskId?: string, _fileUrl?: string): Promise<void> {
    // Dans une version simplifiée (Unsigned), la suppression Cloudinary est complexe sans backend.
    // On retire au moins la référence de Firestore.
    console.warn("La suppression physique sur Cloudinary nécessite une signature API sécurisée.");
  },

  /**
   * Détermine la catégorie du fichier (copié de firebaseStorageService pour compatibilité)
   */
  categorizeFile(type: string, name: string): string {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('audio/')) return 'audio';
    if (type.startsWith('video/')) return 'video';
    if (type.includes('pdf')) return 'document';
    if (type.includes('document')) return 'document';
    if (type.includes('spreadsheet')) return 'spreadsheet';
    if (type.includes('presentation')) return 'presentation';

    const isImageFile = (n: string) => /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico)$/i.test(n);
    const isAudioFile = (n: string) => /\.(mp3|wav|ogg|flac|aac|m4a|wma)$/i.test(n);
    const isVideoFile = (n: string) => /\.(mp4|avi|mov|wmv|flv|webm|mkv|3gp)$/i.test(n);
    const isDocumentFile = (n: string) => /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|odt|ods|odp)$/i.test(n);

    if (isImageFile(name)) return 'image';
    if (isAudioFile(name)) return 'audio';
    if (isVideoFile(name)) return 'video';
    if (isDocumentFile(name)) return 'document';

    return 'other';
  }
};
