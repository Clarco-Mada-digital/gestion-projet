/**
 * Services pour la gestion des images de couverture des projets locaux
 */

export interface LocalImageService {
  /**
   * Convertit un fichier image en base64
   */
  convertImageToBase64(file: File): Promise<string>;
  
  /**
   * Convertit une URL base64 en Blob pour l'affichage
   */
  base64ToBlob(base64: string): Blob;
  
  /**
   * Valide qu'un fichier est une image et respecte les limites
   */
  validateImageFile(file: File): { isValid: boolean; error?: string };
  
  /**
   * Compresse une image si nécessaire (optionnel)
   */
  compressImage(file: File, maxWidth?: number, maxHeight?: number, quality?: number): Promise<File>;
}

export const localImageService: LocalImageService = {
  /**
   * Convertit un fichier image en base64
   */
  async convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Retourner seulement la partie data URL sans le préfixe pour économiser de l'espace
        const base64 = result.split(',')[1];
        resolve(`data:${file.type};base64,${base64}`);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Convertit une URL base64 en Blob
   */
  base64ToBlob(base64: string): Blob {
    // Extraire la partie base64 et le type MIME
    const parts = base64.split(',');
    const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const base64Data = parts[1];
    
    // Convertir en binaire
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  },

  /**
   * Valide qu'un fichier est une image et respecte les limites
   */
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'Le fichier doit être une image' };
    }

    // Vérifier la taille (max 2MB pour localStorage pour éviter les problèmes)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return { isValid: false, error: 'L\'image est trop volumineuse (max 2MB pour les projets locaux)' };
    }

    // Vérifier les types supportés
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      return { isValid: false, error: 'Type d\'image non supporté. Utilisez JPG, PNG, GIF ou WebP' };
    }

    return { isValid: true };
  },

  /**
   * Compresse une image si nécessaire
   */
  async compressImage(
    file: File, 
    maxWidth: number = 1920, 
    maxHeight: number = 1080, 
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculer les nouvelles dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Dessiner l'image compressée
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir en blob puis en File
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Erreur lors de la compression de l\'image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
};

/**
 * Hook React pour gérer les images de couverture locales
 */
export const useLocalCoverImage = () => {
  const handleLocalImageUpload = async (file: File): Promise<string> => {
    // Valider le fichier
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
    return await localImageService.convertImageToBase64(processedFile);
  };

  return {
    handleLocalImageUpload,
    validateImageFile: localImageService.validateImageFile,
    compressImage: localImageService.compressImage
  };
};
