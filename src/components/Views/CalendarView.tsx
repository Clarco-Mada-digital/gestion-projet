import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Task, Project } from '../../types';
import { EditTaskForm } from '../Tasks/EditTaskForm';

export function CalendarView() {
  const { state } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  type ViewMode = 'week' | 'month' | 'quarter' | 'semester';
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedTask, setSelectedTask] = useState<{ task: Task; project: Project } | null>(null);
  const [selectedDayTasks, setSelectedDayTasks] = useState<{ date: Date; tasks: Task[] } | null>(null);



  // Récupérer les tâches de tous les projets actifs
  const allTasks = (state.projects as Project[])
    .filter((project) => project.status === 'active')
    .flatMap((p) => p.tasks) as Task[];

  interface DayInfo {
    date: Date;
    isCurrentMonth: boolean;
  }

  const generateDays = (): DayInfo[] => {
    const periodDays: DayInfo[] = [];

    if (viewMode === 'week') {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week (Sunday)
      for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        periodDays.push({ date, isCurrentMonth: date.getMonth() === currentDate.getMonth() });
      }
    } else if (viewMode === 'month') {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const startOffset = firstDay.getDay();

      // Prev month padding
      for (let i = startOffset - 1; i >= 0; i--) {
        const date = new Date(firstDay);
        date.setDate(date.getDate() - (i + 1));
        periodDays.push({ date, isCurrentMonth: false });
      }
      // Current month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        periodDays.push({ date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i), isCurrentMonth: true });
      }
      // Next month padding
      const remaining = 42 - periodDays.length;
      for (let i = 1; i <= remaining; i++) {
        const date = new Date(lastDay);
        date.setDate(date.getDate() + i);
        periodDays.push({ date, isCurrentMonth: false });
      }
    } else if (viewMode === 'quarter' || viewMode === 'semester') {
      const monthCount = viewMode === 'quarter' ? 3 : 6;
      const startMonth = Math.floor(currentDate.getMonth() / monthCount) * monthCount;
      const startDate = new Date(currentDate.getFullYear(), startMonth, 1);
      const startOffset = startDate.getDay();

      // Padding
      for (let i = startOffset - 1; i >= 0; i--) {
        const date = new Date(startDate);
        date.setDate(date.getDate() - (i + 1));
        periodDays.push({ date, isCurrentMonth: false });
      }

      // 3 or 6 months
      const endDate = new Date(currentDate.getFullYear(), startMonth + monthCount, 0);
      const current = new Date(startDate);
      while (current <= endDate) {
        periodDays.push({ date: new Date(current), isCurrentMonth: current.getMonth() >= startMonth && current.getMonth() < startMonth + monthCount });
        current.setDate(current.getDate() + 1);
      }

      // Padding to complete last week
      const lastDay = periodDays[periodDays.length - 1].date;
      const endOffset = 6 - lastDay.getDay();
      for (let i = 1; i <= endOffset; i++) {
        const date = new Date(lastDay);
        date.setDate(date.getDate() + i);
        periodDays.push({ date, isCurrentMonth: false });
      }
    }

    return periodDays;
  };

  const days = generateDays();


  const getTasksForDate = (date: Date): Task[] => {
    return allTasks.filter((task) => {
      // Vérifier que la tâche appartient à un projet actif
      const project = state.projects.find((p: Project) => p.id === task.projectId);
      if (!project || project.status !== 'active') return false;

      const taskStartDate = new Date(task.startDate || task.dueDate);
      const taskDueDate = new Date(task.dueDate);

      // Réinitialiser les heures pour la comparaison
      const currentDate = new Date(date);
      currentDate.setHours(0, 0, 0, 0);

      taskStartDate.setHours(0, 0, 0, 0);
      taskDueDate.setHours(0, 0, 0, 0);

      // Vérifier si la date est dans la plage de la tâche
      return currentDate >= taskStartDate && currentDate <= taskDueDate;
    });
  };

  const navigate = (direction: 'prev' | 'next'): void => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (viewMode === 'week') {
        newDate.setDate(prev.getDate() + (direction === 'prev' ? -7 : 7));
      } else if (viewMode === 'month') {
        newDate.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1));
      } else if (viewMode === 'quarter') {
        newDate.setMonth(prev.getMonth() + (direction === 'prev' ? -3 : 3));
      } else if (viewMode === 'semester') {
        newDate.setMonth(prev.getMonth() + (direction === 'prev' ? -6 : 6));
      }
      return newDate;
    });
  };


  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const weekDays: string[] = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent min-w-[300px]">
            {(() => {
              if (viewMode === 'week') {
                const start = days[0].date;
                const end = days[6].date;
                return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
              }
              if (viewMode === 'month') {
                return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
              }
              if (viewMode === 'quarter') {
                const q = Math.floor(currentDate.getMonth() / 3) + 1;
                return `Trimestre ${q} - ${currentDate.getFullYear()}`;
              }
              return `Semestre ${Math.floor(currentDate.getMonth() / 6) + 1} - ${currentDate.getFullYear()}`;
            })()}
          </h2>

          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mr-4 shadow-inner">
              {(['week', 'month', 'quarter', 'semester'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={`
                    px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200
                    ${viewMode === v
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md transform scale-105'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }
                  `}
                >
                  {v === 'week' ? 'Semaine' : v === 'month' ? 'Mois' : v === 'quarter' ? 'Trimestre' : 'Semestre'}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('prev')}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
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
              onClick={() => navigate('next')}
              className="flex items-center gap-2"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
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
            const overdueTasks = tasksForDay.filter((task) => {
              const taskDueDate = new Date(task.dueDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return taskDueDate < today && task.status !== 'done';
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
                  {tasksForDay
                    .sort((a, b) => {
                      // Tri stable pour que les tâches multi-jours restent à la même position verticale
                      const startA = new Date(a.startDate || a.dueDate).getTime();
                      const startB = new Date(b.startDate || b.dueDate).getTime();
                      if (startA !== startB) return startA - startB;

                      const endA = new Date(a.dueDate).getTime();
                      const endB = new Date(b.dueDate).getTime();
                      if (endA !== endB) return endB - endA; // Les plus longues en premier

                      return a.id.localeCompare(b.id);
                    })
                    .slice(0, 3)
                    .map((task: Task) => {
                      const project = state.projects.find((p: Project) => p.id === task.projectId);
                      const taskStartDate = new Date(task.startDate || task.dueDate);
                      const taskDueDate = new Date(task.dueDate);
                      const currentDate = new Date(day.date);

                      taskStartDate.setHours(0, 0, 0, 0);
                      taskDueDate.setHours(0, 0, 0, 0);
                      currentDate.setHours(0, 0, 0, 0);

                      const isStart = currentDate.getTime() === taskStartDate.getTime();
                      const isEnd = currentDate.getTime() === taskDueDate.getTime();
                      const isMiddle = currentDate > taskStartDate && currentDate < taskDueDate;
                      const isMultiDay = taskStartDate.getTime() !== taskDueDate.getTime();

                      return (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (project) {
                              setSelectedTask({ task, project });
                            }
                          }}
                          className={`
                            text-[10px] p-1.5 truncate cursor-pointer transition-all duration-200 hover:scale-[1.02] shadow-sm relative z-10 font-medium
                            ${(() => {
                              if (task.status === 'done') {
                                return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 border-l-4 border-green-500';
                              }

                              if (overdueTasks.includes(task)) {
                                return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-300 border-l-4 border-red-500';
                              }

                              let baseClass = 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-300 border-l-4 border-blue-500';

                              if (isMultiDay) {
                                if (isStart) {
                                  return `${baseClass} rounded-l-lg rounded-r-none mr-[-12px] pr-4`;
                                }
                                if (isEnd) {
                                  return `${baseClass} rounded-r-lg rounded-l-none ml-[-12px] pl-4 border-l-0`;
                                }
                                if (isMiddle) {
                                  return `${baseClass} rounded-none mx-[-12px] px-4 border-l-0`;
                                }
                              }

                              return `${baseClass} rounded-lg`;
                            })()}`}
                          title={`${task.title} - ${project?.name}`}
                        >
                          {task.title}
                        </div>
                      );
                    })}

                  {tasksForDay.length > 3 && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDayTasks({ date: day.date, tasks: tasksForDay });
                      }}
                      className="text-[10px] text-gray-500 dark:text-gray-400 text-center bg-gray-100/50 dark:bg-gray-700/50 rounded-lg py-1 font-bold cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-600/50 transition-colors mt-1"
                    >
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

      {/* Modal pour voir toutes les tâches d'un jour */}
      {selectedDayTasks && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedDayTasks(null)}
        >
          <Card
            className="w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 cursor-default"
            gradient
            onClick={(e) => e.stopPropagation()}
          >

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Tâches du {selectedDayTasks.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {selectedDayTasks.tasks.length} tâches prévues
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDayTasks(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {selectedDayTasks.tasks.map((task) => {
                  const project = state.projects.find((p: Project) => p.id === task.projectId);
                  const isDone = task.status === 'done';
                  const isOverdue = new Date(task.dueDate) < new Date() && !isDone;

                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        if (project) {
                          setSelectedTask({ task, project });
                          setSelectedDayTasks(null);
                        }
                      }}
                      className={`
                        p-4 rounded-xl cursor-pointer transition-all duration-200 border-l-4 hover:translate-x-1 group
                        ${isDone
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-500 hover:bg-green-100 dark:hover:bg-green-900/30'
                          : isOverdue
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-500 hover:bg-red-100 dark:hover:bg-red-900/30'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className={`font-bold transition-colors ${isDone ? 'text-green-800 dark:text-green-400 line-through' : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                            {task.title}
                          </h4>
                          <span className="text-xs font-semibold px-2 py-0.5 bg-white/50 dark:bg-black/20 rounded-full text-gray-600 dark:text-gray-400">
                            {project?.name}
                          </span>
                        </div>
                        <div className={`text-xs font-bold px-3 py-1 rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
                          task.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                          }`}>
                          {task.priority.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      )}

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
                task={selectedTask.task}
                onClose={() => setSelectedTask(null)}
                project={selectedTask.project}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
