# 🔍 Audit du projet — GestionProjet

> Audit réalisé le **2026-06-21**
> Périmètre : architecture **offline-first**, sécurité, performance.
> Stack : Astro 5 (static) + React 18 + Redux Toolkit + Firebase + PWA (`@vite-pwa/astro`).

## 📌 Journal d'avancement
- **2026-06-21** — ✅ SEC-1 : `firestore.rules` durci (propriétaire/membre). ⚠️ **Non déployé** : à valider dans le bac à sable de la console Firebase puis `firebase deploy --only firestore:rules`. Vigilance : projets anciens sans `ownerId`/`members`.
- **2026-06-21** — ✅ OFF-1 (mitigation immédiate, sans régression) : `navigator.storage.persist()` + gestion explicite du dépassement de quota dans `AppContext.tsx` (évènement `storage-quota-exceeded`). Le refactor IndexedDB complet reste à faire (dépend des décisions ci-dessous).
- **2026-06-21** — ✅ Offline natif : persistance Firestore (`persistentLocalCache` + multi-onglets, repli sûr) dans `firebaseService.ts` ; fin de la double-init Firebase (`getApps()`) dans `cloudinaryService.ts` / `firebaseStorageService.ts`. Build prod OK (exit 0).
- **2026-06-21** — ✅ SEC-2 : chiffrement « au repos » des clés API IA (OpenAI/Gemini/OpenRouter) dans `localStorage`. Clé de chiffrement propre à l'appareil (`app_device_key`). **Rétrocompatible** : clés en clair des utilisateurs existants détectées et conservées, puis chiffrées à la sauvegarde suivante ; jamais de perte de clé (repli systématique). State en mémoire inchangé. Fichiers : `encryptionService.ts`, `AppContext.tsx`.
  - ℹ️ Limite assumée (app 100% client) : une XSS exécutée sur l'origine peut toujours lire la clé d'appareil. Le chiffrement protège surtout contre l'inspection passive du `localStorage` (machine partagée, sauvegarde, extension). Protection forte = proxy serverless (écartée pour rester sans backend).
- Validé par `astro check` : 0 erreur.

---

## 🎯 Objectif prioritaire : « offline-first »

Tu veux que l'app **fonctionne hors-ligne en priorité**, en s'appuyant sur des données locales,
et que l'en-ligne (Firebase) soit un complément/synchro. Aujourd'hui le projet est **à mi-chemin**,
et il y a une incohérence importante à corriger (voir 🔴 OFF-1).

---

## 🔴 Problèmes CRITIQUES (à traiter en premier)

### SEC-1 — Règles Firestore ouvertes à tous (fuite de données)
**Fichier : `firestore.rules`**

```
allow read, write: if isAuthenticated();
```

Combiné avec l'**authentification anonyme** activée (`signInAnonymously` dans `firebaseService.ts`),
cela signifie que **n'importe quel visiteur** peut lire, modifier et **supprimer TOUS les projets,
tâches, utilisateurs, commentaires de TOUS les utilisateurs**. C'est la faille la plus grave du projet.

**Impact :** fuite totale de données, suppression malveillante possible.
**Correctif :** restreindre l'accès au propriétaire / aux membres du projet.

```javascript
match /projects/{projectId} {
  allow get: if resource.data.get('isPublic', false) == true
             || (isAuthenticated() && request.auth.uid in resource.data.members);
  allow list, update, delete: if isAuthenticated()
             && request.auth.uid in resource.data.members;
  allow create: if isAuthenticated()
             && request.auth.uid in request.resource.data.members;
}
match /users/{userId} {
  allow read: if isAuthenticated();
  allow write: if isAuthenticated() && request.auth.uid == userId; // chacun n'écrit que SON profil
}
```
→ Nécessite d'avoir un champ `members: [uid, ...]` (ou `ownerId`) sur chaque projet.

---

### SEC-2 — Clés API IA stockées en clair dans `localStorage`
Les clés OpenAI / Gemini / OpenRouter font partie de `appSettings.aiSettings`
(`types/index.ts`, `initialState.ts`) et sont sérialisées en clair dans
`localStorage['astroProjectManagerData']` via `AppContext.tsx`.

**Impact :** toute faille XSS = vol des clés API (= facturation à ta charge).
**Pistes :**
- Ne **jamais** committer/exposer une vraie clé ; privilégier le **mode anonyme/proxy**.
- Idéalement, router les appels IA via une **fonction serverless** (proxy) qui détient la clé,
  pour ne jamais l'exposer côté client.
- À minima : chiffrer la clé au repos (réutiliser `EncryptionService`) et avertir l'utilisateur.

---

### OFF-1 — Deux systèmes de stockage qui ne communiquent pas
C'est le point clé pour ton objectif offline-first.

| Système | Fichier | Statut réel |
|--------|---------|-------------|
| **localStorage** (état complet en JSON) | `AppContext.tsx` | ✅ **C'est la vraie source de vérité** |
| **IndexedDB** (`OfflineService`) | `services/offline/offlineService.ts` | ⚠️ **Code orphelin / mort** |

`OfflineService` est bien écrit (stores, sync queue…) **mais** :
- Il n'est **jamais branché** sur l'`AppContext`/le reducer.
- Sa synchro envoie vers `/api/projects`, `/api/tasks`… **qui n'existent pas** (`output: 'static'`, hébergé sur GitHub Pages → pas de backend). → la sync queue ne part nulle part.

**Conséquence :** tout l'état (projets + tâches + rapports + visionDossiers) tient dans **une seule clé localStorage**, limitée à **~5 Mo**. Au-delà, `setItem` lève une exception → **perte de sauvegarde silencieuse** (juste un `console.error`).

**Recommandation (cœur de l'offline-first) :**
1. Faire d'**IndexedDB la source de vérité locale** (pas de limite 5 Mo, asynchrone, supporte les blobs/pièces jointes).
2. Brancher `OfflineService` sur le reducer (charger au démarrage, persister à chaque mutation).
3. Garder `localStorage` uniquement pour les petites préférences (thème, filtres de vue…).
4. Remplacer la fausse sync `/api/*` par la **vraie synchro Firebase** déjà présente (`firebaseService`), pilotée par `navigator.onLine` + file d'attente IndexedDB pour rejouer les mutations au retour du réseau.

→ Alternative plus rapide à mettre en œuvre : **activer la persistance offline native de Firestore**
(`enableIndexedDbPersistence` / cache local Firestore), qui gère déjà le cache hors-ligne et la
re-synchro automatiquement. À évaluer selon l'effort souhaité.

---

## 🟠 Problèmes importants

### PERF-1 — Bundle JavaScript énorme (plusieurs librairies UI redondantes)
Le projet embarque **en même temps** :
`@mui/material` **ET** `antd` **ET** `tailwindcss` **ET** `styled-components` **ET** `@emotion`,
plus `framer-motion`, `react-beautiful-dnd`, `react-syntax-highlighter`, `firebase` complet.

Preuve dans le code : dans `astro.config.mjs`, `maximumFileSizeToCacheInBytes` a dû être monté à **5 Mo**
« car le bundle principal dépasse les 2 Mo ». C'est très lourd, surtout pour une PWA censée démarrer vite hors-ligne.

**Pistes :**
- **Choisir UN système d'UI principal** (Tailwind est déjà là) et retirer progressivement MUI **ou** Antd. Avoir les deux double le poids.
- `react-beautiful-dnd` n'est plus maintenu → migrer vers `@dnd-kit`.
- Importer Firebase de façon modulaire (déjà le cas via `firebase/firestore`, `firebase/auth` ✅) — vérifier qu'aucun `import firebase from 'firebase'` global ne traîne.
- Charger en **lazy** (`React.lazy`) les vues lourdes (`ReportView`, `VisionView`, `Chatbot`, `CalendarView`, l'éditeur markdown).

### PERF-2 — Contexte React global = re-render de toute l'app
`AppContext` expose `{ state, dispatch }` mémoïsé sur `state` entier. **Toute** mutation
(même une seule tâche) provoque un nouvel objet `state` → **tous les consommateurs re-rendent**.
Avec `ProjectsView.tsx` à **3584 lignes**, ça se sentira.

**Pistes :** séparer state/dispatch en deux contextes, ou utiliser des sélecteurs ;
le projet a déjà `@reduxjs/toolkit` + `react-redux` installés mais le state principal passe par un `useReducer` maison → **dédoublement**. Choisir l'un des deux.

### PERF-3 — Persistance localStorage = sérialisation de tout l'état
À chaque modif (debounce 1 s), `JSON.stringify` de **tout** (`projects`, `users`, `reports`,
`visionDossiers`…). Coûteux quand les données grossissent, et bloque le thread principal.
→ Résolu naturellement en passant à IndexedDB avec écritures granulaires (OFF-1).

### SEC-3 — Clés E2EE en clair dans localStorage
`EncryptionService.saveProjectKey` stocke les clés de chiffrement dans
`localStorage['project_e2ee_keys']` en clair. Le chiffrement « E2EE » protège les données *sur le serveur*,
mais une XSS locale récupère les clés. À documenter comme limite connue, ou dériver la clé d'un mot de passe utilisateur (PBKDF2) non stocké.

### SEC-4 — Échec de déchiffrement silencieux
`EncryptionService.decrypt` renvoie les **données brutes** en cas d'échec (`catch → return hexData`).
Pratique pour la rétrocompat, mais peut **masquer une corruption** ou afficher du hex à l'utilisateur. Distinguer « non chiffré » de « mauvaise clé ».

---

## 🟡 Améliorations recommandées

- **SEC-5 — XSS via Markdown :** `react-markdown` + `@uiw/react-md-editor` + `react-syntax-highlighter`.
  Vérifier qu'on n'utilise pas `rehype-raw`/`dangerouslySetInnerHTML` sans sanitisation (`rehype-sanitize`).
- **QUAL-1 — Aucun test** (`*.test.*` introuvable). Ajouter au moins des tests sur le reducer
  (`appReducer.ts`, ~20 Ko de logique métier) et le chiffrement.
- **QUAL-2 — Fichiers monolithes :** `ProjectsView.tsx` (3584 l.), `aiService.ts` (1448 l.),
  `CalendarView.tsx` (1655 l.). À découper pour la maintenabilité.
- **QUAL-3 — Logs en production :** beaucoup de `console.log` (sync, Firebase…). Les retirer en prod
  (fuite d'infos + bruit) via le `errorHandler` déjà présent.
- **PWA-1 — Quota de stockage :** implémenter `navigator.storage.persist()` pour éviter que le
  navigateur n'efface les données offline, et afficher l'espace restant (`storage.estimate()`).
- **PWA-2 — Stratégie de cache :** vérifier dans `sw.js` que les appels Firestore/IA passent en
  `NetworkOnly` (pas de cache de données sensibles) et que l'app-shell est en `CacheFirst`.
- **CONF-1 — Sentry :** `@sentry/react` est installé — confirmer que le DSN n'est pas en dur et que
  les données utilisateurs ne sont pas envoyées par erreur (RGPD).

---

## 🗺️ Plan d'action proposé (par ordre de priorité)

| # | Action | Catégorie | Effort | Impact |
|---|--------|-----------|--------|--------|
| 1 | Corriger `firestore.rules` (membres/propriétaire) | 🔴 Sécurité | Moyen | **Critique** |
| 2 | Sortir les clés API IA du localStorage / proxy | 🔴 Sécurité | Moyen | Élevé |
| 3 | Unifier le stockage offline sur IndexedDB + synchro Firebase réelle | 🔴 Offline | Élevé | **Cœur de l'objectif** |
| 4 | Activer `storage.persist()` + gérer le quota | 🟡 PWA | Faible | Élevé |
| 5 | Réduire le bundle (1 seule lib UI, lazy-loading) | 🟠 Perf | Moyen | Élevé |
| 6 | Choisir Redux **ou** useReducer (pas les deux) | 🟠 Perf/Archi | Moyen | Moyen |
| 7 | Ajouter tests reducer + chiffrement | 🟡 Qualité | Moyen | Moyen |
| 8 | Découper les fichiers monolithes | 🟡 Qualité | Élevé | Moyen |

---

## ❓ Décisions à prendre avec toi

1. **Backend ou 100 % client ?** L'app est en `static` sur GitHub Pages (pas d'`/api`).
   Veux-tu rester **full-client (IndexedDB + Firebase)**, ou ajouter un vrai backend/serverless ?
   → Détermine la solution offline (OFF-1) et le proxy des clés IA (SEC-2).
2. **Une seule librairie UI ?** OK pour retirer MUI **ou** Antd au profit de Tailwind ?
3. **Firestore offline natif vs file d'attente maison ?** Les deux marchent ; le natif est
   plus rapide à mettre en place, le maison donne plus de contrôle.

> Dis-moi par quoi tu veux commencer et je m'y mets. Mon conseil : **#1 (sécurité Firestore) tout de suite**,
> car c'est exploitable en l'état, puis **#3 (unification offline)** qui est ton objectif principal.
