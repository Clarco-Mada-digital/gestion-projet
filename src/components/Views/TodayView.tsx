import React, { useState } from 'react';
import { Calendar, AlertTriangle, CheckCircle, Sparkles, Target, ChevronDown, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskCard } from '../Tasks/TaskCard';
import { Card } from '../UI/Card';

export function TodayView() {
  const { state } = useApp();
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const today = new Date().toDateString();
  
  // Initialiser tous les projets comme étant dépliés par défaut
  React.useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    state.projects.forEach(project => {
      initialExpanded[project.id] = true;
    });
    setExpandedProjects(initialExpanded);
  }, [state.projects]);
  
  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };
  
  // Récupérer toutes les tâches groupées par projet
  const projectsWithTodayTasks = state.projects
    .map(project => ({
      ...project,
      tasks: project.tasks.filter(task => 
        new Date(task.dueDate).toDateString() === today
      )
    }))
    .filter(project => project.tasks.length > 0);

  // Tâches en retard (tous projets confondus)
  const allTasks = state.projects.flatMap(p => p.tasks);
  const overdueTasks = allTasks.filter(task => 
    new Date(task.dueDate) < new Date() && 
    task.status !== 'done' &&
    new Date(task.dueDate).toDateString() !== today
  );

  // Calcul des statistiques
  const todayTasks = allTasks.filter(task => 
    new Date(task.dueDate).toDateString() === today
  );
  const completedToday = todayTasks.filter(task => task.status === 'done').length;
  const totalToday = todayTasks.length;
  const progressPercentage = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* En-tête avec design futuriste */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Travail d'aujourd'hui
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
                {new Date().toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
        
        <Card className="p-6" gradient>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                {completedToday}/{totalToday}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Tâches terminées
              </p>
            </div>
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="url(#gradient)"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - progressPercentage / 100)}`}
                  className="transition-all duration-500"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tâches en retard avec design d'alerte */}
      {overdueTasks.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-red-50/80 via-pink-50/80 to-orange-50/80 dark:from-red-900/20 dark:via-pink-900/20 dark:to-orange-900/20 border-red-200/50 dark:border-red-800/50" gradient>
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-red-800 dark:text-red-300">
                Tâches en retard ({overdueTasks.length})
              </h2>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                Ces tâches doivent être finalisées avant de passer aux tâches d'aujourd'hui
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            {overdueTasks.map(task => (
              <TaskCard key={task.id} task={task} showProject />
            ))}
          </div>
        </Card>
      )}

      {/* Tâches d'aujourd'hui groupées par projet */}
      <Card className="p-6" gradient>
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Tâches d'aujourd'hui ({todayTasks.length})
          </h2>
        </div>

        {projectsWithTodayTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Aucune tâche pour aujourd'hui
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Profitez de cette journée libre ou planifiez de nouvelles tâches !
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {projectsWithTodayTasks.map(project => {
              const isExpanded = expandedProjects[project.id] !== false;
              const completedTasks = project.tasks.filter(t => t.status === 'done').length;
              const progress = project.tasks.length > 0 ? (completedTasks / project.tasks.length) * 100 : 0;
              
              return (
                <div key={project.id} className="space-y-2">
                  <div 
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => toggleProject(project.id)}
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {project.name}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {project.tasks.length} tâche{project.tasks.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${progress}%`,
                            backgroundColor: project.color,
                            transition: 'width 0.3s ease-in-out'
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {completedTasks}/{project.tasks.length}
                      </span>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="space-y-3 pl-10 border-l-2 ml-3" style={{ borderColor: project.color + '40' }}>
                      {project.tasks.map(task => (
                        <div key={task.id} className="animate-fadeIn">
                          <TaskCard task={task} showProject={false} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Résumé rapide avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center" hover gradient>
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">
              {todayTasks.filter(t => t.status === 'todo').length}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">À faire</div>
        </Card>
        
        <Card className="p-6 text-center" hover gradient>
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">
              {todayTasks.filter(t => t.status === 'in-progress').length}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">En cours</div>
        </Card>
        
        <Card className="p-6 text-center" hover gradient>
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">
              {completedToday}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Terminées</div>
        </Card>
      </div>
    </div>
  );
}