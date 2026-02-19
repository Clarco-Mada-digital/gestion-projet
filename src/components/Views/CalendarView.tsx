import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, ChevronDown, FolderOpen, Mail, Info, Bell, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { Task, Project, ExternalEvent } from '../../types';
import { EditTaskForm } from '../Tasks/EditTaskForm';
import { googleCalendarService } from '../../services/collaboration/googleCalendarService';

export function CalendarView() {
  const { state, dispatch } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  type ViewMode = 'day' | 'week' | 'month' | 'quarter' | 'semester';
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedTask, setSelectedTask] = useState<{ task: Task; project: Project } | null>(null);
  const [selectedDayTasks, setSelectedDayTasks] = useState<{ date: Date; tasks: Task[] } | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const parseSafeDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    if (dateStr.length === 10 && dateStr.includes('-')) {
      return new Date(dateStr + 'T00:00:00');
    }
    return new Date(dateStr);
  };

  const [showProjects, setShowProjects] = useState(() => {
    const saved = localStorage.getItem('cal_showProjects');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showExternalCalendar, setShowExternalCalendar] = useState(() => {
    const saved = localStorage.getItem('cal_showExternalCalendar');
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('cal_showProjects', JSON.stringify(showProjects));
  }, [showProjects]);

  useEffect(() => {
    localStorage.setItem('cal_showExternalCalendar', JSON.stringify(showExternalCalendar));
  }, [showExternalCalendar]);


  const [selectedExternalEvent, setSelectedExternalEvent] = useState<ExternalEvent | null>(null);
  const [isEditExternalModalOpen, setIsEditExternalModalOpen] = useState(false);
  const [isConfirmingExternalDrop, setIsConfirmingExternalDrop] = useState(false);
  const [pendingExternalDrop, setPendingExternalDrop] = useState<{ eventId: string, newDate: Date } | null>(null);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().slice(0, 16),
    dueDate: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    location: ''
  });

  // Événements externes (Agenda Google/Outlook) - Désormais dynamiques
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Récupérer les tâches de tous les projets actifs et appliquer les filtres
  const filteredTasks = showProjects ? (state.projects as Project[])
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
    }) as Task[] : [];

  // Fusionner les tâches et les événements externes pour l'affichage
  const allItems = [
    ...filteredTasks.map(t => ({ ...t, displayType: 'task' })),
    ...(showExternalCalendar ? externalEvents.map(e => ({ ...e, displayType: 'external' })) : [])
  ];

  interface DayInfo {
    date: Date;
    isCurrentMonth: boolean;
  }

  const generateDays = (): DayInfo[] => {
    const periodDays: DayInfo[] = [];

    if (viewMode === 'day') {
      periodDays.push({ date: new Date(currentDate), isCurrentMonth: true });
    } else if (viewMode === 'week') {
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

  const days = React.useMemo(() => generateDays(), [currentDate, viewMode]);

  // Effet pour synchroniser avec le calendrier externe (Réel ou simulation)
  useEffect(() => {
    const fetchRealGoogleEvents = async () => {
      if (showExternalCalendar && state.googleAccessToken && days.length > 0) {
        setIsSyncing(true);
        setSyncError(null);
        try {
          // Calculer la plage de dates visible
          const timeMin = days[0].date.toISOString();
          const timeMax = new Date(days[days.length - 1].date.getTime() + 24 * 60 * 60 * 1000).toISOString();

          const events = await googleCalendarService.fetchEvents(state.googleAccessToken, 0, timeMin, timeMax);
          let tasks: any[] = [];
          try {
            tasks = await googleCalendarService.fetchTasks(state.googleAccessToken);
          } catch (te: any) {
            console.error("Erreur tâches:", te);
            if (te.message?.includes('disabled') || te.message?.includes('not been used')) {
              throw new Error(`API_TASKS_DISABLED`);
            }
          }
          setExternalEvents([...events, ...tasks]);
          setIsSyncing(false);
          return true;
        } catch (error: any) {
          console.error("Erreur de récupération du calendrier réel:", error);
          setSyncError(error.message || "Erreur de connexion Google");
          setIsSyncing(false);
          return false;
        }
      }
      return false;
    };

    const loadEvents = async () => {
      const success = await fetchRealGoogleEvents();

      if (!success && (!showExternalCalendar || !state.googleAccessToken)) {
        setExternalEvents([]);
      }
    };

    loadEvents();
  }, [showExternalCalendar, state.googleAccessToken, currentDate, viewMode]);


  const getItemsForDate = (date: Date) => {
    return allItems.filter((item) => {
      const itemStartDate = parseSafeDate(item.startDate || item.dueDate);
      // On soustrait 1ms pour gérer les dates de fin exclusives (ex: minuit le jour suivant)
      const itemDueDate = new Date(parseSafeDate(item.dueDate).getTime() - 1);

      // Réinitialiser les heures pour la comparaison
      const currentDate = new Date(date);
      currentDate.setHours(0, 0, 0, 0);

      itemStartDate.setHours(0, 0, 0, 0);
      itemDueDate.setHours(0, 0, 0, 0);

      // Vérifier si la date est dans la plage
      return currentDate >= itemStartDate && currentDate <= itemDueDate;
    });
  };


  const navigate = (direction: 'prev' | 'next'): void => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (viewMode === 'day') {
        newDate.setDate(prev.getDate() + (direction === 'prev' ? -1 : 1));
      } else if (viewMode === 'week') {
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

  const handleDragStart = (e: React.DragEvent, item: Task | ExternalEvent) => {
    if ('projectId' in item) {
      e.dataTransfer.setData('taskId', item.id);
      e.dataTransfer.setData('projectId', item.projectId);
    } else {
      e.dataTransfer.setData('externalEventId', item.id);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const projectId = e.dataTransfer.getData('projectId');
    const externalEventId = e.dataTransfer.getData('externalEventId');

    if (externalEventId) {
      setPendingExternalDrop({ eventId: externalEventId, newDate: targetDate });
      setIsConfirmingExternalDrop(true);
      return;
    }

    if (!taskId || !projectId) return;

    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;

    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Check if user is viewer
    if (project.source === 'firebase' &&
      project.ownerId !== state.cloudUser?.uid &&
      project.memberRoles?.[state.cloudUser?.uid || ''] === 'viewer') {
      return;
    }

    // Calculer la durée actuelle de la tâche en jours
    const start = parseSafeDate(task.startDate || task.dueDate);
    const end = parseSafeDate(task.dueDate);
    const durationMs = end.getTime() - start.getTime();

    // Nouvelles dates
    const newDueDate = new Date(targetDate);
    newDueDate.setHours(end.getHours(), end.getMinutes(), end.getSeconds(), end.getMilliseconds());

    const newStartDate = new Date(newDueDate.getTime() - durationMs);

    const updatedTask: Task = {
      ...task,
      startDate: task.startDate.length === 10 ? newStartDate.toISOString().split('T')[0] : newStartDate.toISOString(),
      dueDate: task.dueDate.length === 10 ? newDueDate.toISOString().split('T')[0] : newDueDate.toISOString(),
      updatedAt: new Date().toISOString()
    };

    dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
  };

  const weekDays: string[] = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Calendrier
            </h1>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 font-medium">
              Vue d'ensemble de vos échéances
              {showExternalCalendar && (
                <span className="ml-2 inline-flex items-center">
                  •
                  {isSyncing ? (
                    <span className="ml-1 text-blue-500 animate-pulse flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1 animate-ping block" />
                      Sinc. en cours...
                    </span>
                  ) : syncError ? (
                    <span className="ml-1 text-red-500 text-xs font-bold flex items-center" title={syncError}>
                      {syncError.startsWith('API_GOOGLE_DISABLED') ? (
                        <a
                          href={`https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=${syncError.split('|')[1] || '650111904365'}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center hover:underline bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded"
                        >
                          <Info className="w-3 h-3 mr-1" /> Activer l'API Calendar
                        </a>
                      ) : syncError === 'API_TASKS_DISABLED' ? (
                        <a
                          href="https://console.developers.google.com/apis/api/tasks.googleapis.com/overview"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center hover:underline bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded"
                        >
                          <Info className="w-3 h-3 mr-1" /> Activer l'API Tasks
                        </a>
                      ) : (
                        <>⚠️ Erreur de sync.</>
                      )}
                    </span>
                  ) : state.googleAccessToken ? (
                    <span className="ml-1 text-green-500 text-xs font-bold">
                      ✓ Agenda synchronisé ({externalEvents.length} évènements)
                    </span>
                  ) : (
                    <span className="ml-1 text-amber-500 text-xs font-bold flex items-center cursor-pointer hover:underline" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'settings' })}>
                      <Bell className="w-3 h-3 mr-1 animate-bounce" /> Synchronisation requise
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Commutateurs de source de données exposés */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl sm:p-1.5 sm:rounded-2xl shadow-inner flex-1 sm:flex-none">
            <label className={`flex-1 sm:flex-none flex items-center justify-center px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-300 ${showProjects ? 'bg-white dark:bg-gray-700 shadow-sm sm:shadow-md text-blue-600 scale-105' : 'text-gray-500 hover:text-gray-700'}`}>
              <input
                type="checkbox"
                className="hidden"
                checked={showProjects}
                onChange={(e) => setShowProjects(e.target.checked)}
              />
              <FolderOpen className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 ${showProjects ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tight">Projets</span>
            </label>
            <div className="w-px h-5 sm:h-6 bg-gray-300 dark:bg-gray-600 self-center mx-0.5 sm:mx-1" />
            <label
              className={`flex-1 sm:flex-none flex items-center justify-center px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-300 ${showExternalCalendar ? 'bg-white dark:bg-gray-700 shadow-sm sm:shadow-md text-purple-600 scale-105' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={showExternalCalendar}
                onChange={(e) => {
                  if (e.target.checked && !state.cloudUser) {
                    alert("Veuillez vous connecter pour synchroniser votre calendrier externe.");
                    return;
                  }
                  setShowExternalCalendar(e.target.checked);
                }}
              />
              <Mail className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 ${showExternalCalendar ? 'text-purple-500' : 'text-gray-400'}`} />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tight">Agenda</span>
              {showExternalCalendar && !state.googleAccessToken && (
                <div
                  className="ml-2 flex items-center justify-center p-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 cursor-pointer transition-colors shadow-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dispatch({ type: 'SET_VIEW', payload: 'settings' });
                  }}
                  title="Synchronisation Google requise"
                >
                  <Bell className="w-3 h-3 animate-pulse" />
                </div>
              )}
            </label>
          </div>

          {/* Filtres Avancés */}
          <div className="flex items-center space-x-2">
            <div className="relative group">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`
                group relative flex items-center px-6 py-2.5 rounded-xl transition-all duration-300 overflow-hidden
                ${isFilterOpen || selectedProjectIds.length > 0 || selectedUserIds.length > 0
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white dark:bg-gray-800 border-2 border-blue-500/20 text-gray-700 dark:text-gray-300 hover:border-blue-500/50'
                  }
              `}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 -translate-x-full group-hover:animate-shimmer" />
                <span className="text-sm font-extrabold mr-2 tracking-wide">OPTIONS DE FILTRE</span>
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
                      {showProjects && (
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
                      )}

                      {/* Personnel */}
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Personnel</label>
                        <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                          {state.cloudUser && (
                            <label className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors bg-blue-50/50 dark:bg-blue-900/10 mb-1">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(state.cloudUser?.uid || '')}
                                onChange={(e) => {
                                  const uid = state.cloudUser?.uid;
                                  if (!uid) return;
                                  if (e.target.checked) setSelectedUserIds([...selectedUserIds, uid]);
                                  else setSelectedUserIds(selectedUserIds.filter(id => id !== uid));
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                              />
                              <div className="flex items-center">
                                {state.cloudUser?.photoURL ? (
                                  <img src={state.cloudUser.photoURL} alt="Moi" className="w-6 h-6 rounded-full mr-2 object-cover" />
                                ) : (
                                  <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white mr-2 uppercase">
                                    M
                                  </span>
                                )}
                                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 truncate">Moi (Utilisateur Connecté)</span>
                              </div>
                            </label>
                          )}
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

          <Button
            variant="gradient"
            size="md"
            onClick={() => setIsCreateEventModalOpen(true)}
            className="flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="text-sm font-bold">CRÉER UN AGENDA</span>
          </Button>
        </div>
      </div>

      <Card className="p-4 sm:p-8" gradient>
        {/* En-tête du calendrier */}
        <div className="flex flex-col xl:flex-row items-center justify-between gap-6 mb-8">
          <h2 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center xl:text-left w-full xl:w-auto">
            {(() => {
              if (viewMode === 'day') {
                return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
              }
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

          <div className="flex flex-col lg:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-inner w-full lg:w-auto overflow-x-auto custom-scrollbar no-scrollbar">
              {(['day', 'week', 'month', 'quarter', 'semester'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={`
                    flex-1 lg:flex-none px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all duration-200 whitespace-nowrap
                    ${viewMode === v
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md transform scale-105'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }
                  `}
                >
                  {v === 'day' ? 'Jour' : v === 'week' ? 'Semaine' : v === 'month' ? 'Mois' : v === 'quarter' ? 'Trimestre' : 'Semestre'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto justify-center">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('prev')}
                className="flex items-center gap-1 sm:gap-2 flex-1 lg:flex-none px-2 sm:px-3 h-9 sm:h-10"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Précédent</span>
              </Button>
              <Button
                variant="gradient"
                size="md"
                onClick={() => setCurrentDate(new Date())}
                className="flex-1 lg:flex-none px-2 sm:px-3 h-9 sm:h-10 whitespace-nowrap"
              >
                <span className="sm:hidden text-[10px]">Auj.</span>
                <span className="hidden sm:inline">Aujourd'hui</span>
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('next')}
                className="flex items-center gap-1 sm:gap-2 flex-1 lg:flex-none px-2 sm:px-3 h-9 sm:h-10"
              >
                <span className="hidden sm:inline">Suivant</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>


        {/* Jours de la semaine */}
        <div className={`grid ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'} gap-1 sm:gap-2 mb-4`}>
          {viewMode === 'day' ? (
            <div className="py-2 sm:py-4 text-center text-[10px] sm:text-sm md:text-base font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg sm:rounded-xl truncate">
              {currentDate.toLocaleDateString('fr-FR', { weekday: 'long' })}
            </div>
          ) : (
            weekDays.map(day => (
              <div key={day} className="py-2 sm:py-4 text-center text-[10px] sm:text-sm md:text-base font-bold text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl truncate">
                {day}
              </div>
            ))
          )}
        </div>

        {/* Grille du calendrier (Vue structurée par semaine avec barres continues) */}
        <div className="space-y-3">
          {(() => {
            const weeks = [];
            const daysPerWeek = viewMode === 'day' ? 1 : 7;
            for (let i = 0; i < days.length; i += daysPerWeek) weeks.push(days.slice(i, i + daysPerWeek));

            return weeks.map((week, weekIndex) => {
              const weekStart = new Date(week[0].date);
              weekStart.setHours(0, 0, 0, 0);
              const weekEnd = new Date(week[week.length - 1].date);
              weekEnd.setHours(23, 59, 59, 999);

              // 1. Collecter et trier les items de la semaine
              const weekItems = allItems.filter(item => {
                const s = parseSafeDate(item.startDate || item.dueDate);
                const e = new Date(parseSafeDate(item.dueDate).getTime() - 1);
                s.setHours(0, 0, 0, 0);
                e.setHours(23, 59, 59, 999);
                return s <= weekEnd && e >= weekStart;
              }).sort((a: any, b: any) => {
                const startA = parseSafeDate(a.startDate || a.dueDate).getTime();
                const startB = parseSafeDate(b.startDate || b.dueDate).getTime();
                if (startA !== startB) return startA - startB;
                const endA = parseSafeDate(a.dueDate).getTime();
                const endB = parseSafeDate(b.dueDate).getTime();
                return endB - endA;
              });

              // 2. Assigner aux slots verticaux
              const slots: any[][] = [];
              const maxSlots = 4;
              const overflowByDay = new Array(7).fill(0);
              const itemsWithLayout: { item: any; startIdx: number; endIdx: number; slot: number }[] = [];

              weekItems.forEach(item => {

                const s = parseSafeDate(item.startDate || item.dueDate);
                const e = parseSafeDate(item.dueDate);
                const startIdx = Math.max(0, Math.floor((s.getTime() - weekStart.getTime()) / (24 * 3600 * 1000)));
                // On soustrait 1ms pour éviter qu'un événement finissant à minuit pile le lendemain ne déborde sur le jour suivant
                const endIdx = Math.min(week.length - 1, Math.floor((e.getTime() - 1 - weekStart.getTime()) / (24 * 3600 * 1000)));

                let assignedSlot = -1;
                for (let i = 0; i < maxSlots; i++) {
                  if (!slots[i]) slots[i] = [];
                  const hasOverlap = slots[i].some(t => {
                    const ts = parseSafeDate(t.startDate || t.dueDate);
                    const te = parseSafeDate(t.dueDate);
                    const tsIdx = Math.max(0, Math.floor((ts.getTime() - weekStart.getTime()) / (24 * 3600 * 1000)));
                    const teIdx = Math.min(week.length - 1, Math.floor((te.getTime() - 1 - weekStart.getTime()) / (24 * 3600 * 1000)));
                    return !(endIdx < tsIdx || startIdx > teIdx);
                  });
                  if (!hasOverlap) { assignedSlot = i; slots[i].push(item); break; }
                }

                if (assignedSlot !== -1) {
                  itemsWithLayout.push({ item, startIdx, endIdx, slot: assignedSlot });
                } else {
                  for (let col = startIdx; col <= endIdx; col++) if (overflowByDay[col] !== undefined) overflowByDay[col]++;
                }
              });


              return (
                <div key={weekIndex} className={`grid ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'} gap-x-1 gap-y-0 relative min-h-[160px] last:mb-0`} style={{ gridTemplateRows: '34px repeat(5, 1fr)' }}>
                  {/* Fond des jours */}
                  {week.map((day, dayIdx) => (
                    <div
                      key={dayIdx}
                      className={`
                        min-h-[160px] p-2 border border-blue-200/20 dark:border-blue-800/20 rounded-xl transition-all
                        ${day.isCurrentMonth ? 'bg-white/40 dark:bg-gray-800/40' : 'bg-gray-50/20 dark:bg-gray-900/20'}
                        ${isToday(day.date) ? 'bg-amber-100/30 dark:bg-amber-900/10 shadow-inner' : ''}
                      `}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day.date)}
                      style={{ gridColumn: dayIdx + 1, gridRow: '1 / span 6' }}
                    >
                      <div className="flex justify-start">
                        <span className={`
                          text-[9px] sm:text-[11px] font-bold w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-md sm:rounded-lg transition-all
                          ${isToday(day.date)
                            ? 'bg-amber-500 text-white shadow-lg transform scale-105 sm:scale-110 -translate-y-0.5 sm:-translate-y-1'
                            : (day.isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600')}
                        `}>
                          {day.date.getDate()}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Barres d'items (Layer horizontal) */}
                  {itemsWithLayout.map((layoutItem, i) => {
                    const { item, startIdx, endIdx, slot } = layoutItem;
                    const isTask = (item as any).displayType === 'task';

                    if (isTask) {
                      const task = item as Task;
                      const project = state.projects.find(p => p.id === task.projectId);
                      const isDone = task.status === 'done';
                      const isOverdue = new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)) && !isDone;
                      const isDueToday = !isDone && isToday(new Date(task.dueDate));

                      const isViewer = project?.source === 'firebase' &&
                        project.ownerId !== state.cloudUser?.uid &&
                        project.memberRoles?.[state.cloudUser?.uid || ''] === 'viewer';

                      return (
                        <div
                          key={i}
                          draggable={!isViewer}
                          onDragStart={(e) => !isViewer && handleDragStart(e, task)}
                          onClick={() => project && setSelectedTask({ task, project })}
                          style={{
                            gridColumn: `${startIdx + 1} / span ${endIdx - startIdx + 1}`,
                            gridRow: slot + 2,
                            marginTop: '4px'
                          }}
                          className={`
                            h-6 mt-1 flex items-center justify-center px-4 text-[10px] font-bold cursor-pointer rounded-md shadow-sm transition-all hover:scale-[1.01] hover:brightness-110 z-10 truncate border-l-4
                            ${isDone
                              ? 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500'
                              : isDueToday
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500 shadow-md transform scale-[1.02]'
                                : isOverdue
                                  ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500'
                                  : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500'
                            }
                          `}
                          title={`${task.title} (${project?.name})`}
                        >
                          <FolderOpen className="w-3 h-3 mr-1 shrink-0" />
                          {task.title}
                        </div>
                      );
                    } else {
                      const event = item as ExternalEvent;
                      return (
                        <div
                          key={i}
                          draggable
                          onDragStart={(e) => handleDragStart(e, event)}
                          onClick={() => setSelectedExternalEvent(event)}
                          style={{
                            gridColumn: `${startIdx + 1} / span ${endIdx - startIdx + 1}`,
                            gridRow: slot + 2,
                            marginTop: '4px'
                          }}
                          className={`
                            h-6 mt-1 flex items-center justify-center px-4 text-[10px] font-bold cursor-pointer rounded-md shadow-sm transition-all hover:scale-[1.01] hover:brightness-110 z-10 truncate border-l-4
                            bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500
                          `}
                          title={`${event.title}${event.location ? ` @ ${event.location}` : ''}`}
                        >
                          <Mail className="w-3 h-3 mr-1 shrink-0" />
                          {event.title}
                        </div>
                      );

                    }
                  })}

                  {/* Overflow */}
                  {week.map((day, dayIdx) => (
                    overflowByDay[dayIdx] > 0 && (
                      <div
                        key={`more-${dayIdx}`}
                        onClick={() => setSelectedDayTasks({ date: day.date, tasks: getItemsForDate(day.date) as any })}
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
            <div className="w-4 h-4 bg-purple-500/20 rounded border-l-4 border-purple-500 shadow-sm" />
            <span className="text-gray-600 dark:text-gray-400 font-medium">Événements Agenda (Email)</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-amber-500/20 rounded border-l-4 border-amber-500 shadow-sm" />
            <span className="text-gray-600 dark:text-gray-400 font-medium">Échéance aujourd'hui</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-500 text-white text-[10px] font-bold rounded-lg flex items-center justify-center shadow-md" >{new Date().getDate()}</div>
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
                    {selectedDayTasks.tasks.length} éléments prévus
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
                {selectedDayTasks.tasks.map((item: any) => {
                  const isTask = item.displayType === 'task';

                  if (isTask) {
                    const task = item as Task;
                    const project = state.projects.find(p => p.id === task.projectId);
                    const isDone = task.status === 'done';
                    const isDueToday = new Date(task.dueDate).toDateString() === new Date().toDateString();
                    const isOverdue = new Date(task.dueDate) < new Date() && !isDone;

                    return (
                      <div
                        key={task.id}
                        onClick={() => project && setSelectedTask({ task, project })}
                        className={`
                          p-4 rounded-xl transition-all duration-200 border-l-4 group cursor-pointer
                          ${isDone
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-500 opacity-75'
                            : isDueToday
                              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 shadow-sm transform scale-[1.01]'
                              : isOverdue
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-500 hover:bg-red-100 dark:hover:bg-red-900/30'
                                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <FolderOpen className="w-4 h-4 text-gray-400" />
                              <h4 className={`font-bold transition-colors break-words ${isDone ? 'text-green-800 dark:text-green-400 line-through' : isDueToday ? 'text-amber-800 dark:text-amber-400' : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                                {task.title}
                              </h4>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 bg-white/50 dark:bg-black/20 rounded-full text-gray-600 dark:text-gray-400 ml-6">
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
                  } else {
                    const event = item as ExternalEvent;
                    return (
                      <div
                        key={event.id}
                        onClick={() => setSelectedExternalEvent(event)}
                        className="p-4 rounded-xl transition-all duration-200 border-l-4 bg-purple-50 dark:bg-purple-900/20 border-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/30 group cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-purple-400" />
                              <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                {event.title}
                              </h4>
                            </div>
                            {event.location && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                                📍 {event.location}
                              </p>
                            )}
                            {event.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 italic">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30">
                            AGENDA
                          </div>
                        </div>
                      </div>
                    );
                  }
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

      {/* Modal Détail/Edition Événement Externe */}
      {selectedExternalEvent && (
        <Modal
          isOpen={!!selectedExternalEvent}
          onClose={() => { setSelectedExternalEvent(null); setIsEditExternalModalOpen(false); }}
          title={isEditExternalModalOpen ? "Modifier l'événement" : "Détails de l'événement"}
        >
          <div className="space-y-6">
            <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl">
              <div className="w-12 h-12 bg-purple-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex-1">
                {isEditExternalModalOpen ? (
                  <input
                    type="text"
                    value={selectedExternalEvent.title}
                    onChange={(e) => setSelectedExternalEvent(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="w-full bg-transparent border-b border-purple-300 focus:border-purple-500 outline-none font-bold text-lg dark:text-white"
                  />
                ) : (
                  <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300">{selectedExternalEvent.title}</h3>
                )}
                <p className="text-xs text-purple-600/60 dark:text-purple-400 font-semibold uppercase tracking-wider">Événement Agenda Externe</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Localisation</label>
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <span className="mr-2">📍</span>
                    {isEditExternalModalOpen ? (
                      <input
                        type="text"
                        value={selectedExternalEvent.location || ''}
                        onChange={(e) => setSelectedExternalEvent(prev => prev ? { ...prev, location: e.target.value } : null)}
                        placeholder="Lieu de la réunion"
                        className="bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none w-full"
                      />
                    ) : (
                      <span>{selectedExternalEvent.location || 'Non spécifiée'}</span>
                    )}
                  </div>
                </div>

                {selectedExternalEvent.hangoutLink && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Visioconférence</label>
                    <a
                      href={selectedExternalEvent.hangoutLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200/50"
                    >
                      <img src="https://www.gstatic.com/images/branding/product/1x/meet_2020q4_48dp.png" alt="Google Meet" className="w-5 h-5 mr-3" />
                      <span className="text-sm font-bold">Rejoindre Google Meet</span>
                    </a>
                  </div>
                )}

                {selectedExternalEvent.htmlLink && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Voir dans Google Calendar</label>
                    <a
                      href={selectedExternalEvent.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-600 hover:underline flex items-center"
                    >
                      Ouvrir les détails originaux <ChevronRight className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Dates</label>
                  <div className="flex flex-col space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <p>Début: {selectedExternalEvent.startDate.length === 10 ? parseSafeDate(selectedExternalEvent.startDate).toLocaleDateString('fr-FR') : parseSafeDate(selectedExternalEvent.startDate).toLocaleString('fr-FR')}</p>
                    <p>Fin: {selectedExternalEvent.dueDate.length === 10 ? parseSafeDate(new Date(parseSafeDate(selectedExternalEvent.dueDate).getTime() - 1).toISOString().split('T')[0]).toLocaleDateString('fr-FR') : parseSafeDate(selectedExternalEvent.dueDate).toLocaleString('fr-FR')}</p>
                  </div>
                </div>

                {selectedExternalEvent.organizer && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Organisateur</label>
                    <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                      <span className="mr-2">👤</span>
                      <span>{selectedExternalEvent.organizer.displayName || selectedExternalEvent.organizer.email}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              {selectedExternalEvent.source === 'google-tasks' && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200/30">
                  <input
                    type="checkbox"
                    checked={selectedExternalEvent.status === 'completed'}
                    onChange={(e) => {
                      const newStatus = e.target.checked ? 'completed' : 'needsAction';
                      setSelectedExternalEvent(prev => prev ? { ...prev, status: newStatus } : null);
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-300">Marquer comme terminée</span>
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Description</label>
                {isEditExternalModalOpen ? (
                  <textarea
                    value={selectedExternalEvent.description || ''}
                    onChange={(e) => setSelectedExternalEvent(prev => prev ? { ...prev, description: e.target.value } : null)}
                    rows={3}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-purple-500/50"
                    placeholder="Description de l'événement..."
                  />
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl min-h-[60px]">
                    {selectedExternalEvent.description || 'Aucune description fournie.'}
                  </p>
                )}
              </div>

              {selectedExternalEvent.attendees && selectedExternalEvent.attendees.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Participants ({selectedExternalEvent.attendees.length})
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 custom-scrollbar">
                    {selectedExternalEvent.attendees.map((attendee, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 mr-2 uppercase font-bold text-[10px]">
                            {attendee.displayName?.charAt(0) || attendee.email.charAt(0)}
                          </div>
                          <div className="truncate max-w-[150px]">
                            <p className="font-semibold dark:text-gray-200 truncate">{attendee.displayName || attendee.email}</p>
                            {attendee.displayName && <p className="text-[10px] text-gray-500 truncate">{attendee.email}</p>}
                          </div>
                        </div>
                        {attendee.responseStatus && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${attendee.responseStatus === 'accepted' ? 'bg-green-100 text-green-700' :
                            attendee.responseStatus === 'declined' ? 'bg-red-100 text-red-700' :
                              attendee.responseStatus === 'tentative' ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-500'
                            }`}>
                            {attendee.responseStatus === 'accepted' ? 'Accepté' :
                              attendee.responseStatus === 'declined' ? 'Refusé' :
                                attendee.responseStatus === 'tentative' ? 'Incertain' : 'En attente'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200/30">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-400">
                <strong>Note de sécurité :</strong> Toute modification effectuée ici sera synchronisée avec votre compte externe (Google/Outlook). Assurez-vous d'avoir les permissions nécessaires.
              </p>
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            {isEditExternalModalOpen ? (
              <>
                <Button variant="ghost" onClick={() => setIsEditExternalModalOpen(false)}>Annuler</Button>
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30"
                  onClick={() => {
                    if (selectedExternalEvent) {
                      setExternalEvents(prev => prev.map(e => e.id === selectedExternalEvent.id ? selectedExternalEvent : e));

                      // Synchronisation avec Google Calendar
                      if (state.googleAccessToken && selectedExternalEvent.calendarId) {
                        const isAllDay = selectedExternalEvent.startDate.length === 10;
                        const updatePayload: any = {
                          summary: selectedExternalEvent.title,
                          description: selectedExternalEvent.description,
                          location: selectedExternalEvent.location,
                          start: isAllDay ? { date: selectedExternalEvent.startDate } : { dateTime: selectedExternalEvent.startDate },
                          end: isAllDay ? { date: selectedExternalEvent.dueDate } : { dateTime: selectedExternalEvent.dueDate }
                        };

                        googleCalendarService.updateEvent(state.googleAccessToken, selectedExternalEvent.calendarId, selectedExternalEvent.id, updatePayload).catch(err => {
                          console.error("Erreur sync Google:", err);
                          alert("Erreur lors de la synchronisation avec Google Calendar : " + err.message);
                        });
                      }

                      // Synchronisation avec Google Tasks
                      if (state.googleAccessToken && selectedExternalEvent.source === 'google-tasks' && selectedExternalEvent.taskListId) {
                        const updatePayload: any = {
                          title: selectedExternalEvent.title.replace('[Tâche] ', ''),
                          notes: selectedExternalEvent.description,
                          status: selectedExternalEvent.status,
                          due: selectedExternalEvent.dueDate
                        };

                        googleCalendarService.updateTask(state.googleAccessToken, selectedExternalEvent.taskListId, selectedExternalEvent.id, updatePayload).catch(err => {
                          console.error("Erreur sync Tasks:", err);
                          alert("Erreur lors de la synchronisation avec Google Tasks : " + err.message);
                        });
                      }

                      setSelectedExternalEvent(null);
                      setIsEditExternalModalOpen(false);
                    }
                  }}
                >
                  Enregistrer les modifications
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setSelectedExternalEvent(null)}>Fermer</Button>
                {(selectedExternalEvent.source === 'google' || selectedExternalEvent.source === 'google-tasks') && (
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50 flex items-center gap-2"
                    onClick={async () => {
                      const isTask = selectedExternalEvent.source === 'google-tasks';
                      if (window.confirm(`Voulez-vous vraiment supprimer cet${isTask ? 'te tâche' : ' événement'} de votre compte Google ?`)) {
                        try {
                          setIsSyncing(true);
                          if (isTask) {
                            await googleCalendarService.deleteTask(state.googleAccessToken!, selectedExternalEvent.taskListId!, selectedExternalEvent.id);
                          } else {
                            await googleCalendarService.deleteEvent(state.googleAccessToken!, selectedExternalEvent.calendarId!, selectedExternalEvent.id);
                          }
                          setExternalEvents(prev => prev.filter(e => e.id !== selectedExternalEvent.id));
                          setSelectedExternalEvent(null);
                          alert(`${isTask ? 'Tâche' : 'Événement'} supprimé${isTask ? 'e' : ''} avec succès.`);
                        } catch (error: any) {
                          alert("Erreur lors de la suppression : " + error.message);
                        } finally {
                          setIsSyncing(false);
                        }
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </Button>
                )}
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => setIsEditExternalModalOpen(true)}
                >
                  Modifier l'événement
                </Button>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Confirmation de déplacement d'événement externe */}
      {isConfirmingExternalDrop && pendingExternalDrop && (
        <Modal
          isOpen={isConfirmingExternalDrop}
          onClose={() => { setIsConfirmingExternalDrop(false); setPendingExternalDrop(null); }}
          title="Confirmer la synchronisation"
        >
          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
              <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 dark:text-white">Action externe requise</h4>
                <p className="text-xs text-blue-600 dark:text-blue-400">Synchronisation avec votre agenda</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Voulez-vous vraiment déplacer cet événement de l'agenda Gmail/Outlook vers le <strong>{pendingExternalDrop.newDate.toLocaleDateString('fr-FR')}</strong> ?
              </p>
              <p className="text-xs text-gray-500 italic">
                Cette action modifiera l'événement directement dans votre compte externe. Il n'est pas possible d'annuler cette action via ProjectFlow après confirmation.
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button variant="ghost" onClick={() => { setIsConfirmingExternalDrop(false); setPendingExternalDrop(null); }}>
                Annuler
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30"
                onClick={() => {
                  const event = externalEvents.find(e => e.id === (pendingExternalDrop?.eventId));
                  if (event && pendingExternalDrop) {
                    const start = new Date(event.startDate || event.dueDate);
                    const end = new Date(event.dueDate);
                    const durationMs = end.getTime() - start.getTime();

                    const newDueDate = new Date(pendingExternalDrop.newDate);
                    newDueDate.setHours(end.getHours(), end.getMinutes(), end.getSeconds(), end.getMilliseconds());

                    const newStartDate = new Date(newDueDate.getTime() - durationMs);

                    const updatedEvent = {
                      ...event,
                      startDate: newStartDate.toISOString(),
                      dueDate: newDueDate.toISOString()
                    };

                    // Mise à jour locale
                    setExternalEvents(prev => prev.map(e => e.id === event.id ? updatedEvent : e));

                    // Synchronisation réelle avec Google Calendar
                    if (state.googleAccessToken && event.calendarId) {
                      const isAllDay = event.startDate.length === 10;
                      const updatePayload: any = {
                        summary: updatedEvent.title,
                        start: isAllDay ? { date: updatedEvent.startDate } : { dateTime: updatedEvent.startDate },
                        end: isAllDay ? { date: updatedEvent.dueDate } : { dateTime: updatedEvent.dueDate }
                      };

                      googleCalendarService.updateEvent(state.googleAccessToken, event.calendarId, event.id, updatePayload).catch(err => {
                        console.error("Erreur sync Google:", err);
                        alert("Erreur lors de la synchronisation avec Google Calendar : " + err.message);
                      });
                    }
                  }
                  setIsConfirmingExternalDrop(false);
                  setPendingExternalDrop(null);
                }}
              >
                Confirmer le déplacement
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de création d'événement */}
      {isCreateEventModalOpen && (
        <Modal
          isOpen={isCreateEventModalOpen}
          onClose={() => setIsCreateEventModalOpen(false)}
          title="Nouvel Événement Agenda"
        >
          <div className="space-y-6">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center space-x-4 border border-purple-200/30">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">Google Calendar</h4>
                <p className="text-xs text-purple-600 dark:text-purple-400">Ajouter directement à votre agenda</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Titre de l'événement</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Réunion d'équipe, Démo, etc."
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1 px-1">Début</label>
                  <input
                    type="datetime-local"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1 px-1">Fin</label>
                  <input
                    type="datetime-local"
                    value={newEvent.dueDate}
                    onChange={(e) => setNewEvent({ ...newEvent, dueDate: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Lieu</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Google Meet, Bureau, etc."
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={3}
                  placeholder="Détails de l'événement..."
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none shadow-inner"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-6 border-t border-gray-100 dark:border-gray-800">
              <Button variant="ghost" onClick={() => setIsCreateEventModalOpen(false)} className="flex-1">
                Annuler
              </Button>
              <Button
                variant="gradient"
                className="flex-1 shadow-lg shadow-purple-500/30"
                disabled={!newEvent.title || !state.googleAccessToken}
                onClick={async () => {
                  if (!state.googleAccessToken) return;
                  try {
                    setIsSyncing(true);
                    await googleCalendarService.insertEvent(state.googleAccessToken, 'primary', {
                      summary: newEvent.title,
                      description: newEvent.description,
                      location: newEvent.location,
                      start: { dateTime: new Date(newEvent.startDate).toISOString() },
                      end: { dateTime: new Date(newEvent.dueDate).toISOString() }
                    });

                    setIsCreateEventModalOpen(false);
                    alert("Événement créé avec succès dans Google Calendar !");
                    // Déclencher un rechargement
                    setCurrentDate(new Date(currentDate)); // Trick pour trigger l'effet
                  } catch (error: any) {
                    console.error("Erreur création Google:", error);
                    alert("Erreur lors de la création : " + error.message);
                  } finally {
                    setIsSyncing(false);
                  }
                }}
              >
                {!state.googleAccessToken ? "Synchronisation requise" : "Créer l'événement"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
