import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { getFirestore, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../lib/firebaseConfig';

// Initialisation de Firebase Storage
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
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
}

export const firebaseStorageService = {
  /**
   * Uploade un fichier vers Firebase Storage
   */
  async uploadFile(
    file: File, 
    path: string,
    metadata: { taskId?: string; projectId?: string; uploadedBy: string }
  ): Promise<UploadedFile> {
    try {
      // Créer une référence unique pour le fichier
      const fileRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
      
      // Upload du fichier
      const snapshot = await uploadBytes(fileRef, file, {
        contentType: file.type,
        customMetadata: {
          ...metadata,
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      });

      // Récupérer l'URL de téléchargement
      const downloadURL = await getDownloadURL(snapshot.ref);

      const uploadedFile: UploadedFile = {
        name: file.name,
        url: downloadURL,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: metadata.uploadedBy,
        taskId: metadata.taskId,
        projectId: metadata.projectId
      };

      // Ajouter la référence du fichier au document correspondant
      if (metadata.taskId) {
        await updateDoc(doc(db, 'tasks', metadata.taskId), {
          attachments: arrayUnion(uploadedFile)
        });
      }

      if (metadata.projectId) {
        // Pour les images de couverture, on met à jour le champ coverImage
        if (path.includes('project-covers')) {
          await updateDoc(doc(db, 'projects', metadata.projectId), {
            coverImage: downloadURL
          });
        } else {
          // Pour les autres fichiers de projet
          await updateDoc(doc(db, 'projects', metadata.projectId), {
            attachments: arrayUnion(uploadedFile)
          });
        }
      }

      return uploadedFile;
    } catch (error) {
      console.error("Erreur lors de l'upload du fichier:", error);
      throw error;
    }
  },

  /**
   * Uploade spécifiquement une image de couverture pour un projet
   */
  async uploadProjectCoverImage(
    file: File,
    projectId: string,
    uploadedBy: string
  ): Promise<string> {
    try {
      // Vérifier que c'est bien une image
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('L\'image est trop volumineuse (max 5MB)');
      }

      const uploadedFile = await this.uploadFile(
        file,
        'project-covers',
        { projectId, uploadedBy }
      );

      return uploadedFile.url;
    } catch (error) {
      console.error("Erreur lors de l'upload de l'image de couverture:", error);
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
    try {
      return await this.uploadFile(
        file,
        'task-attachments',
        { taskId, projectId, uploadedBy }
      );
    } catch (error) {
      console.error("Erreur lors de l'upload du fichier joint:", error);
      throw error;
    }
  },

  /**
   * Supprime un fichier de Firebase Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
    } catch (error) {
      console.error("Erreur lors de la suppression du fichier:", error);
      throw error;
    }
  },

  /**
   * Supprime l'image de couverture d'un projet
   */
  async deleteProjectCoverImage(projectId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        coverImage: null
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'image de couverture:", error);
      throw error;
    }
  },

  /**
   * Liste tous les fichiers d'un dossier
   */
  async listFiles(path: string): Promise<string[]> {
    try {
      const listRef = ref(storage, path);
      const result = await listAll(listRef);
      return result.items.map(item => item.name);
    } catch (error) {
      console.error("Erreur lors de la liste des fichiers:", error);
      return [];
    }
  },

  /**
   * Vérifie le type de fichier et retourne des informations
   */
  getFileType(file: File): { category: string; isImage: boolean; isAudio: boolean; isVideo: boolean; isDocument: boolean } {
    const type = file.type.toLowerCase();
    const name = file.name.toLowerCase();
    
    return {
      category: this.categorizeFile(type, name),
      isImage: type.startsWith('image/') || this.isImageFile(name),
      isAudio: type.startsWith('audio/') || this.isAudioFile(name),
      isVideo: type.startsWith('video/') || this.isVideoFile(name),
      isDocument: type.includes('document') || type.includes('pdf') || this.isDocumentFile(name)
    };
  },

  /**
   * Catégorise le fichier selon son type
   */
  categorizeFile(type: string, name: string): string {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('audio/')) return 'audio';
    if (type.startsWith('video/')) return 'video';
    if (type.includes('pdf')) return 'document';
    if (type.includes('document')) return 'document';
    if (type.includes('spreadsheet')) return 'spreadsheet';
    if (type.includes('presentation')) return 'presentation';
    
    // Vérification par extension
    if (this.isImageFile(name)) return 'image';
    if (this.isAudioFile(name)) return 'audio';
    if (this.isVideoFile(name)) return 'video';
    if (this.isDocumentFile(name)) return 'document';
    
    return 'other';
  },

  /**
   * Vérifie si c'est une image par extension
   */
  isImageFile(name: string): boolean {
    return /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico)$/i.test(name);
  },

  /**
   * Vérifie si c'est un audio par extension
   */
  isAudioFile(name: string): boolean {
    return /\.(mp3|wav|ogg|flac|aac|m4a|wma)$/i.test(name);
  },

  /**
   * Vérifie si c'est une vidéo par extension
   */
  isVideoFile(name: string): boolean {
    return /\.(mp4|avi|mov|wmv|flv|webm|mkv|3gp)$/i.test(name);
  },

  /**
   * Vérifie si c'est un document par extension
   */
  isDocumentFile(name: string): boolean {
    return /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|odt|ods|odp)$/i.test(name);
  }
};
