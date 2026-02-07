import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, ChevronDown } from 'lucide-react';
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
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);



  // Récupérer les tâches de tous les projets actifs et appliquer les filtres
  const allTasks = (state.projects as Project[])
    .filter((project) => {
      if (project.status !== 'active') return false;
      if (selectedProjectIds.length > 0 && !selectedProjectIds.includes(project.id)) return false;
      return true;
    })
    .flatMap((p) => p.tasks)
    .filter((task) => {
      if (selectedUserIds.length > 0) {
        return task.assignees.some(userId => selectedUserIds.includes(userId));
      }
      return true;
    }) as Task[];

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

        {/* Filtres Avancés */}
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 border ${isFilterOpen || selectedProjectIds.length > 0 || selectedUserIds.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}
            >
              <span className="text-sm font-bold mr-2">Filtres</span>
              {(selectedProjectIds.length > 0 || selectedUserIds.length > 0) && (
                <span className="flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-[10px] rounded-full mr-2">
                  {selectedProjectIds.length + selectedUserIds.length}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-4">
                    {/* Projets */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Projets</label>
                      <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                        {state.projects.filter(p => p.status === 'active').map(project => (
                          <label key={project.id} className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedProjectIds.includes(project.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedProjectIds([...selectedProjectIds, project.id]);
                                else setSelectedProjectIds(selectedProjectIds.filter(id => id !== project.id));
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{project.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Personnel */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Personnel</label>
                      <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                        {state.users.map(user => (
                          <label key={user.id} className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedUserIds([...selectedUserIds, user.id]);
                                else setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <div className="flex items-center">
                              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-[10px] font-bold text-blue-600 mr-2 uppercase">
                                {user.name.charAt(0)}
                              </span>
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{user.name}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                      <button
                        onClick={() => { setSelectedProjectIds([]); setSelectedUserIds([]); }}
                        className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                      >
                        Réinitialiser
                      </button>
                      <button
                        onClick={() => setIsFilterOpen(false)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700"
                      >
                        Appliquer
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
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

        {/* Grille du calendrier (Vue structurée par semaine avec barres continues) */}
        <div className="space-y-3">
          {(() => {
            const weeks = [];
            for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

            return weeks.map((week, weekIndex) => {
              const weekStart = new Date(week[0].date);
              weekStart.setHours(0, 0, 0, 0);
              const weekEnd = new Date(week[6].date);
              weekEnd.setHours(23, 59, 59, 999);

              // 1. Collecter et trier les tâches de la semaine
              const weekTasks = allTasks.filter(task => {
                const s = new Date(task.startDate || task.dueDate);
                const e = new Date(task.dueDate);
                s.setHours(0, 0, 0, 0);
                e.setHours(23, 59, 59, 999);
                return s <= weekEnd && e >= weekStart;
              }).sort((a, b) => {
                const startA = new Date(a.startDate || a.dueDate).getTime();
                const startB = new Date(b.startDate || b.dueDate).getTime();
                if (startA !== startB) return startA - startB;
                const endA = new Date(a.dueDate).getTime();
                const endB = new Date(b.dueDate).getTime();
                return endB - endA;
              });

              // 2. Assigner aux slots verticaux
              const slots: Task[][] = [];
              const maxSlots = 4;
              const overflowByDay = new Array(7).fill(0);
              const tasksWithLayout = [];

              weekTasks.forEach(task => {
                const s = new Date(task.startDate || task.dueDate);
                const e = new Date(task.dueDate);
                const startIdx = Math.max(0, Math.floor((s.getTime() - weekStart.getTime()) / (24 * 3600 * 1000)));
                const endIdx = Math.min(6, Math.floor((e.getTime() - weekStart.getTime()) / (24 * 3600 * 1000)));

                let assignedSlot = -1;
                for (let i = 0; i < maxSlots; i++) {
                  if (!slots[i]) slots[i] = [];
                  const hasOverlap = slots[i].some(t => {
                    const ts = new Date(t.startDate || t.dueDate);
                    const te = new Date(t.dueDate);
                    const tsIdx = Math.max(0, Math.floor((ts.getTime() - weekStart.getTime()) / (24 * 3600 * 1000)));
                    const teIdx = Math.min(6, Math.floor((te.getTime() - weekStart.getTime()) / (24 * 3600 * 1000)));
                    return !(endIdx < tsIdx || startIdx > teIdx);
                  });
                  if (!hasOverlap) { assignedSlot = i; slots[i].push(task); break; }
                }

                if (assignedSlot !== -1) {
                  tasksWithLayout.push({ task, startIdx, endIdx, slot: assignedSlot });
                } else {
                  for (let col = startIdx; col <= endIdx; col++) overflowByDay[col]++;
                }
              });

              return (
                <div key={weekIndex} className="grid grid-cols-7 gap-1 relative min-h-[140px] last:mb-0">
                  {/* Fond des jours */}
                  {week.map((day, dayIdx) => (
                    <div
                      key={dayIdx}
                      className={`
                        min-h-[140px] p-2 border border-blue-200/20 dark:border-blue-800/20 rounded-xl transition-all
                        ${day.isCurrentMonth ? 'bg-white/40 dark:bg-gray-800/40' : 'bg-gray-50/20 dark:bg-gray-900/20'}
                        ${isToday(day.date) ? 'ring-2 ring-amber-500 bg-amber-50/30 dark:bg-amber-900/20' : ''}
                      `}
                      style={{ gridColumn: dayIdx + 1, gridRow: '1 / span 6' }}
                    >
                      <span className={`text-xs font-bold ${day.isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'} ${isToday(day.date) ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                        {day.date.getDate()}
                      </span>
                    </div>
                  ))}

                  {/* Barres de tâches (Layer horizontal) */}
                  {tasksWithLayout.map((item, i) => {
                    const { task, startIdx, endIdx, slot } = item;
                    const project = state.projects.find(p => p.id === task.projectId);
                    const isDone = task.status === 'done';
                    const isOverdue = new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)) && !isDone;

                    return (
                      <div
                        key={i}
                        onClick={() => project && setSelectedTask({ task, project })}
                        style={{
                          gridColumn: `${startIdx + 1} / span ${endIdx - startIdx + 1}`,
                          gridRow: slot + 2,
                          marginTop: '4px'
                        }}
                        className={`
                          h-6 mt-6 flex items-center justify-center px-4 text-[10px] font-bold cursor-pointer rounded-md shadow-sm transition-all hover:scale-[1.01] hover:brightness-110 z-10 truncate
                          ${isDone
                            ? 'bg-green-500/20 text-green-700 dark:text-green-300 border-l-4 border-green-500'
                            : isOverdue
                              ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-l-4 border-red-500'
                              : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500'
                          }
                        `}
                        title={`${task.title} (${project?.name})`}
                      >
                        {task.title}
                      </div>
                    );
                  })}

                  {/* Overflow */}
                  {week.map((day, dayIdx) => (
                    overflowByDay[dayIdx] > 0 && (
                      <div
                        key={`more-${dayIdx}`}
                        onClick={() => setSelectedDayTasks({ date: day.date, tasks: getTasksForDate(day.date) })}
                        style={{ gridColumn: dayIdx + 1, gridRow: 6 }}
                        className="self-end mb-1 text-center text-[10px] text-gray-500 dark:text-gray-400 font-bold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 py-1 rounded transition-colors z-20"
                      >
                        +{overflowByDay[dayIdx]} autres
                      </div>
                    )
                  ))}
                </div>
              );
            });
          })()}
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
            <span className="text-gray-600 dark:text-gray-400 font-medium">Tâches à venir / En cours</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-amber-200 dark:bg-amber-800 rounded border-2 border-amber-500 shadow-sm" />
            <span className="text-gray-600 dark:text-gray-400 font-medium">Aujourd'hui (Date actuelle)</span>
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
                          <h4 className={`font-bold transition-colors break-words ${isDone ? 'text-green-800 dark:text-green-400 line-through' : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
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
