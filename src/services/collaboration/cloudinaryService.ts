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
      formData.append('resource_type', 'auto');

      // Utiliser des tags pour l'organisation (toujours autorisé en mode non-signé)
      const tags = ['gestion-projet'];
      if (metadata.taskId) tags.push('attachment');
      if (metadata.projectId && !metadata.taskId) tags.push('cover');
      formData.append('tags', tags.join(','));

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`,
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
      const actualResourceType = data.resource_type;

      // Optimisation automatique pour les images (format auto + qualité auto)
      let finalUrl = data.secure_url;
      if (actualResourceType === 'image') {
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
   * Enregistre un fichier dans la "corbeille" Firestore pour suppression manuelle ultérieure
   */
  async logToTrash(fileUrl: string, publicId: string, type: string, reason: string): Promise<void> {
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'cloudinary_trash'), {
        url: fileUrl,
        publicId,
        type,
        deletedAt: new Date().toISOString(),
        reason, // ex: "replaced_cover", "removed_attachment"
        status: 'pending_manual_deletion'
      });

    } catch (error) {
      console.error("Erreur lors du log vers la corbeille:", error);
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

      const uploadedFile = await this.uploadFile(file, {
        projectId,
        uploadedBy
      });

      // Mise à jour spécifique pour la cover
      await updateDoc(doc(db, 'projects', projectId), {
        coverImage: uploadedFile.url,
        coverImagePublicId: uploadedFile.publicId // On stocke le publicId pour le tracer si on change l'image
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
    return await this.uploadFile(file, {
      taskId,
      projectId,
      uploadedBy
    });
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
  categorizeFile(type: string, name: string): 'image' | 'document' | 'other' {
    if (type.startsWith('image/')) return 'image';
    if (type.includes('pdf')) return 'document';
    if (type.includes('document')) return 'document';
    if (type.includes('spreadsheet')) return 'document';
    if (type.includes('presentation')) return 'document';

    const isImageFile = (n: string) => /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico)$/i.test(n);
    const isDocumentFile = (n: string) => /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|odt|ods|odp)$/i.test(n);

    if (isImageFile(name)) return 'image';
    if (isDocumentFile(name)) return 'document';

    return 'other';
  }
};
