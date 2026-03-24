import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInAnonymously, User as FirebaseUser, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from '../../lib/firebaseConfig';
import { Project, Task } from '../../types';
import { EncryptionService } from '../security/encryptionService';

// Variables globales pour l'instance Firebase
let app: any = null;
let db: any = null;
let auth: any = null;

// Registre des listeners de tâches pour éviter les fuites de mémoire et doublons
const projectTaskListeners: Record<string, () => void> = {};
const projectTasksCache: Record<string, Task[]> = {};

// Initialisation immédiate si possible
if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    // Note: setPersistence est asynchrone, on le laisse dans ensureInitialized ou on l'appelle sans attendre
    setPersistence(auth, browserLocalPersistence).catch(console.error);
  } catch (error) {
    console.error("Erreur d'initialisation immédiate Firebase:", error);
  }
}

// Instance séparée pour l'agenda pour éviter de déconnecter l'utilisateur principal
let calendarApp: any = null;
let calendarAuth: any = null;

// Initialisation de Firebase si la configuration est valide
const ensureInitialized = async () => {
  if (!isFirebaseConfigured()) {
    console.error("Firebase n'est pas configuré.");
    return false;
  }

  if (app && db && auth && calendarApp && calendarAuth) return true;

  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      await setPersistence(auth, browserLocalPersistence);
    }
    if (!calendarApp) {
      // On initialise une deuxième instance avec un nom différent
      calendarApp = initializeApp(firebaseConfig, "calendar");
      calendarAuth = getAuth(calendarApp);
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
    provider.addScope('https://www.googleapis.com/auth/gmail.send');
    // Nécessaire pour pouvoir lire le vrai Message-ID (metadata) après l'envoi
    // afin de construire correctement les threads (In-Reply-To)
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');

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
   * Sauvegarde ou met à jour un projet dans le Cloud (avec E2EE si activé)
   */
  async syncProject(project: Project): Promise<void> {
    if (!ensureInitialized() || !auth.currentUser) return;

    try {
      let projectToSync = JSON.parse(JSON.stringify(project));
      const key = project.encryptionKey;

      // Forcer la version 2 pour les nouvelles synchronisations si non définie
      if (!projectToSync.syncVersion) {
        projectToSync.syncVersion = 2;
      }

      // Si le chiffrement est activé et qu'on a la clé, on chiffre les données sensibles
      if (project.isEncryptionEnabled && key) {
        console.log(`[E2EE] Chiffrement du projet "${project.name}" avant synchronisation...`);
        
        projectToSync.name = await EncryptionService.encrypt(project.name, key);
        projectToSync.description = await EncryptionService.encrypt(project.description, key);
        
        if (projectToSync.tasks) {
          projectToSync.tasks = await Promise.all(projectToSync.tasks.map(async (task: Task) => 
            await this.encryptTask(task, key)
          ));
        }
      }

      // SÉCURITÉ CRITIQUE : Ne JAMAIS envoyer la clé de chiffrement sur Firebase
      delete projectToSync.encryptionKey;

      // Ajout des métadonnées de synchronisation
      projectToSync.lastSyncedAt = new Date().toISOString();
      projectToSync.source = 'firebase';

      if (!projectToSync.ownerId) {
        projectToSync.ownerId = auth.currentUser.uid;
      }

      if (!projectToSync.members || !projectToSync.members.includes(auth.currentUser.uid)) {
        projectToSync.members = [...(projectToSync.members || []), auth.currentUser.uid];
      }

      // 1. Sauvegarde du document principal du projet
      await setDoc(doc(db, 'projects', project.id), projectToSync, { merge: true });

      // 2. Si syncVersion >= 2, on synchronise aussi chaque tâche individuellement dans la sous-collection
      // Cela permet d'éviter les conflits lors de modifications simultanées
      if (projectToSync.syncVersion >= 2 && project.tasks) {
        await Promise.all(project.tasks.map(task => 
          this.syncTask(project.id, task, project.encryptionKey)
        ));
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation du projet:", error);
      throw error;
    }
  },

  /**
   * Chiffre une tâche individuelle
   */
  async encryptTask(task: Task, key: string): Promise<Task> {
    const encryptedTask = { ...task };
    encryptedTask.title = await EncryptionService.encrypt(task.title, key);
    encryptedTask.description = await EncryptionService.encrypt(task.description, key);
    encryptedTask.notes = task.notes ? await EncryptionService.encrypt(task.notes, key) : task.notes;
    
    if (task.subTasks) {
      encryptedTask.subTasks = await Promise.all(task.subTasks.map(async st => ({
        ...st,
        title: await EncryptionService.encrypt(st.title, key)
      })));
    }
    return encryptedTask;
  },

  /**
   * Synchronise une tâche individuelle dans la sous-collection du projet
   */
  async syncTask(projectId: string, task: Task, encryptionKey?: string): Promise<void> {
    if (!ensureInitialized() || !auth.currentUser) return;

    try {
      let taskToSync = { ...task };
      
      // Chiffrement si nécessaire
      if (encryptionKey) {
        taskToSync = await this.encryptTask(task, encryptionKey);
      }

      taskToSync.updatedAt = new Date().toISOString();
      
      // Sauvegarde dans projects/{projectId}/tasks/{taskId}
      const taskRef = doc(db, 'projects', projectId, 'tasks', task.id);
      await setDoc(taskRef, taskToSync, { merge: true });
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de la tâche ${task.id}:`, error);
    }
  },

  /**
   * Supprime une tâche du Cloud
   */
  async deleteCloudTask(projectId: string, taskId: string): Promise<void> {
    if (!ensureInitialized() || !auth.currentUser) return;
    try {
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error(`Erreur lors de la suppression de la tâche ${taskId}:`, error);
    }
  },

  /**
   * Déchiffre un projet venant de Firebase
   */
  async decryptProject(project: Project, localKey?: string): Promise<Project> {
    const key = localKey || project.encryptionKey;
    if (!project.isEncryptionEnabled || !key) return project;

    try {
      const decrypted = { ...project };
      decrypted.name = await EncryptionService.decrypt(project.name, key);
      decrypted.description = await EncryptionService.decrypt(project.description, key);
      decrypted.encryptionKey = key; // On s'assure de garder la clé pour le prochain sync

      if (decrypted.tasks) {
        decrypted.tasks = await Promise.all(decrypted.tasks.map(async (task: Task) => ({
          ...task,
          title: await EncryptionService.decrypt(task.title, key),
          description: await EncryptionService.decrypt(task.description, key),
          notes: task.notes ? await EncryptionService.decrypt(task.notes, key) : task.notes,
          subTasks: task.subTasks ? await Promise.all(task.subTasks.map(async st => ({
            ...st,
            title: await EncryptionService.decrypt(st.title, key)
          }))) : task.subTasks
        })));
      }

      return decrypted;
    } catch (error) {
      console.error("[E2EE] Erreur lors du déchiffrement du projet:", error);
      return project;
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
      const projects = await Promise.all(querySnapshot.docs.map(async doc => {
        const data = doc.data({ serverTimestamps: 'estimate' });
        const projectId = doc.id;

        // Récupérer les tâches de la sous-collection pour getSharedProjects
        const tasksRef = collection(db, 'projects', projectId, 'tasks');
        const tasksSnapshot = await getDocs(tasksRef);
        const subTasks = tasksSnapshot.docs.map(tDoc => tDoc.data() as Task);

        const tasks = subTasks.length > 0 ? subTasks : (data.tasks || []);

        return {
          ...data,
          id: projectId,
          tasks,
          source: 'firebase', // Force la source
          lastActivityAt: data.lastActivityAt?.toDate ? data.lastActivityAt.toDate().toISOString() : data.lastActivityAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
        } as Project;
      }));
      return projects;
    } catch (error) {
      console.error("Erreur lors de la récupération des projets partagés:", error);
      return [];
    }
  },

  /**
   * Écoute les mises à jour en temps réel de tous les projets partagés avec l'utilisateur
   */
  onSharedProjectsUpdate(uid: string, callback: (projects: Project[]) => void) {
    if (!ensureInitialized()) return () => { };

    const q = query(
      collection(db, 'projects'),
      where('members', 'array-contains', uid)
    );

    const unsubscribeProjects = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach(doc => {
        const projectId = doc.id;

        // Mise à jour de la liste des listeners de tâches pour ce snapshot
        this.setupTaskListener(projectId, () => {
          // Quand les tâches d'un projet changent, on déclenche une nouvelle mise à jour globale
          this.triggerProjectsUpdate(snapshot, callback);
        });
      });

      this.triggerProjectsUpdate(snapshot, callback);
    }, (error) => {
      console.error("Erreur lors de l'écoute des projets partagés:", error);
    });

    return () => {
      unsubscribeProjects();
      // Nettoyage de tous les listeners de tâches
      Object.values(projectTaskListeners).forEach(unsub => unsub());
      for (const key in projectTaskListeners) delete projectTaskListeners[key];
    };
  },

  /**
   * Helper pour transformer un document Firestore en objet Project
   */
  mapProjectDoc(doc: any): Project {
    const data = doc.data({ serverTimestamps: 'estimate' });
    const projectId = doc.id;
    
    // On récupère les tâches depuis le cache (sous-collection v2) 
    // ou on utilise celles du document principal (v1)
    const tasksFromSubcollection = projectTasksCache[projectId];
    const tasks = (tasksFromSubcollection && tasksFromSubcollection.length > 0) 
      ? tasksFromSubcollection 
      : (data.tasks || []);

    return {
      ...data,
      id: projectId,
      tasks: tasks,
      source: 'firebase',
      lastActivityAt: data.lastActivityAt?.toDate ? data.lastActivityAt.toDate().toISOString() : data.lastActivityAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
    } as Project;
  },

  /**
   * Déclenche une mise à jour globale avec les données fusionnées
   */
  triggerProjectsUpdate(snapshot: any, callback: (projects: Project[]) => void) {
    const projects = snapshot.docs.map((doc: any) => this.mapProjectDoc(doc));
    callback(projects);
  },

  /**
   * Configure un listener pour la sous-collection de tâches d'un projet
   */
  setupTaskListener(projectId: string, onTasksUpdate: (tasks: Task[]) => void) {
    if (projectTaskListeners[projectId]) return;

    const tasksRef = collection(db, 'projects', projectId, 'tasks');
    projectTaskListeners[projectId] = onSnapshot(tasksRef, (snapshot) => {
      const tasks = snapshot.docs.map(doc => doc.data() as Task);
      projectTasksCache[projectId] = tasks;
      onTasksUpdate(tasks);
    }, (error) => {
      console.error(`Erreur listener tâches projet ${projectId}:`, error);
    });
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
   * Connexion anonyme pour permettre l'accès aux ressources publiques Firestore
   * sans nécessiter que l'utilisateur soit connecté avec un compte Google.
   */
  async ensurePublicAccess(): Promise<void> {
    if (!isFirebaseConfigured()) return;
    await ensureInitialized();
    // Si aucun utilisateur (même anonyme) n'est connecté, on connecte anonymement
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
        console.log('[PublicView] Connexion anonyme Firebase établie pour accès public');
      } catch (error) {
        // L'accès anonyme peut être désactivé dans la console Firebase.
        // Dans ce cas on continue quand même — les règles Firestore
        // basées sur isPublic==true peuvent parfois fonctionner sans auth.
        console.warn('[PublicView] Connexion anonyme échouée (peut-être désactivée):', error);
      }
    }
  },

  /**
   * Écoute les mises à jour en temps réel d'un projet public
   */
  onPublicProjectUpdate: (projectId: string, callback: (project: Project | null) => void) => {
    if (!isFirebaseConfigured()) return () => { };

    let unsubscribeProject: (() => void) | null = null;
    let unsubscribeTasks: (() => void) | null = null;
    let projectDoc: Project | null = null;
    let projectTasks: Task[] = [];
    let cancelled = false;

    const handleUpdate = () => {
      if (projectDoc) {
        callback({
          ...projectDoc,
          tasks: projectTasks.length > 0 ? projectTasks : (projectDoc.tasks || []),
          source: 'firebase'
        });
      } else {
        callback(null);
      }
    };

    const startListening = () => {
      if (cancelled) return;

      unsubscribeProject = onSnapshot(doc(db, 'projects', projectId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Project;
          if (data.isPublic) {
            projectDoc = data;

            // Si le projet utilise la version 2 de sync, on écoute aussi les tâches
            if (data.syncVersion >= 2 && !unsubscribeTasks) {
              const tasksRef = collection(db, 'projects', projectId, 'tasks');
              unsubscribeTasks = onSnapshot(tasksRef, (tasksSnapshot) => {
                projectTasks = tasksSnapshot.docs.map(tDoc => tDoc.data() as Task);
                handleUpdate();
              }, (error) => {
                console.error("Erreur listener tâches publiques:", error);
              });
            }

            handleUpdate();
          } else {
            projectDoc = null;
            handleUpdate();
          }
        } else {
          projectDoc = null;
          handleUpdate();
        }
      }, (error) => {
        console.error("Erreur lors de l'écoute du projet public:", error);
        callback(null);
      });
    };

    // On s'assure d'avoir une identité Firebase (même anonyme) avant d'écouter
    ensureInitialized().then(() => {
      if (cancelled) return;
      if (!auth.currentUser) {
        signInAnonymously(auth)
          .then(() => startListening())
          .catch(() => {
            // Même si la connexion anonyme échoue, on tente quand même
            console.warn('[PublicView] Connexion anonyme échouée, tentative sans auth...');
            startListening();
          });
      } else {
        startListening();
      }
    });

    return () => {
      cancelled = true;
      if (unsubscribeProject) unsubscribeProject();
      if (unsubscribeTasks) unsubscribeTasks();
    };
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

  /**
   * Quitte un projet partagé (se retire de la liste des membres)
   */
  leaveProject: async (projectId: string): Promise<void> => {
    if (!ensureInitialized()) throw new Error("Firebase n'est pas initialisé");
    if (!auth.currentUser) throw new Error("Vous devez être connecté");

    try {
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (!projectDoc.exists()) return;

      const projectData = projectDoc.data() as Project;
      const updatedMembers = (projectData.members || []).filter(uid => uid !== auth.currentUser.uid);
      const updatedRoles = { ...(projectData.memberRoles || {}) };
      delete updatedRoles[auth.currentUser.uid];

      await setDoc(doc(db, 'projects', projectId), {
        members: updatedMembers,
        memberRoles: updatedRoles,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error("Erreur lors de l'abandon du projet:", error);
      throw error;
    }
  },
};

// Exporter les instances pour les autres services
export { db, auth, app };
