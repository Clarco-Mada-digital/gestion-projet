# Gestion de Projet - Tableau de Bord

Un tableau de bord moderne de gestion de projet construit avec Astro, React et Tailwind CSS.

## 🚀 Fonctionnalités

- 📋 Gestion des tâches avec glisser-déposer
- 📊 Tableaux Kanban pour une visualisation claire des tâches
- ☁️ **Collaboration en temps réel** (Synchronisation Cloud via Firebase)
- 👥 **Gestion d'équipe** (Partage de projets et membres)
- 🤖 **Nexus IA** : Assistant personnel pour la navigation et l'analyse (Context-aware)
- 📝 **Assistant Vision IA (BETA)** : Générateur de dossiers stratégiques (Vision, Tech, Planning, Roadmap)
- 📄 **Exports Professionnels** : Rapports au format PDF Premium, HTML Standalone et Markdown
- 💾 **Persistance Locale Sécurisée** : Vos dossiers de vision restent sur votre machine (LocalStorage)
- 🌗 Mode sombre/clair (selon les préférences du système)
- ✨ Interface utilisateur moderne, réactive et fluide (Glassmorphism & Framer Motion)

## 🛠️ Technologies Utilisées

- [Astro](https://astro.build/) - Framework web tout-en-un
- [React](https://react.dev/) - Bibliothèque JavaScript pour les interfaces utilisateur
- [Firebase](https://firebase.google.com/) - Backend Cloud pour la collaboration
- [TypeScript](https://www.typescriptlang.org/) - JavaScript typé à l'échelle de l'application
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitaire
- [React Beautiful DnD](https://github.com/atlassian/react-beautiful-dnd) - Bibliothèque de glisser-déposer
- [Lucide Icons](https://lucide.dev/) - Icônes modernes et élégantes

## 📦 Prérequis

- Node.js 18.0.0 ou supérieur
- npm ou yarn

## 🚀 Installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/Clarco-Mada-digital/gestion-projet.git
   cd gestion-projet
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Lancer l'environnement de développement**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```
   L'application sera disponible à l'adresse : [http://localhost:4321](http://localhost:4321)

## 🏗️ Structure du Projet

```
src/
├── components/     # Composants React réutilisables
├── context/        # Contextes React
├── layouts/        # Mises en page de l'application
├── pages/          # Pages de l'application
├── styles/         # Fichiers de style globaux
└── types/          # Définitions de types TypeScript
```

## 📦 Scripts Disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Construit l'application pour la production
- `npm run preview` - Prévisualise la version de production en local
- `npm run astro` - Exécute les commandes Astro

## 🧪 Tests

Pour exécuter les vérifications de type et de linting :

```bash
npm run build
```

## 🌍 Déploiement

L'application peut être déployée sur n'importe quelle plateforme prenant en charge les applications Astro, notamment :

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

1. Forkez le projet
2. Créez votre branche de fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Poussez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- [Astro](https://astro.build/) pour le framework incroyable
- [Tailwind CSS](https://tailwindcss.com/) pour les styles
- Tous les contributeurs qui ont participé à ce projet

---

<p align="center">Développé avec ❤️ par Bryan Clark</p>
