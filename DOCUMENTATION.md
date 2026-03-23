# Documentation Complète - Gestion de Projet

## 📋 Table des matières
1. [Présentation du Projet](#-présentation-du-projet)
2. [Fonctionnalités](#-fonctionnalités)
4. [Assistant Vision IA (BETA)](#-assistant-vision-ia-beta)
5. [Installation et Configuration](#-installation-et-configuration)
6. [Guide d'Utilisation](#-guide-dutilisation)
7. [Développement](#-développement)
8. [Déploiement](#-déploiement)
9. [Dépannage](#-dépannage)
10. [Contributions](#-contributions)
11. [Licence](#-licence)

## 🌟 Présentation du Projet

Gestion de Projet est une application web moderne conçue pour vous aider à organiser et suivre vos tâches et projets de manière efficace. Avec une interface intuitive et des fonctionnalités puissantes, cette application vous permet de gérer vos tâches, projets et équipes en un seul endroit.

## ✨ Fonctionnalités

### Gestion des Tâches
- Création, édition et suppression de tâches
- Attribution de priorités (Faible, Moyenne, Haute, Urgente)
- Définition d'échéances avec rappels
- Sous-tâches pour une meilleure organisation
- Étiquettes et catégorisation
- Filtrage et recherche avancée

### Vues et Tableaux de Bord
- Vue Calendrier pour une vision hebdomadaire et mensuelle
- Vue Tableau Kanban pour le suivi visuel
- Vue Liste pour une gestion détaillée
- Tableau de bord analytique

### Gestion des Projets
- Création et gestion de projets avec codes couleurs
- Suivi de la progression en temps réel
- **Collaboration Cloud (Firebase)** : Partagez des projets avec votre équipe
- **Gestion des membres** : Invitez des collaborateurs sur vos projets partagés
- Archivage et gestion des projets terminés

### Fonctionnalités Avancées
- **Nexus IA** : Votre assistant personnel pour la navigation et l'analyse
- Mode sombre/clair automatique et manuel
- Interface réactive (mobile, tablette, bureau)
- **Synchronisation hybride** : Gardez vos projets personnels en local et partagez les autres
- Export/import des données au format JSON

### Les deux piliers de l'IA dans l'application

1. **Nexus IA (Assistant Contextuel)** : Un assistant présent en bas à droite pour répondre à vos questions sur l'application, analyser votre charge de travail ou chercher des informations dans vos projets existants.
2. **Assistant Vision (Stratégie)** : Un module spécialisé pour transformer une idée floue en un dossier de projet structuré et professionnel.

## 📝 Assistant Vision IA (BETA)

Ce module est conçu pour les créateurs qui ont une idée mais ne savent pas par où commencer. Il génère un document complet et exportable.

### Le Processus de Génération (5 étapes)
- **Étape 1 : Visions & Objectifs** - Analyse stratégique de la valeur métier et des cibles.
- **Étape 2 : Fonctionnalités & UX** - Définition du parcours utilisateur et des modules clés.
- **Étape 3 : Architecture & Stack** - Recommandations techniques personnalisées (Cloud, Tech, Langages).
- **Étape 4 : Budget & Planning** - Estimations réalistes des coûts et des temps de développement.
- **Étape 5 : Roadmap & Prochaines Étapes** - Plan d'action concret pour lancer le projet.

### Synthèse Rapide & Extraction Dynamique
À la fin de la génération, l'IA produit une **Synthèse Rapide** (Bandeau de droite) qui extrait automatiquement :
- La complexité du projet (Faible, Moyenne, Haute).
- La stack technologique recommandée.
- La durée approximative.
- Le budget prévisionnel (basé sur les chiffres cités dans le rapport).

### Exportations Professionnelles
L'application propose des formats d'exportation soignés :
- **PDF Premium** : Mise en page de type "Rapport d'Audit" utilisant un système d'impression isolé pour un rendu professionnel sans interface web.
- **HTML Standalone** : Un fichier HTML autonome et stylisé (Tailwind CSS) lisible dans n'importe quel navigateur, même hors ligne.
- **Markdown** : Fichier brut pour documentation technique ou GitHub.

### Confidentialité et Stockage
Contrairement aux projets partagés, les **Dossiers de Vision** sont stockés **uniquement en local** sur votre navigateur (`LocalStorage`). Ils ne sont jamais envoyés sur le Cloud, garantissant une confidentialité totale pour vos idées de projets naissants.

## 🗂️ Structure du Projet

```
src/
├── assets/          # Fichiers statiques (images, polices, etc.)
├── components/      # Composants React réutilisables
│   ├── Layout/      # Composants de mise en page
│   ├── Tasks/       # Composants liés aux tâches
│   ├── Views/       # Vues principales de l'application
│   └── UI/          # Composants d'interface utilisateur
├── context/         # Contextes React
├── hooks/           # Hooks personnalisés
├── lib/             # Utilitaires et helpers
├── pages/           # Pages de l'application (routage)
├── services/        # Services API et logique métier
├── store/           # Gestion d'état (Redux)
│   ├── slices/      # Redux slices
│   └── store.ts     # Configuration du store
└── types/           # Définitions de types TypeScript
```

## 🛠️ Installation et Configuration

### Prérequis
- Node.js (v18 ou supérieur)
- npm (v9 ou supérieur) ou yarn
- Git

### Installation

1. **Cloner le dépôt**
   ```bash
   git clone [URL_DU_DEPOT]
   cd gestion-projet
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configuration de l'environnement**
   Créez un fichier `.env` à la racine du projet avec les variables suivantes :
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_APP_NAME="Gestion de Projet"
   # Ajoutez d'autres variables d'environnement nécessaires
   ```

4. **Lancer l'application en mode développement**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

## 🚀 Guide d'Utilisation

### Navigation (Sidebar)
L'interface est structurée autour d'une barre latérale (Sidebar) à gauche :
- **Aujourd'hui** : Votre tableau de bord quotidien avec les tâches urgentes.
- **Projets** : La liste de tous vos projets. C'est ici que vous pouvez partager des projets.
- **Kanban** : Un tableau visuel pour déplacer vos tâches entre les statuts.
- **Calendrier** : Une vue temporelle de vos échéances.
- **Rapports** : Analyse de votre productivité et statistiques.
- **Paramètres** : Configuration du compte, de l'IA et des données.
- **À propos** : Documentation et version.

### Créer une Nouvelle Tâche
1. Utilisez le bouton **"+"** flottant ou le bouton "Nouvelle Tâche" dans la vue Aujourd'hui.
2. Remplissez les détails (titre, description, échéance).
3. L'IA peut vous aider à générer des sous-tâches une fois la tâche créée.

### Partager un Projet
1. Allez dans l'onglet **"Projets"**.
2. Sur la carte du projet, cliquez sur le bouton **"Partager"** (icône utilisateur).
3. Si vous n'êtes pas connecté, l'app vous proposera de le faire via Google.
4. Une fois partagé, vous pouvez ajouter des membres par leur email.

## 💻 Développement

### Commandes Utiles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Construit l'application pour la production
- `npm run preview` - Prévoyez l'application en production localement
- `npm run lint` - Exécute le linter
- `npm run test` - Exécute les tests

### Conventions de Code
- Utilisez TypeScript pour tout le code
- Suivez les règles ESLint et Prettier configurées
- Écrivez des tests unitaires pour les nouvelles fonctionnalités
- Documentez les composants avec des commentaires JSDoc

## 🚀 Déploiement

### Préparation pour la Production
1. Construisez l'application :
   ```bash
   npm run build
   ```
2. Les fichiers de production seront générés dans le dossier `dist/`

### Options de Déploiement
- **Vercel** : Déploiement simple avec intégration Git
- **Netlify** : Déploiement continu à partir de GitHub/GitLab
- **Hébergement statique** : Tout service prenant en charge les sites statiques (AWS S3, GitHub Pages, etc.)

## 🐛 Dépannage

### Problèmes Courants

**L'application ne se lance pas**
- Vérifiez que toutes les dépendances sont installées
- Assurez-vous que le port 3000 (ou celui configuré) n'est pas utilisé

**Les styles ne s'affichent pas correctement**
- Exécutez `npm install` pour régénérer les dépendances
- Vérifiez que Tailwind CSS est correctement configuré

## 🤝 Contributions

Les contributions sont les bienvenues ! Voici comment contribuer :

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-nouvelle-fonctionnalite`)
3. Committez vos changements (`git commit -m 'Ajouter une fonctionnalité incroyable'`)
4. Poussez vers la branche (`git push origin feature/ma-nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Contact

Pour toute question ou suggestion, veuillez ouvrir une issue sur le dépôt.
