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
    const baseUrl = import.meta.env.BASE_URL || '/';
    // S'assurer que le chemin est correct (éviter le double slash)
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const response = await fetch(`${normalizedBaseUrl}DOCUMENTATION.md`);
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
