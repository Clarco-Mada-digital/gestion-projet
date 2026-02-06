
// Configuration Firebase
// ⚠️ IMPORTANT: Remplacez ces valeurs par celles de VOTRE projet Firebase !
// 1. Allez sur https://console.firebase.google.com/
// 2. Sélectionnez votre projet "gestion-projet-b8c77" (ou créez-en un nouveau)
// 3. Cliquez sur l'icône Web (</>) pour ajouter une application
// 4. Copiez les valeurs de configuration et remplacez-les ci-dessous

export const firebaseConfig = {
  apiKey: "AIzaSyAiEu-xlbONd1jKwlRKCMhHrgLWvCNPnsc",
  authDomain: "gestion-projet-b8c77.firebaseapp.com",
  projectId: "gestion-projet-b8c77",
  storageBucket: "gestion-projet-b8c77.firebasestorage.app",
  messagingSenderId: "650111904365",
  appId: "1:650111904365:web:478c0f1c9c8445e357ad64"
};

// Vérification de la configuration
export const isFirebaseConfigured = () => {
  const isConfigured = firebaseConfig.apiKey !== "[GCP_API_KEY]" &&
    firebaseConfig.projectId !== "[GCP_PROJECT_ID]";

  console.log('🔥 Firebase Config Check:', {
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    isConfigured
  });

  return isConfigured;
};
