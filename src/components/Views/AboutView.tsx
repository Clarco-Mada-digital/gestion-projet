import React from 'react';
import { Github, Mail, Heart, Code, Coffee, GitBranch, Users } from 'lucide-react';
import { Card } from '../UI/Card';

export function AboutView() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Code className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              À Propos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Découvrez l'application et son créateur
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6" gradient>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              À propos de l'application
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Gestion de Projets est une application moderne et intuitive conçue pour vous aider à organiser et suivre vos projets et tâches efficacement. 
              Avec une interface utilisateur élégante et des fonctionnalités puissantes, gérez facilement vos projets, vos tâches et vos échéances.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mt-4">
              <GitBranch className="w-4 h-4" />
              <span>Version 1.0.0 - Open Source</span>
            </div>
          </Card>

          <Card className="p-6" gradient>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Fonctionnalités
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                <span>Gestion complète des projets avec suivi de l'état</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                <span>Vue Kanban pour une gestion visuelle des tâches</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                <span>Calendrier intégré pour le suivi des échéances</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                <span>Vue "Aujourd'hui" pour suivre les tâches du jour</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                <span>Interface sombre/claire</span>
              </li>
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6" gradient>
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4 flex items-center justify-center text-white text-3xl font-bold">
                CR
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Clarco RAHERINANDRASNA
              </h2>
              <p className="text-blue-500 dark:text-blue-400 font-medium">
                Développeur Full Stack
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Créateur de l'application
              </p>
              
              <div className="mt-4 space-y-2 w-full">
                <a 
                  href="mailto:brayanraherinandrasana@gmail.com"
                  className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </a>
                <a 
                  href="https://github.com/yourusername" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </Card>

          <Card className="p-6" gradient>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
              <Heart className="w-5 h-5 text-pink-500 mr-2" />
              Soutenez ce projet
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Ce projet est entièrement gratuit et open source. Si vous appréciez cette application, envisagez de soutenir son développement.
            </p>
            
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-1">MVola</h4>
                <p className="text-sm font-mono bg-white dark:bg-gray-800 p-2 rounded">
                  034 37 395 28
                </p>
              </div>
              
              <a 
                href="https://github.com/yourusername/gestion-projet" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Github className="w-4 h-4 mr-1" />
                Voir sur GitHub
              </a>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Merci pour votre soutien ! Chaque contribution aide à améliorer l'application.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
