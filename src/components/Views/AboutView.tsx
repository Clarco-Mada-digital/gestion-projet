import { useState } from 'react';
import { Github, Mail, Heart, Code, GitBranch, BookOpen, Layers, Calendar as CalendarIcon, Layout, Settings } from 'lucide-react';
import { Card } from '../UI/Card';
import { useApp } from '../../context/AppContext';
import { Tabs } from 'antd';

const { TabPane } = Tabs;

export function AboutView() {
  const { state } = useApp();
  const { appSettings } = state;
  const { fontSize = 'medium' } = appSettings || {};

  // Classes de taille de police dynamiques
  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const headingSizeClasses = {
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-4xl'
  };

  const subHeadingSizeClasses = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl'
  };

  const baseTextClass = textSizeClasses[fontSize as keyof typeof textSizeClasses] || 'text-base';
  const headingClass = headingSizeClasses[fontSize as keyof typeof headingSizeClasses] || 'text-3xl';
  const subHeadingClass = subHeadingSizeClasses[fontSize as keyof typeof subHeadingSizeClasses] || 'text-xl';

  return (
    <div className="space-y-8 h-full overflow-y-auto pb-8 pr-2 custom-scrollbar">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className={`${headingClass} font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent`}>
              Aide & Documentation
            </h1>
            <p className={`${baseTextClass} text-gray-600 dark:text-gray-400 mt-1 font-medium`}>
              Guide complet et informations sur l'application
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultActiveKey="docs" className="custom-tabs">
        <TabPane tab="Documentation" key="docs">
          <div className="grid grid-cols-1 gap-8">
            {/* Introduction */}
            <Card className="p-6" gradient>
              <h2 className={`${subHeadingClass} font-bold mb-4 text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600`}>
                Bienvenue sur Gestion de Projet
              </h2>
              <p className={`${baseTextClass} text-gray-700 dark:text-gray-300`}>
                Cette application est conçue pour simplifier la gestion de vos tâches quotidiennes et de vos projets à long terme.
                Grâce à une interface intuitive et des outils puissants, vous pouvez organiser votre travail, suivre vos progrès et respecter vos échéances sans stress.
              </p>
            </Card>

            {/* Guide des Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6" hover>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <Layout className="w-6 h-6" />
                  </div>
                  <h3 className={`${subHeadingClass} font-bold text-gray-900 dark:text-white`}>Tableau de Bord (Aujourd'hui)</h3>
                </div>
                <p className={`${baseTextClass} text-gray-600 dark:text-gray-400`}>
                  Votre point de départ quotidien. Cette vue résume les tâches à accomplir aujourd'hui, met en avant les tâches en retard et vous donne un aperçu rapide de votre charge de travail immédiate.
                </p>
                <ul className="mt-4 list-disc list-inside text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>Vue synthétique des tâches du jour</li>
                  <li>Alertes pour les tâches en retard</li>
                  <li>Progression par projet</li>
                </ul>
              </Card>

              <Card className="p-6" hover>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className={`${subHeadingClass} font-bold text-gray-900 dark:text-white`}>Projets</h3>
                </div>
                <p className={`${baseTextClass} text-gray-600 dark:text-gray-400`}>
                  Le cœur de votre organisation. Créez des projets pour regrouper vos tâches par thématique ou objectif.
                </p>
                <ul className="mt-4 list-disc list-inside text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>Création de projets avec couleur personnalisée</li>
                  <li>Suivi du statut (Actif, En attente, Terminé, Archivé)</li>
                  <li>Génération automatique de tâches par IA</li>
                  <li><strong>Collaboration Cloud & Partage d'équipe</strong></li>
                </ul>
              </Card>

              <Card className="p-6" hover>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400">
                    <Layout className="w-6 h-6 rotate-90" />
                  </div>
                  <h3 className={`${subHeadingClass} font-bold text-gray-900 dark:text-white`}>Kanban</h3>
                </div>
                <p className={`${baseTextClass} text-gray-600 dark:text-gray-400`}>
                  Visualisez le flux de travail. Déplacez vos tâches d'une colonne à l'autre par simple glisser-déposer pour mettre à jour leur avancement.
                </p>
                <ul className="mt-4 list-disc list-inside text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>Colonnes par défaut : À faire, En cours, Terminé</li>
                  <li>Ajout de colonnes personnalisées</li>
                  <li>Glisser-déposer intuitif</li>
                </ul>
              </Card>

              <Card className="p-6" hover>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg text-cyan-600 dark:text-cyan-400">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <h3 className={`${subHeadingClass} font-bold text-gray-900 dark:text-white`}>Calendrier</h3>
                </div>
                <p className={`${baseTextClass} text-gray-600 dark:text-gray-400`}>
                  Planifiez sur le long terme. Visualisez vos échéances sous forme de calendrier mensuel, hebdomadaire ou semestriel.
                </p>
                <ul className="mt-4 list-disc list-inside text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>Vues multiples (Mois, Semaine, Trimestre, Semestre)</li>
                  <li>Détails des tâches au clic sur une date</li>
                  <li>Indicateurs visuels de statut</li>
                </ul>
              </Card>
            </div>
          </div>
        </TabPane>

        <TabPane tab="À Propos" key="about">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="p-6" gradient>
                <h2 className={`${subHeadingClass} font-bold mb-4 text-gray-900 dark:text-white`}>
                  L'histoire du projet
                </h2>
                <p className={`${baseTextClass} text-gray-700 dark:text-gray-300 mb-4`}>
                  Ce projet est né de la volonté de créer un outil de gestion de tâches qui soit à la fois esthétique, performant et respectueux de la vie privée.
                  Depuis la version 1.2, il intègre une dimension collaborative puissante grâce à Firebase, permettant de partager des projets spécifiques tout en gardant le reste de vos données en local.
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mt-4">
                  <GitBranch className="w-4 h-4" />
                  <span>Version 1.2.0 - Hybrid Cloud Sync</span>
                </div>
              </Card>

              <Card className="p-6" gradient>
                <h3 className={`${subHeadingClass} font-bold text-gray-900 dark:text-white mb-3 flex items-center`}>
                  <Heart className="w-5 h-5 text-pink-500 mr-2" />
                  Soutenez ce projet
                </h3>
                <p className={`${baseTextClass} text-gray-700 dark:text-gray-300 mb-4`}>
                  Ce projet est entièrement gratuit et open source. Si vous appréciez cette application, envisagez de soutenir son développement.
                </p>

                <div className={`space-y-3 ${baseTextClass}`}>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">MVola</h4>
                    <p className="font-mono bg-white dark:bg-gray-800 p-2 rounded text-gray-800 dark:text-gray-200">
                      034 37 395 28
                    </p>
                  </div>

                  <div className="flex space-x-4 mt-4">
                    <a
                      href="https://github.com/Clarco-Mada-digital/gestion-projet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      Voir le Code
                    </a>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6" gradient>
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    CR
                  </div>
                  <h2 className={`${subHeadingClass} font-bold text-gray-900 dark:text-white`}>
                    Clarco RAHERINANDRASNA
                  </h2>
                  <p className={`${baseTextClass} text-blue-500 dark:text-blue-400 font-medium`}>
                    Développeur Full Stack
                  </p>
                  <p className={`${baseTextClass} text-gray-500 dark:text-gray-400 mt-2`}>
                    Créateur & Mainteneur
                  </p>

                  <div className="mt-4 space-y-2 w-full">
                    <a
                      href="mailto:brayanraherinandrasana@gmail.com"
                      className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white rounded-lg transition-all duration-300"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </a>
                    <a
                      href="https://github.com/clarco-mada-digital"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-300"
                    >
                      <Github className="w-4 h-4" />
                      <span>GitHub Pro</span>
                    </a>
                    <a
                      href="https://github.com/brayan-clark"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-800 hover:text-white rounded-lg transition-all duration-300"
                    >
                      <Github className="w-4 h-4" />
                      <span>GitHub Perso</span>
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
}
