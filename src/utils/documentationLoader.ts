let documentationContent: string | null = null;
let isLoaded = false;

/**
 * Charge le contenu du fichier DOCUMENTATION.md
 * @returns Promesse résolue avec le contenu du fichier
 */
export async function loadDocumentation(): Promise<string> {
  // Si déjà chargé, retourner le contenu en cache
  if (isLoaded && documentationContent) {
    return documentationContent;
  }

  try {
    const response = await fetch('/DOCUMENTATION.md');
    if (!response.ok) {
      throw new Error('Impossible de charger la documentation');
    }
    
    documentationContent = await response.text();
    isLoaded = true;
    return documentationContent;
  } catch (error) {
    console.error('Erreur lors du chargement de la documentation:', error);
    return 'Documentation non disponible. Veuillez réessayer plus tard.';
  }
}
