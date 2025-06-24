import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Task } from '../../types';
import { EditTaskForm } from '../Tasks/EditTaskForm';

export function CalendarView() {
  const { state } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Ne prendre que les tâches des projets actifs
  const allTasks = state.projects
    .filter(project => project.status === 'active')
    .flatMap(p => p.tasks);

  // Obtenir le premier jour du mois
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();

  // Générer les jours du calendrier
  const days = [];
  
  // Jours du mois précédent
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(firstDayOfMonth.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
    days.push({ date, isCurrentMonth: false });
  }

  // Jours du mois actuel
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    days.push({ date, isCurrentMonth: true });
  }

  // Jours du mois suivant pour compléter la grille
  const remainingDays = 42 - days.length;
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
    days.push({ date, isCurrentMonth: false });
  }

  const getTasksForDate = (date: Date) => {
    return allTasks.filter(task => {
      // Vérifier que la tâche appartient à un projet actif
      const project = state.projects.find(p => p.id === task.projectId);
      if (!project || project.status !== 'active') return false;
      
      const taskStartDate = new Date(task.startDate || task.dueDate);
      const taskEndDate = new Date(task.endDate || task.dueDate);
      
      // Réinitialiser les heures pour la comparaison
      const currentDate = new Date(date);
      currentDate.setHours(0, 0, 0, 0);
      
      taskStartDate.setHours(0, 0, 0, 0);
      taskEndDate.setHours(0, 0, 0, 0);
      
      // Vérifier si la date est dans la plage de la tâche
      return currentDate >= taskStartDate && currentDate <= taskEndDate;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Calendrier
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Vue d'ensemble de vos échéances
            </p>
          </div>
        </div>
      </div>

      <Card className="p-8" gradient>
        {/* En-tête du calendrier */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {currentDate.toLocaleDateString('fr-FR', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h2>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="md"
              icon={ChevronLeft}
              onClick={() => navigateMonth('prev')}
              iconPosition="left"
            >
              Précédent
            </Button>
            <Button
              variant="gradient"
              size="md"
              onClick={() => setCurrentDate(new Date())}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={ChevronRight}
              onClick={() => navigateMonth('next')}
              iconPosition="right"
            >
              Suivant
            </Button>
          </div>
        </div>

        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map(day => (
            <div key={day} className="p-4 text-center font-bold text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const tasksForDay = getTasksForDate(day.date);
            const overdueTasks = tasksForDay.filter(t => {
              const taskEndDate = new Date(t.endDate || t.dueDate);
              return taskEndDate < new Date() && t.status !== 'done';
            });

            return (
              <div
                key={index}
                className={`
                  min-h-[120px] p-3 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl transition-all duration-200 hover:shadow-lg
                  ${day.isCurrentMonth 
                    ? 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm' 
                    : 'bg-gray-50/40 dark:bg-gray-900/40'
                  }
                  ${isToday(day.date) 
                    ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 shadow-lg' 
                    : ''
                  }
                `}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`
                    text-sm font-bold
                    ${day.isCurrentMonth 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-400 dark:text-gray-600'
                    }
                    ${isToday(day.date) ? 'text-blue-600 dark:text-blue-400' : ''}
                  `}>
                    {day.date.getDate()}
                  </span>
                  
                  {tasksForDay.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-sm" />
                      <span className="text-xs text-gray-500 font-medium">
                        {tasksForDay.length}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  {tasksForDay.slice(0, 3).map(task => {
                    const project = state.projects.find(p => p.id === task.projectId);
                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                        }}
                        className={`
                          text-xs p-2 rounded-lg truncate cursor-pointer transition-all duration-200 hover:scale-105 shadow-sm
                          ${task.status === 'done' 
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 border-l-4 border-green-500' 
                            : overdueTasks.includes(task)
                            ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-300 border-l-4 border-red-500'
                            : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-300 hover:from-blue-200 hover:to-cyan-200 dark:hover:from-blue-800/40 dark:hover:to-cyan-800/40 border-l-4 border-blue-500'
                          }
                          ${(() => {
                            const taskStartDate = new Date(task.startDate || task.dueDate);
                            const taskEndDate = new Date(task.endDate || task.dueDate);
                            const currentDate = new Date(day.date);
                            
                            // Vérifier si c'est le premier jour de la tâche
                            if (currentDate.toDateString() === taskStartDate.toDateString()) {
                              return 'rounded-l-lg rounded-r-none';
                            }
                            // Vérifier si c'est le dernier jour de la tâche
                            if (currentDate.toDateString() === taskEndDate.toDateString()) {
                              return 'rounded-r-lg rounded-l-none';
                            }
                            // Pour les jours intermédiaires
                            if (currentDate > taskStartDate && currentDate < taskEndDate) {
                              return 'rounded-none';
                            }
                            return '';
                          })()}
                        `}
                        title={`${task.title} - ${project?.name}`}
                      >
                        {task.title}
                      </div>
                    );
                  })}
                  
                  {tasksForDay.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center bg-gray-100/50 dark:bg-gray-700/50 rounded-lg py-1 font-medium">
                      +{tasksForDay.length - 3} autres
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Légende avec design moderne */}
      <Card className="p-6" gradient>
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">Légende</h3>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-sm" />
            <span className="text-gray-600 dark:text-gray-400 font-medium">Tâches terminées</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-sm" />
            <span className="text-gray-600 dark:text-gray-400 font-medium">Tâches en retard</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-sm" />
            <span className="text-gray-600 dark:text-gray-400 font-medium">Tâches à venir</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-blue-200 dark:bg-blue-800 rounded border-2 border-blue-500 shadow-sm" />
            <span className="text-gray-600 dark:text-gray-400 font-medium">Aujourd'hui</span>
          </div>
        </div>
      </Card>

      {/* Modal d'édition de tâche */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <button
              onClick={() => setSelectedTask(null)}
              className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="overflow-y-auto max-h-[85vh]">
              <EditTaskForm 
                task={selectedTask} 
                onClose={() => setSelectedTask(null)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
