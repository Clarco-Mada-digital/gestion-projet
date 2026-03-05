// Service de gestion hors-ligne avec IndexedDB
import { Project, Task, User } from '../../types';

export interface OfflineData {
  projects: Project[];
  tasks: Task[];
  users: User[];
  settings: any;
  lastSync: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'project' | 'task' | 'user';
  data: any;
  timestamp: string;
  synced: boolean;
}

class OfflineService {
  private static instance: OfflineService;
  private dbName = 'GestionProjetOffline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private syncQueue: SyncQueueItem[] = [];

  private constructor() {
    this.initDB();
  }

  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Erreur lors de l\'ouverture de la base de données');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Base de données IndexedDB initialisée');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Créer les object stores
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncQueueStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  // Vérifier si nous sommes en ligne
  public isOnline(): boolean {
    return navigator.onLine;
  }

  // Sauvegarder un projet localement
  public async saveProject(project: Project): Promise<void> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['projects', 'syncQueue'], 'readwrite');
    const projectsStore = transaction.objectStore('projects');
    const syncQueueStore = transaction.objectStore('syncQueue');

    // Sauvegarder le projet
    await new Promise<void>((resolve, reject) => {
      const request = projectsStore.put(project);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Ajouter à la file de synchronisation
    if (project.source !== 'local') {
      const syncItem: SyncQueueItem = {
        id: `project-${project.id}-${Date.now()}`,
        type: 'update',
        entityType: 'project',
        data: project,
        timestamp: new Date().toISOString(),
        synced: false
      };

      await new Promise<void>((resolve, reject) => {
        const request = syncQueueStore.put(syncItem);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log('Projet sauvegardé localement:', project.name);
  }

  // Sauvegarder une tâche localement
  public async saveTask(task: Task): Promise<void> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['tasks', 'syncQueue'], 'readwrite');
    const tasksStore = transaction.objectStore('tasks');
    const syncQueueStore = transaction.objectStore('syncQueue');

    // Sauvegarder la tâche
    await new Promise<void>((resolve, reject) => {
      const request = tasksStore.put(task);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Ajouter à la file de synchronisation
    if (task.source !== 'local') {
      const syncItem: SyncQueueItem = {
        id: `task-${task.id}-${Date.now()}`,
        type: 'update',
        entityType: 'task',
        data: task,
        timestamp: new Date().toISOString(),
        synced: false
      };

      await new Promise<void>((resolve, reject) => {
        const request = syncQueueStore.put(syncItem);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log('Tâche sauvegardée localement:', task.title);
  }

  // Récupérer tous les projets locaux
  public async getLocalProjects(): Promise<Project[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Récupérer toutes les tâches locales
  public async getLocalTasks(): Promise<Task[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tasks'], 'readonly');
      const store = transaction.objectStore('tasks');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Récupérer la file de synchronisation
  public async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      
      // Vérifier si l'index existe avant de l'utiliser
      let request;
      if (store.indexNames.contains('synced')) {
        const index = store.index('synced');
        request = index.getAll(false);
      } else {
        // Fallback: utiliser getAll et filtrer manuellement
        request = store.getAll();
      }

      request.onsuccess = () => {
        if (store.indexNames.contains('synced')) {
          resolve(request.result || []);
        } else {
          // Filtrer manuellement si l'index n'existe pas
          const allItems = request.result || [];
          const unsyncedItems = allItems.filter((item: any) => !item.synced);
          resolve(unsyncedItems);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Marquer un élément comme synchronisé
  public async markAsSynced(syncItemId: string): Promise<void> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    await new Promise<void>((resolve, reject) => {
      const request = store.get(syncItemId);
      request.onsuccess = () => {
        const item = request.result;
        if (item) {
          item.synced = true;
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Nettoyer les éléments synchronisés
  public async cleanupSyncedItems(): Promise<void> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const index = store.index('synced');
    const request = index.openCursor(IDBKeyRange.only(true));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }

  // Synchroniser les données locales avec le serveur
  public async syncWithServer(): Promise<void> {
    if (!this.isOnline()) {
      console.log('Hors-ligne : synchronisation différée');
      return;
    }

    const syncQueue = await this.getSyncQueue();
    console.log(`Synchronisation de ${syncQueue.length} éléments`);

    for (const item of syncQueue) {
      try {
        await this.syncItem(item);
        await this.markAsSynced(item.id);
      } catch (error) {
        console.error(`Erreur de synchronisation pour ${item.id}:`, error);
      }
    }

    // Nettoyer les éléments synchronisés
    await this.cleanupSyncedItems();

    // Mettre à jour le timestamp de dernière synchronisation
    await this.updateLastSyncTime();

    console.log('Synchronisation terminée');
  }

  // Synchroniser un élément individuel
  private async syncItem(item: SyncQueueItem): Promise<void> {
    const url = `/api/${item.entityType}s`;
    const method = item.type === 'create' ? 'POST' : item.type === 'delete' ? 'DELETE' : 'PUT';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item.data)
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    console.log(`Élément synchronisé: ${item.id}`);
  }

  // Mettre à jour le timestamp de dernière synchronisation
  private async updateLastSyncTime(): Promise<void> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['metadata'], 'readwrite');
    const store = transaction.objectStore('metadata');

    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        key: 'lastSync',
        value: new Date().toISOString()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Récupérer le timestamp de dernière synchronisation
  public async getLastSyncTime(): Promise<string | null> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get('lastSync');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sauvegarder les paramètres localement
  public async saveSettings(settings: any): Promise<void> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');

    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        key: 'appSettings',
        value: settings
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Récupérer les paramètres locaux
  public async getSettings(): Promise<any> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get('appSettings');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Exporter toutes les données locales
  public async exportData(): Promise<OfflineData> {
    const [projects, tasks, users, settings, lastSync] = await Promise.all([
      this.getLocalProjects(),
      this.getLocalTasks(),
      this.getUsers(),
      this.getSettings(),
      this.getLastSyncTime()
    ]);

    return {
      projects,
      tasks,
      users,
      settings,
      lastSync: lastSync || new Date(0).toISOString()
    };
  }

  // Importer des données
  public async importData(data: OfflineData): Promise<void> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['projects', 'tasks', 'users', 'settings'], 'readwrite');
    
    // Importer les projets
    const projectsStore = transaction.objectStore('projects');
    for (const project of data.projects) {
      await new Promise<void>((resolve, reject) => {
        const request = projectsStore.put(project);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    // Importer les tâches
    const tasksStore = transaction.objectStore('tasks');
    for (const task of data.tasks) {
      await new Promise<void>((resolve, reject) => {
        const request = tasksStore.put(task);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    // Importer les utilisateurs
    const usersStore = transaction.objectStore('users');
    for (const user of data.users) {
      await new Promise<void>((resolve, reject) => {
        const request = usersStore.put(user);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    // Importer les paramètres
    if (data.settings) {
      const settingsStore = transaction.objectStore('settings');
      await new Promise<void>((resolve, reject) => {
        const request = settingsStore.put({
          key: 'appSettings',
          value: data.settings
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log('Données importées avec succès');
  }

  // Récupérer les utilisateurs locaux
  private async getUsers(): Promise<User[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Vider toutes les données locales
  public async clearAllData(): Promise<void> {
    if (!this.db) await this.initDB();

    const stores = ['projects', 'tasks', 'users', 'settings', 'syncQueue', 'metadata'];
    
    for (const storeName of stores) {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log('Toutes les données locales ont été effacées');
  }

  // Obtenir des statistiques sur les données locales
  public async getOfflineStats(): Promise<{
    projectsCount: number;
    tasksCount: number;
    pendingSyncCount: number;
    lastSyncTime: string | null;
  }> {
    const [projects, tasks, syncQueue, lastSync] = await Promise.all([
      this.getLocalProjects(),
      this.getLocalTasks(),
      this.getSyncQueue(),
      this.getLastSyncTime()
    ]);

    return {
      projectsCount: projects.length,
      tasksCount: tasks.length,
      pendingSyncCount: syncQueue.length,
      lastSyncTime
    };
  }
}

export default OfflineService;
