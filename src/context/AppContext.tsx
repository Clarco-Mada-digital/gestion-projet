import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { AppState, AppAction } from '../types';
import { firebaseService } from '../services/collaboration/firebaseService';
import { EncryptionService } from '../services/security/encryptionService';
import { User as FirebaseUser } from 'firebase/auth';
import { initialState } from './initialState';
import { appReducer } from './appReducer';

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);

  // ─── Effet 1 : Sauvegarde locale (localStorage) avec debounce ─────────────
  useEffect(() => {
    // Ne pas sauvegarder pendant le chargement initial
    if (state.isLoading) return;
    // Ne pas sauvegarder au premier render après chargement (évite d'écraser avec état vide)
    if (isInitialLoadRef.current) return;

    // Debounce: attendre 1s de calme avant de sauvegarder (évite les I/O excessifs)
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      try {
        // Chiffrement « au repos » des clés API IA : on ne persiste jamais les clés en clair.
        // Le state en mémoire reste inchangé (clones uniquement) pour ne rien casser côté UI/IA.
        let appSettingsToSave = state.appSettings;
        const ai = state.appSettings?.aiSettings;
        if (ai) {
          try {
            const deviceKey = await EncryptionService.getDeviceKey();
            appSettingsToSave = {
              ...state.appSettings,
              aiSettings: {
                ...ai,
                openaiApiKey: await EncryptionService.encryptSecret(ai.openaiApiKey, deviceKey),
                openrouterApiKey: await EncryptionService.encryptSecret(ai.openrouterApiKey, deviceKey),
                geminiApiKey: await EncryptionService.encryptSecret(ai.geminiApiKey, deviceKey),
              }
            };
          } catch (e) {
            // En cas d'échec du chiffrement, on retombe sur l'ancien comportement (clés en clair)
            // plutôt que de perdre la sauvegarde.
            console.warn('[Sécurité] Chiffrement des clés API ignoré:', e);
            appSettingsToSave = state.appSettings;
          }
        }
        const dataToSave = {
          // Sauvegarder TOUS les projets (locaux ET firebase) pour le mode hors-ligne
          projects: state.projects,
          users: state.users,
          theme: state.theme,
          emailSettings: state.emailSettings,
          appSettings: appSettingsToSave,
          reports: state.reports,
          visionDossiers: state.visionDossiers,
          version: '1.0.0',
          exportedAt: new Date().toISOString()
        };
        localStorage.setItem('astroProjectManagerData', JSON.stringify(dataToSave));
      } catch (error) {
        // Détection explicite du dépassement de quota (limite ~5 Mo de localStorage).
        // Sans cela, la sauvegarde échoue silencieusement et les données récentes sont perdues.
        const isQuota =
          error instanceof DOMException &&
          (error.name === 'QuotaExceededError' ||
            error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
        if (isQuota) {
          console.error(
            '[Stockage] Quota localStorage dépassé : les dernières modifications n\'ont pas pu être sauvegardées. ' +
            'Migration vers IndexedDB recommandée (voir AUDIT.md / OFF-1).'
          );
          // Évènement écoutable par l'UI pour avertir l'utilisateur (ex: toast).
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('storage-quota-exceeded'));
          }
        } else {
          console.error('Erreur lors de la sauvegarde locale:', error);
        }
      }
    }, 1000);
  }, [state.projects, state.users, state.theme, state.emailSettings, state.appSettings, state.isLoading, state.reports, state.visionDossiers]);

  // ─── Effet 2 : Chargement initial ───────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedData = localStorage.getItem('astroProjectManagerData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          // Déchiffrement des clés API stockées localement (tolère le clair = anciens utilisateurs).
          const ai = parsedData?.appSettings?.aiSettings;
          if (ai) {
            try {
              const deviceKey = await EncryptionService.getDeviceKey();
              ai.openaiApiKey = await EncryptionService.decryptSecret(ai.openaiApiKey, deviceKey);
              ai.openrouterApiKey = await EncryptionService.decryptSecret(ai.openrouterApiKey, deviceKey);
              ai.geminiApiKey = await EncryptionService.decryptSecret(ai.geminiApiKey, deviceKey);
            } catch (e) {
              console.warn('[Sécurité] Déchiffrement des clés API ignoré:', e);
            }
          }
          dispatch({ type: 'INIT_STATE', payload: parsedData });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        // Marquer la fin du chargement initial: autoriser la sauvegarde à partir de maintenant
        // On utilise un petit délai pour laisser le reducer traiter INIT_STATE d'abord
        setTimeout(() => { isInitialLoadRef.current = false; }, 500);
      }
    };

    loadData();
  }, []);

  // ─── Effet 2bis : Persistance du stockage (anti-éviction hors-ligne) ─────
  // Demande au navigateur de ne PAS effacer automatiquement nos données locales
  // sous pression de stockage. Additif et sans effet de bord sur l'état de l'app.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return;
    navigator.storage.persisted().then((already) => {
      if (!already) {
        navigator.storage.persist().then((granted) => {
          console.log(`[Stockage] Persistance ${granted ? 'accordée' : 'refusée'} par le navigateur.`);
        });
      }
    }).catch(() => { /* API non disponible : ignorer silencieusement */ });
  }, []);

  // ─── Effet 3 : Synchronisation Firebase (ÉCOUTE EN TEMPS RÉEL) ──────────
  useEffect(() => {
    let unsubscribeProjects: (() => void) | null = null;
    // Référence aux derniers projets Firebase reçus pour éviter les dispatches inutiles
    const lastSyncedProjectsRef: { ids: string; hash: string } = { ids: '', hash: '' };

    const setupSync = (user: FirebaseUser) => {
      // 1. Sauver le profil (en arrière-plan, sans bloquer)
      firebaseService.saveUserProfile(user).catch(e => console.warn("[Cloud] Profil non sauvé:", e));

      // 2. Écouter les projets partagés
      unsubscribeProjects = firebaseService.onSharedProjectsUpdate(user.uid, (sharedProjects) => {
        if (sharedProjects.length === 0) return; // Ne pas dispatcher une liste vide

        // Créer une signature pour détecter si les données ont réellement changé
        const newIds = sharedProjects.map(p => p.id).sort().join(',');
        const newHash = sharedProjects.map(p => `${p.id}:${p.updatedAt}:${p.tasks?.length ?? 0}`).sort().join('|');

        if (lastSyncedProjectsRef.ids === newIds && lastSyncedProjectsRef.hash === newHash) {
          // Aucun changement réel, ne pas dispatcher (évite les boucles)
          return;
        }
        lastSyncedProjectsRef.ids = newIds;
        lastSyncedProjectsRef.hash = newHash;

        console.log(`[Cloud Sync] ${sharedProjects.length} projets reçus (avec changements)`);
        
        // Déchiffrement asynchrone
        Promise.all(sharedProjects.map(async (p) => {
          const localKey = EncryptionService.getProjectKey(p.id);
          if (p.isEncryptionEnabled && localKey) {
            return await firebaseService.decryptProject(p, localKey);
          }
          return p;
        })).then(decryptedProjects => {
          dispatch({ type: 'SYNC_PROJECTS', payload: decryptedProjects });
        }).catch(err => console.error("[Cloud Sync] Erreur déchiffrement:", err));
      });
    };

    const unsubscribeAuth = firebaseService.onAuthStateChange((user) => {
      dispatch({ type: 'SET_CLOUD_USER', payload: user });

      if (unsubscribeProjects) {
        unsubscribeProjects();
        unsubscribeProjects = null;
        // Reset de la signature pour forcer un dispatch lors de la prochaine connexion
        lastSyncedProjectsRef.ids = '';
        lastSyncedProjectsRef.hash = '';
      }

      if (user) {
        setupSync(user);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProjects) unsubscribeProjects();
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, []);

  // ─── Effet 4 : Thème et Styles globaux ──────────────────────────────────
  useEffect(() => {
    // Gestion du thème
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Gestion de la police et taille
    const fontName = state.appSettings?.fontFamily || 'Inter';
    const fontSize = state.appSettings?.fontSize || 'medium';
    
    let fontBase = '16px';
    if (fontSize === 'small') fontBase = '14px';
    if (fontSize === 'large') fontBase = '18px';

    const styleContent = `
      @import url('https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap');
      
      html {
        font-size: ${fontBase} !important;
      }
      
      body, button, input, select, textarea, .font-sans {
        font-family: "${fontName}", sans-serif !important;
      }
    `;

    const existingStyle = document.getElementById('dynamic-font-style');
    if (existingStyle) {
      existingStyle.innerHTML = styleContent;
    } else {
      const style = document.createElement('style');
      style.id = 'dynamic-font-style';
      style.innerHTML = styleContent;
      document.head.appendChild(style);
    }
  }, [state.theme, state.appSettings?.fontFamily, state.appSettings?.fontSize]);

  const value = React.useMemo(() => ({ state, dispatch }), [state]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};