import { Github, Mail, Heart, BookOpen, Calendar as CalendarIcon, Layout, ShieldCheck, Zap, Globe } from 'lucide-react';
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
    <div className="space-y-8 h-full overflow-y-auto pb-8 pr-4 custom-scroll">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-indigo-500/20">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className={`${headingClass} font-black tracking-tight text-gray-900 dark:text-white`}>
              ProjectFlow <span className="text-indigo-600">v1.6</span>
            </h1>
            <p className={`${baseTextClass} text-gray-500 dark:text-gray-400 mt-1 font-medium`}>
              Documentation & Nouveautés Stratégiques
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultActiveKey="docs" className="custom-tabs">
        <TabPane tab="Fonctionnalités" key="docs">
          <div className="grid grid-cols-1 gap-8">
            {/* Introduction */}
            <Card className="p-8" gradient>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className={`${subHeadingClass} font-black mb-2 text-gray-900 dark:text-white`}>
                    L'Espace de Travail Moderne
                  </h2>
                  <p className={`${baseTextClass} text-gray-600 dark:text-gray-400 leading-relaxed`}>
                    ProjectFlow n'est plus seulement un gestionnaire de tâches. C'est un écosystème complet qui fait le pont entre votre organisation interne et la communication avec vos clients.
                    Cette version 1.6 introduit l'intelligence artificielle avancée, le partage public premium avec support des pièces jointes et des images de couverture.
                  </p>
                </div>
              </div>
            </Card>

            {/* Guide des Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6" hover>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className={`${subHeadingClass} font-black text-gray-900 dark:text-white`}>Vue Publique & Client</h3>
                </div>
                <p className={`${baseTextClass} text-gray-500 dark:text-gray-400 leading-relaxed`}>
                  Partagez vos progrès en toute transparence. Générez un lien unique pour vos clients afin qu'ils suivent l'avancement sans avoir de compte.
                </p>
                <ul className="mt-4 space-y-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Dashboard Client avec Support Attachments</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Images de Couverture & Customisation</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Filtrage Intelligent (Non-suivi)</li>
                </ul>
              </Card>

              <Card className="p-6" hover>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <h3 className={`${subHeadingClass} font-black text-gray-900 dark:text-white`}>Agenda Pro (Multi-échelles)</h3>
                </div>
                <p className={`${baseTextClass} text-gray-500 dark:text-gray-400 leading-relaxed`}>
                  Le nouveau moteur d'agenda gère maintenant les tâches multi-jours avec des barres continues professionnelles.
                </p>
                <ul className="mt-4 space-y-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Vues Semaine, Mois, Trimestre, Semestre</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Spanning task (affichage sur une ligne)</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Synchro Google Calendar & Tasks</li>
                </ul>
              </Card>

              <Card className="p-6" hover>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className={`${subHeadingClass} font-black text-gray-900 dark:text-white`}>Sécurité & Cloud Sync</h3>
                </div>
                <p className={`${baseTextClass} text-gray-500 dark:text-gray-400 leading-relaxed`}>
                  Choisissez entre stockage Local (privé) ou Cloud (collaboration). Sécurité renforcée pour le partage.
                </p>
                <ul className="mt-4 space-y-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Publication réservée au Propriétaire</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Rôles d'accès précis (Admin, Member...)</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Synchronisation temps réel (No-refresh)</li>
                </ul>
              </Card>

              <Card className="p-6" hover>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-600">
                    <Layout className="w-6 h-6" />
                  </div>
                  <h3 className={`${subHeadingClass} font-black text-gray-900 dark:text-white`}>Ergonomie App-Like</h3>
                </div>
                <p className={`${baseTextClass} text-gray-500 dark:text-gray-400 leading-relaxed`}>
                  Interface optimisée pour une productivité sans friction. Expérience plein écran (100vh) sans scroll superflu.
                </p>
                <ul className="mt-4 space-y-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> IA : Recherche de Modèles & Paramètres</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> Kanban Coloré & Alertes Contextuelles</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> Fluidité 100vh sans friction</li>
                </ul>
              </Card>
            </div>
          </div>
        </TabPane>

        <TabPane tab="Version & Auteur" key="about" >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Card className="p-8" gradient>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`${subHeadingClass} font-black text-gray-900 dark:text-white`}>
                    Journal des évolutions
                  </h2>
                  <span className="px-4 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Stable 1.5.0</span>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-px h-full bg-gray-100 dark:bg-gray-800 relative"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-500 rounded-full" /></div>
                    <div className="pb-6">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Mars 2026</p>
                      <h4 className="text-sm font-bold mb-1 text-gray-900 dark:text-white">Stabilisation v1.6 (AI & Public Assets)</h4>
                      <p className={`${baseTextClass} text-gray-500 leading-relaxed`}>Intégration de l'IA native, support des fichiers joints dans la vue publique, images de couverture et refonte visuelle des tâches non suivies.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-px h-full bg-gray-100 dark:bg-gray-800 relative"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-300 rounded-full" /></div>
                    <div className="pb-6">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Février 2026</p>
                      <h4 className="text-sm font-bold mb-1 text-gray-900 dark:text-white">Lancement de la v1.5</h4>
                      <p className={`${baseTextClass} text-gray-500 leading-relaxed`}>Introduction du Dashboard public et stabilisation des vues multi-échelles. Support du "Task Spanning".</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6" gradient>
                <h3 className={`${subHeadingClass} font-bold text-gray-900 dark:text-white mb-3 flex items-center`}>
                  <Heart className="w-5 h-5 text-pink-500 mr-2" />
                  Soutenez ce projet
                </h3>
                <p className={`${baseTextClass} text-gray-700 dark:text-gray-300 mb-4`}>
                  Ce projet est entièrement gratuit et open source. Votre soutien permet de maintenir les serveurs Cloud et d'améliorer continuellement l'IA.
                </p>

                <div className={`space-y-3 ${baseTextClass}`}>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-blue-800 dark:text-blue-200">Mobile money (Madagascar)</h4>
                      <Zap className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="font-mono bg-white dark:bg-gray-800 p-3 rounded-xl text-center text-lg font-black text-gray-800 dark:text-gray-200 shadow-sm">
                      +261 34 37 395 28 / +261 32 88 942 01
                    </p>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <a
                      href="https://github.com/Clarco-Mada-digital/gestion-projet"
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gray-950 dark:bg-white text-white dark:text-gray-950 rounded-xl font-bold text-xs transition-all hover:scale-105 shadow-xl"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      Code Source
                    </a>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-8" gradient>
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20" />
                    <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 relative flex items-center justify-center text-white text-4xl font-black shadow-2xl">
                      CR
                    </div>
                  </div>
                  <h2 className={`${subHeadingClass} font-black text-gray-900 dark:text-white tracking-tighter`}>
                    Clarco RAHERINANDRASNA
                  </h2>
                  <div className="mt-1 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                    Développeur Full Stack
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 leading-relaxed">
                    "Passionné par le design UI et le développement d'outils de productivité haute performance."
                  </p>

                  <div className="mt-8 space-y-3 w-full text-gray-900 dark:text-white">
                    <a
                      href="mailto:brayanraherinandrasana@gmail.com"
                      className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all font-bold text-xs group"
                    >
                      <span className="flex items-center gap-3"><Mail className="w-4 h-4" /> Email</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <a
                      href="https://github.com/clarco-mada-digital"
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 rounded-2xl transition-all font-bold text-xs group"
                    >
                      <span className="flex items-center gap-3"><Github className="w-4 h-4" /> GitHub Pro</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
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

// Composant local manquant pour l'Auteur
const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);

