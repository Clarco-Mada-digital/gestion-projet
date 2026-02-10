
/**
 * Configuration Cloudinary
 * Pour obtenir ces valeurs :
 * 1. Créez un compte sur https://cloudinary.com/
 * 2. Récupérez votre "Cloud Name" dans le Dashboard
 * 3. Allez dans Settings > Upload > Upload presets
 * 4. Créez un "Unsigned" upload preset pour l'upload côté client
 */
export const cloudinaryConfig = {
  cloudName: "dqhksjmzp", // Valeur par défaut (à remplacer par l'utilisateur si besoin)
  uploadPreset: "gestion_projet_preset", // Valeur par défaut (à remplacer)
  apiKey: "874558237955513", // Optionnel pour l'upload non signé
};

export const isCloudinaryConfigured = () => {
  return cloudinaryConfig.cloudName !== "" && cloudinaryConfig.uploadPreset !== "";
};
