import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from '../../lib/firebaseConfig';
import { Project } from '../../types';

// Variables globales pour l'instance Firebase
let app: any = null;
let db: any = null;
let auth: any = null;

// Instance séparée pour l'agenda pour éviter de déconnecter l'utilisateur principal
let calendarApp: any = null;
let calendarAuth: any = null;

// Initialisation de Firebase si la configuration est valide
const ensureInitialized = async () => {
  if (!isFirebaseConfigured()) {
    console.error("Firebase n'est pas configuré.");
    return false;
  }

  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      // Activer la persistance de session pour l'auth principale
      await setPersistence(auth, browserLocalPersistence);
    }
    if (!calendarApp) {
      // On initialise une deuxième instance avec un nom différent
      calendarApp = initializeApp(firebaseConfig, "calendar");
      calendarAuth = getAuth(calendarApp);
      // Activer la persistance de session pour l'agenda
      await setPersistence(calendarAuth, browserLocalPersistence);
    }
  } catch (error) {
    console.error("Erreur lors de l'initialisation de Firebase:", error);
    return false;
  }
  return true;
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
   * Connexion avec Google pour Firebase (Authentification de l'application)
   */
  async login(): Promise<{ user: FirebaseUser }> {
    if (!ensureInitialized()) throw new Error("Firebase n'est pas configuré");
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);

      if (result.user) {
        await this.saveUserProfile(result.user);
      }

      return { user: result.user };
    } catch (error) {
      console.error("Erreur de connexion Firebase:", error);
      throw error;
    }
  },

  /**
   * Vérifie si l'utilisateur est déjà connecté à l'agenda
   */
  async isCalendarLoggedIn(): Promise<boolean> {
    if (!ensureInitialized()) return false;

    try {
      const currentUser = await calendarAuth.currentUser;
      return !!currentUser;
    } catch (error) {
      console.error("Erreur lors de la vérification de connexion agenda:", error);
      return false;
    }
  },

  /**
   * Authentification spécifique pour Google Calendar (indépendante de Firebase)
   * @param forceConsent Si vrai, force l'affichage de l'écran de sélection de compte et de consentement
   */
  async loginCalendar(forceConsent: boolean = false): Promise<{ accessToken: string; email: string; expiresIn: number; timestamp: number }> {
    if (!ensureInitialized()) throw new Error("Firebase n'est pas configuré");
    const provider = new GoogleAuthProvider();

    // Accès complet au calendrier (lecture, écriture, suppression) et accès aux tâches
    provider.addScope('https://www.googleapis.com/auth/calendar');
    provider.addScope('https://www.googleapis.com/auth/tasks');

    // Paramètres personnalisés pour améliorer l'expérience utilisateur
    const params: any = {
      access_type: 'offline',
    };

    // On ne demande le consentement que si forcé ou si c'est la première fois
    if (forceConsent) {
      params.prompt = 'select_account consent';
    } else {
      // 'select_account' permet de choisir le compte sans forcément re-valider toutes les permissions
      params.prompt = 'select_account';
    }

    provider.setCustomParameters(params);

    try {
      // On utilise l'instance calendarAuth pour ne pas interférer avec l'auth principale
      const result = await signInWithPopup(calendarAuth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) {
        throw new Error("Impossible de récupérer le jeton d'accès Google Calendar");
      }

      return {
        accessToken,
        email: result.user.email || 'Inconnu',
        expiresIn: 3600, // Google tokens durent généralement 1 heure
        timestamp: Date.now()
      };
    } catch (error: any) {
      console.error("Erreur d'authentification Agenda:", error);
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
  },

  /**
   * Récupère un projet public par son ID (sans authentification nécessaire)
   */
  async getPublicProject(projectId: string): Promise<Project | null> {
    if (!ensureInitialized()) return null;

    try {
      const projectDoc = await getDoc(doc(db, 'projects', projectId));

      if (projectDoc.exists()) {
        const data = projectDoc.data() as Project;
        // Double vérification côté client même si les règles Firestore s'en chargent
        if (data.isPublic) {
          return {
            ...data,
            source: 'firebase'
          };
        }
      }
      return null;
    } catch (error) {
      console.error("Erreur lors de la récupération du projet public:", error);
      return null;
    }
  },

  /**
   * Écoute les mises à jour en temps réel d'un projet public
   */
  onPublicProjectUpdate: (projectId: string, callback: (project: Project | null) => void) => {
    if (!isFirebaseConfigured()) return () => { };

    // On s'assure que db est initialisé (via ensureInitialized implicitement si on arrive ici via une action)
    // Mais on peut appeler ensureInitialized pour plus de sécurité
    ensureInitialized();

    return onSnapshot(doc(db, 'projects', projectId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Project;
        if (data.isPublic) {
          callback({ ...data, source: 'firebase' });
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    }, (error) => {
      console.error("Erreur lors de l'écoute du projet public:", error);
      callback(null);
    });
  },

  /**
   * Supprime un projet du Cloud
   */
  deleteProject: async (projectId: string): Promise<void> => {
    if (!ensureInitialized()) throw new Error("Firebase n'est pas initialisé");
    if (!auth.currentUser) throw new Error("Vous devez être connecté pour supprimer un projet Cloud");

    try {
      // On récupère le projet pour vérifier le propriétaire
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (!projectDoc.exists()) {
        console.warn(`Projet Cloud ${projectId} introuvable, suppression locale uniquement.`);
        return;
      }

      const projectData = projectDoc.data();

      // Seul le propriétaire peut supprimer le projet
      if (projectData.ownerId === auth.currentUser.uid) {
        await deleteDoc(doc(db, 'projects', projectId));
      } else {
        throw new Error("Vous n'avez pas l'autorisation de supprimer ce projet.");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du projet Cloud:", error);
      throw error;
    }
  },
};

// Exporter les instances pour les autres services
export { db, auth };
