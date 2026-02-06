import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from '../../lib/firebaseConfig';
import { Project } from '../../types';

// Variables globales pour l'instance Firebase
let app: any = null;
let db: any = null;
let auth: any = null;

// Initialisation de Firebase si la configuration est valide
const ensureInitialized = () => {
  if (!app && isFirebaseConfigured()) {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
    } catch (error) {
      console.error("Erreur lors de l'initialisation de Firebase:", error);
    }
  }
  return !!app;
};

export const firebaseService = {
  /**
   * Vérifie si Firebase est prêt à l'emploi
   */
  isReady: () => ensureInitialized(),

  /**
   * Sauvegarde le profil utilisateur dans Firestore pour permettre la recherche par email
   */
  async saveUserProfile(user: FirebaseUser): Promise<void> {
    if (!ensureInitialized()) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email?.toLowerCase(),
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastSeen: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du profil:", error);
    }
  },

  /**
   * Recherche un utilisateur par email (pour inviter des membres)
   */
  async findUserByEmail(email: string): Promise<{ uid: string; displayName: string | null; photoURL: string | null } | null> {
    if (!ensureInitialized()) return null;
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        return {
          uid: userData.uid,
          displayName: userData.displayName,
          photoURL: userData.photoURL
        };
      }
      return null;
    } catch (error) {
      console.error("Erreur lors de la recherche utilisateur:", error);
      return null;
    }
  },

  /**
   * Connexion avec Google
   */
  async login(): Promise<FirebaseUser | null> {
    if (!ensureInitialized()) throw new Error("Firebase n'est pas configuré");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Sauvegarder le profil pour qu'on puisse le retrouver par email plus tard
      if (result.user) {
        await this.saveUserProfile(result.user);
      }
      return result.user;
    } catch (error) {
      console.error("Erreur de connexion:", error);
      throw error;
    }
  },

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    if (!ensureInitialized()) return;
    await signOut(auth);
  },

  /**
   * Écouteur d'état d'authentification
   */
  onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    if (!ensureInitialized()) return () => { };
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Récupère l'utilisateur actuellement connecté
   */
  async getCurrentUser(): Promise<FirebaseUser | null> {
    if (!ensureInitialized()) return null;
    return auth.currentUser;
  },

  /**
   * Récupère le profil d'un utilisateur par son ID
   */
  async getUserProfile(uid: string): Promise<{ uid: string; displayName: string | null; photoURL: string | null; email: string | null } | null> {
    if (!ensureInitialized()) return null;
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid: data.uid,
          displayName: data.displayName,
          photoURL: data.photoURL,
          email: data.email
        };
      }
      return null;
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      return null;
    }
  },

  /**
   * Sauvegarde ou met à jour un projet dans le Cloud
   */
  async syncProject(project: Project): Promise<void> {
    if (!ensureInitialized() || !auth.currentUser) return;

    try {
      // Nettoyage des données (Firestore n'aime pas les undefined)
      const cleanProject = JSON.parse(JSON.stringify(project));

      // Ajout des métadonnées de synchronisation
      cleanProject.lastSyncedAt = new Date().toISOString();
      cleanProject.source = 'firebase';

      // Si c'est le premier sync, on s'assure que l'utilisateur courant est propriétaire/membre
      if (!cleanProject.ownerId) {
        cleanProject.ownerId = auth.currentUser.uid;
      }

      if (!cleanProject.members || !cleanProject.members.includes(auth.currentUser.uid)) {
        cleanProject.members = [...(cleanProject.members || []), auth.currentUser.uid];
      }

      await setDoc(doc(db, 'projects', project.id), cleanProject, { merge: true });
    } catch (error) {
      console.error("Erreur lors de la synchronisation du projet:", error);
      throw error;
    }
  },

  /**
   * Récupère les projets partagés avec l'utilisateur connecté
   */
  async getSharedProjects(): Promise<Project[]> {
    if (!ensureInitialized() || !auth.currentUser) return [];

    try {
      const q = query(
        collection(db, 'projects'),
        where('members', 'array-contains', auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        source: 'firebase' // Force la source
      } as Project));
    } catch (error) {
      console.error("Erreur lors de la récupération des projets partagés:", error);
      return [];
    }
  }
};
