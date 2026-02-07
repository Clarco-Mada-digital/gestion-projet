import React, { useState } from 'react';
import { Sparkles, Target, ChevronDown, ChevronRight, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskCard } from '../Tasks/TaskCard';
import { Card } from '../UI/Card';

export function TodayView() {
  const { state } = useApp();
  const { appSettings } = state;
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // Récupérer la taille de police depuis les paramètres
  const fontSize = appSettings?.fontSize || 'medium';

  // Classes CSS pour les différentes tailles de police
  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const headingSizeClasses = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl'
  };

  // Initialiser tous les projets comme étant repliés par défaut
  React.useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    state.projects.forEach(project => {
      initialExpanded[project.id] = false; // false pour que les projets soient repliés par défaut
    });
    setExpandedProjects(initialExpanded);
  }, [state.projects]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Fonction utilitaire pour vérifier si une date est dans la plage de la tâche
  const isTaskInDateRange = (task: any, targetDate: Date) => {
    // Si la tâche n'a pas de date de début ni d'échéance, on ne l'affiche pas ici
    if (!task.startDate && !task.dueDate) return false;

    // Exclure les tâches terminées
    if (task.status === 'done') return false;

    const taskStartDate = new Date(task.startDate || task.dueDate);
    const taskDueDate = new Date(task.dueDate);

    const currentDate = new Date(targetDate);
    currentDate.setHours(0, 0, 0, 0);

    taskStartDate.setHours(0, 0, 0, 0);
    taskDueDate.setHours(0, 0, 0, 0);

    // La tâche est "active" aujourd'hui si on est entre le début et la fin
    return currentDate >= taskStartDate && currentDate <= taskDueDate;
  };

  // Récupérer toutes les tâches des projets actifs groupées par projet
  const projectsWithTodayTasks = state.projects
    .filter(project => project.status === 'active') // Ne prendre que les projets actifs
    .map(project => ({
      ...project,
      tasks: project.tasks.filter(task =>
        isTaskInDateRange(task, new Date())
      )
    }))
    .filter(project => project.tasks.length > 0);

  // Toutes les tâches des projets actifs pour les calculs
  const allTasks = state.projects
    .filter(project => project.status === 'active')
    .flatMap(p => p.tasks);

  // Tâches en retard (uniquement des projets actifs)
  const overdueTasks = allTasks.filter(task => {
    const taskDueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      taskDueDate < today &&
      task.status !== 'done' &&
      !isTaskInDateRange(task, today)
    );
  });

  // Calcul des statistiques (uniquement pour les projets actifs)
  const todayTasks = allTasks.filter(task => isTaskInDateRange(task, new Date()));

  return (
    <div className="space-y-8">
      {/* En-tête avec design futuriste */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`${headingSizeClasses[fontSize]} md:${headingSizeClasses[fontSize].replace('xl', '3xl')} font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent`}>
                Travail d'aujourd'hui
              </h1>
              <p className={`${textSizeClasses[fontSize]} text-gray-600 dark:text-gray-400 mt-1 font-medium`}>
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

        <Card className="w-full md:w-auto" gradient>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-4">
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {todayTasks.filter(t => t.status === 'todo').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                À faire
              </p>
            </div>
            <div className="text-center p-4">
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                {todayTasks.filter(t => t.status === 'in-progress').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                En cours
              </p>
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
              <h2 className={`${headingSizeClasses[fontSize]} text-red-800 dark:text-red-300`}>
                Tâches en retard ({overdueTasks.length})
              </h2>
              <p className={`${textSizeClasses[fontSize]} text-red-600 dark:text-red-400 font-medium`}>
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
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <h2 className={`${headingSizeClasses[fontSize]} bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent`}>
            Tâches d'aujourd'hui ({todayTasks.length})
          </h2>
        </div>

        {projectsWithTodayTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h3 className={`${headingSizeClasses[fontSize]} text-gray-900 dark:text-white mb-3`}>
              Aucune tâche pour aujourd'hui
            </h3>
            <p className={`${textSizeClasses[fontSize]} text-gray-500 dark:text-gray-400 text-lg`}>
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
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <h3 className={`${textSizeClasses[fontSize].replace('text-', 'text-').replace('sm', 'base').replace('base', 'lg').replace('lg', 'xl')} font-medium text-gray-700 dark:text-gray-300 truncate flex-1 min-w-0`}>
                        {project.name}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                        {project.tasks.length} tâche{project.tasks.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: project.color,
                            transition: 'width 0.3s ease-in-out'
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
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
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <h2 className={`${headingSizeClasses[fontSize].replace('xl', 'lg')} font-semibold flex items-center`}>
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
              Tâches en retard
            </h2>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Terminées</div>
        </Card>
      </div> */}
    </div>
  );
}