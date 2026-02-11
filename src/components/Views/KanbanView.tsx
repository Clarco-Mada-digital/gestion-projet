import { useCallback, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DragDropContext, RBDDroppable as Droppable, RBDDraggable as Draggable, RBDDropResult as DropResult } from '../DnDWrapper';
import { Plus, BarChart3, GripVertical, ChevronDown, X, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { TaskCard } from '../Tasks/TaskCard';
import { AddTaskForm } from '../Tasks/AddTaskForm';
import { Card } from '../UI/Card';

// Normalisation des statuts (minuscule, sans accents, sans 's' à la fin)
const normalizeStatusName = (name: string) => {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/s$/, ""); // Supprime le 's' final pour le pluriel
};

// Type pour les colonnes
interface Column {
  id: string;
  title: string;
  tasks: Task[];
  gradient: string;
  iconColor: string;
  isCustom?: boolean;
}

// Colonnes par défaut
const defaultColumns: Omit<Column, 'tasks'>[] = [
  {
    id: 'todo',
    title: 'À faire',
    gradient: 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700',
    iconColor: 'from-gray-500 to-gray-600'
  },
  {
    id: 'in-progress',
    title: 'En cours',
    gradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
    iconColor: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'done',
    title: 'Terminé',
    gradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    iconColor: 'from-green-500 to-emerald-500'
  }
];

// Couleurs disponibles pour les nouvelles colonnes
const availableColors = [
  { gradient: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20', icon: 'from-purple-500 to-violet-500' },
  { gradient: 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20', icon: 'from-amber-500 to-yellow-500' },
  { gradient: 'from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20', icon: 'from-rose-500 to-pink-500' },
  { gradient: 'from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20', icon: 'from-indigo-500 to-blue-500' },
];

export function KanbanView() {
  const { state, dispatch } = useApp();
  const [columns, setColumns] = useState<Column[]>([]);
  const [customColumns, setCustomColumns] = useState<Omit<Column, 'tasks'>[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isProjectFilterOpen, setIsProjectFilterOpen] = useState(false);
  const [isUserFilterOpen, setIsUserFilterOpen] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [addingTaskColumnId, setAddingTaskColumnId] = useState<string | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState('');
  const columnTitleRef = useRef<HTMLInputElement>(null);

  // Charger les projets
  useEffect(() => {
    // Effet de chargement des données
  }, [state.projects]);

  // Charger les colonnes personnalisées et l'ordre des colonnes
  useEffect(() => {
    let savedCols = [];
    let savedOrder = [];

    const isAllSelected = selectedProjectIds.length === 0;
    const activeProjectId = selectedProjectIds.length === 1 ? selectedProjectIds[0] : 'all';

    if (isAllSelected || selectedProjectIds.length > 1) {
      savedCols = state.appSettings.kanbanSettings?.customColumns || [];
      savedOrder = state.appSettings.kanbanSettings?.columnOrder || [];
    } else {
      const project = state.projects.find(p => p.id === activeProjectId);
      savedCols = project?.kanbanSettings?.customColumns || [];
      savedOrder = project?.kanbanSettings?.columnOrder || [];
    }

    // Fallback sur localStorage pour la migration
    if (savedCols.length === 0) {
      const localCols = localStorage.getItem('customKanbanColumns');
      if (localCols) savedCols = JSON.parse(localCols);
    }
    if (savedOrder.length === 0) {
      const localOrder = localStorage.getItem('kanbanColumnOrder');
      if (localOrder) savedOrder = JSON.parse(localOrder);
    }

    setCustomColumns(savedCols);
    setColumnOrder(savedOrder);
  }, [selectedProjectIds, state.appSettings.kanbanSettings, state.projects]);

  // Fonction utilitaire pour sauvegarder les paramètres
  const saveKanbanSettings = (updatedCols: any[], updatedOrder: string[], updatedTaskOrder?: Record<string, string[]>) => {
    const activeProjectId = selectedProjectIds.length === 1 ? selectedProjectIds[0] : 'all';

    // Récupérer l'ancien taskOrder si non fourni
    let currentTaskOrder = updatedTaskOrder;
    if (!currentTaskOrder) {
      if (activeProjectId === 'all') {
        currentTaskOrder = state.appSettings.kanbanSettings?.taskOrder || {};
      } else {
        const project = state.projects.find(p => p.id === activeProjectId);
        currentTaskOrder = project?.kanbanSettings?.taskOrder || {};
      }
    }

    const settings = {
      columnOrder: updatedOrder,
      taskOrder: currentTaskOrder,
      customColumns: updatedCols.map(c => ({
        id: c.id,
        title: c.title,
        gradient: c.gradient,
        iconColor: c.iconColor
      }))
    };

    const isAllSelected = selectedProjectIds.length === 0;
    if (isAllSelected) {
      dispatch({
        type: 'UPDATE_APP_SETTINGS',
        payload: { kanbanSettings: settings }
      });
    } else if (selectedProjectIds.length === 1) {
      const project = state.projects.find(p => p.id === selectedProjectIds[0]);
      if (project) {
        dispatch({
          type: 'UPDATE_PROJECT',
          payload: {
            ...project,
            kanbanSettings: settings,
            updatedAt: new Date().toISOString()
          }
        });
      }
    }
    // Note: Pour plusieurs projets, on ne sauvegarde pas les paramètres de colonne globalement pour le moment
    // ou on pourrait choisir de les sauvegarder dans AppSettings.

    // Garder le localStorage en backup
    localStorage.setItem('customKanbanColumns', JSON.stringify(settings.customColumns));
    localStorage.setItem('kanbanColumnOrder', JSON.stringify(settings.columnOrder));
  };

  // Mettre à jour les colonnes quand les tâches, le projet sélectionné, les colonnes personnalisées ou l'ordre changent
  useEffect(() => {
    let tasksToDisplay = [];

    if (selectedProjectIds.length === 0) {
      tasksToDisplay = state.projects
        .filter(project => project.status === 'active')
        .flatMap(p => p.tasks);
    } else {
      tasksToDisplay = state.projects
        .filter(p => selectedProjectIds.includes(p.id) && p.status === 'active')
        .flatMap(p => p.tasks);
    }

    // Filtrer par personnel
    if (selectedUserIds.length > 0) {
      tasksToDisplay = tasksToDisplay.filter(t =>
        t.assignees.some(userId => selectedUserIds.includes(userId))
      );
    }

    const defaultCols = defaultColumns.map(col => ({
      ...col,
      tasks: tasksToDisplay.filter(t => t.status === col.id)
    }));

    const storedCustomCols = customColumns.map(col => ({
      ...col,
      tasks: tasksToDisplay.filter(t => t.status === col.id),
      isCustom: true
    }));

    const existingColIds = new Set([...defaultCols, ...storedCustomCols].map(c => c.id));
    const normalizedToId = new Map<string, string>();
    [...defaultCols, ...storedCustomCols].forEach(col => {
      normalizedToId.set(normalizeStatusName(col.title), col.id);
      normalizedToId.set(normalizeStatusName(col.id), col.id);
    });

    const dynamicCols: Column[] = [];

    tasksToDisplay.forEach(task => {
      const normalizedTaskStatus = normalizeStatusName(task.status);
      const targetColId = normalizedToId.get(normalizedTaskStatus);

      if (targetColId) {
        // Rediriger la tâche vers la colonne existante correspondante
        const colIndex = [...defaultCols, ...storedCustomCols, ...dynamicCols].findIndex(c => c.id === targetColId);
        const allColsList = [...defaultCols, ...storedCustomCols, ...dynamicCols];
        const col = allColsList[colIndex];

        if (col && !col.tasks.some(t => t.id === task.id)) {
          col.tasks.push(task);
        }
      } else {
        const color = availableColors[dynamicCols.length % availableColors.length];

        // Déterminer un titre lisible. Si c'est un vieil ID technique, on essaie de l'améliorer
        let displayTitle = task.status;
        if (task.status.startsWith('custom-')) {
          displayTitle = 'Nouveau Statut';
        }

        const newCol: Column = {
          id: task.status,
          title: displayTitle,
          tasks: [task],
          gradient: color.gradient,
          iconColor: color.icon,
          isCustom: true
        };
        dynamicCols.push(newCol);
        existingColIds.add(task.status);
        normalizedToId.set(normalizedTaskStatus, task.status);
      }
    });

    const allColumns = [...defaultCols, ...storedCustomCols, ...dynamicCols];

    const activeProjectId = selectedProjectIds.length === 1 ? selectedProjectIds[0] : 'all';

    // Charger l'ordre des tâches
    let taskOrder: Record<string, string[]> = {};
    if (activeProjectId === 'all') {
      taskOrder = state.appSettings.kanbanSettings?.taskOrder || {};
    } else {
      const project = state.projects.find(p => p.id === activeProjectId);
      taskOrder = project?.kanbanSettings?.taskOrder || {};
    }

    // Fallback localStorage
    if (Object.keys(taskOrder).length === 0) {
      const savedTaskOrder = localStorage.getItem('kanbanTaskOrder');
      if (savedTaskOrder) taskOrder = JSON.parse(savedTaskOrder);
    }

    allColumns.forEach(col => {
      const orderForCol = taskOrder[col.id];
      if (orderForCol && Array.isArray(orderForCol)) {
        col.tasks.sort((a, b) => {
          const indexA = orderForCol.indexOf(a.id);
          const indexB = orderForCol.indexOf(b.id);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
      }
    });

    if (columnOrder.length > 0) {
      const allColumnIds = allColumns.map(col => col.id);
      const validOrder = columnOrder.filter(id => allColumnIds.includes(id));
      const missingColumns = allColumns.filter(col => !validOrder.includes(col.id));
      const finalOrder = [...validOrder, ...missingColumns.map(col => col.id)];

      allColumns.sort((a, b) => {
        return finalOrder.indexOf(a.id) - finalOrder.indexOf(b.id);
      });
    }

    setColumns(allColumns);
  }, [state.projects, selectedProjectIds, selectedUserIds, customColumns, columnOrder]);

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return;

    const normalizedNewTitle = normalizeStatusName(newColumnTitle);
    const allExistingCols = [...defaultColumns, ...customColumns];
    const existingCol = allExistingCols.find(col =>
      normalizeStatusName(col.title) === normalizedNewTitle ||
      normalizeStatusName(col.id) === normalizedNewTitle
    );

    if (existingCol) {
      alert(`Une colonne similaire ("${existingCol.title}") existe déjà.`);
      setIsAddingColumn(false);
      setNewColumnTitle('');
      return;
    }

    const newColumnId = `custom-${Date.now()}`;
    const selectedColor = availableColors[selectedColorIndex];

    const newColumn = {
      id: newColumnId,
      title: newColumnTitle.trim(),
      gradient: selectedColor.gradient,
      iconColor: selectedColor.icon,
      isCustom: true
    };

    const updatedCustomColumns = [...customColumns, newColumn];
    setCustomColumns(updatedCustomColumns);
    saveKanbanSettings(updatedCustomColumns, columnOrder);

    setNewColumnTitle('');
    setIsAddingColumn(false);
    setSelectedColorIndex(0);
  };

  // Renommer une colonne
  const handleRenameColumn = (columnId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      setEditingColumnId(null);
      return;
    }

    const updatedCustomColumns = customColumns.map(col => {
      if (col.id === columnId) {
        return { ...col, title: newTitle.trim() };
      }
      return col;
    });

    setCustomColumns(updatedCustomColumns);
    saveKanbanSettings(updatedCustomColumns, columnOrder);
    setEditingColumnId(null);
  };

  const handleDeleteColumn = (columnId: string) => {
    const isCustomColumn = customColumns.some(col => col.id === columnId);
    if (!isCustomColumn) return;

    if (window.confirm('Supprimer cette colonne ?')) {
      const updatedProjects = state.projects.map(project => {
        const updatedTasks = project.tasks.map(task => {
          if (task.status === columnId) {
            return { ...task, status: 'todo', updatedAt: new Date().toISOString() };
          }
          return task;
        });
        return { ...project, tasks: updatedTasks };
      });

      dispatch({ type: 'SET_PROJECTS', payload: updatedProjects });

      const updatedCustomColumns = customColumns.filter(col => col.id !== columnId);
      const updatedOrder = columnOrder.filter(id => id !== columnId);

      setCustomColumns(updatedCustomColumns);
      setColumnOrder(updatedOrder);
      saveKanbanSettings(updatedCustomColumns, updatedOrder);
    }
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!newTask.projectId) return;

    const task: Task = {
      ...newTask,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch({
      type: 'ADD_TASK',
      payload: { projectId: newTask.projectId, task: task },
    });

    setAddingTaskColumnId(null);
  };

  const handleCancelAddTask = () => {
    setAddingTaskColumnId(null);
  };

  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'COLUMN') {
      const newColumns = [...columns];
      const [movedColumn] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, movedColumn);

      const newOrder = newColumns.map(col => col.id);
      setColumns(newColumns);
      setColumnOrder(newOrder);
      saveKanbanSettings(customColumns, newOrder);
      return;
    }

    const sourceColIndex = columns.findIndex(col => col.id === source.droppableId);
    const destColIndex = columns.findIndex(col => col.id === destination.droppableId);
    if (sourceColIndex === -1 || destColIndex === -1) return;

    const newColumns: Column[] = JSON.parse(JSON.stringify(columns));
    const sourceCol = newColumns[sourceColIndex];
    const destCol = newColumns[destColIndex];
    const [movedTask] = sourceCol.tasks.splice(source.index, 1);

    movedTask.status = destination.droppableId;
    movedTask.updatedAt = new Date().toISOString();
    destCol.tasks.splice(destination.index, 0, movedTask);

    const activeProjectId = selectedProjectIds.length === 1 ? selectedProjectIds[0] : 'all';

    // Mettre à jour l'ordre
    let currentTaskOrder: Record<string, string[]> = {};
    if (activeProjectId === 'all') {
      currentTaskOrder = JSON.parse(JSON.stringify(state.appSettings.kanbanSettings?.taskOrder || {}));
    } else {
      const project = state.projects.find(p => p.id === activeProjectId);
      currentTaskOrder = JSON.parse(JSON.stringify(project?.kanbanSettings?.taskOrder || {}));
    }

    currentTaskOrder[source.droppableId] = sourceCol.tasks.map(t => t.id);
    if (source.droppableId !== destination.droppableId) {
      currentTaskOrder[destination.droppableId] = destCol.tasks.map(t => t.id);
    }

    setColumns(newColumns);
    saveKanbanSettings(customColumns, columnOrder, currentTaskOrder);
    dispatch({ type: 'UPDATE_TASK', payload: movedTask });
  }, [dispatch, columns, customColumns, columnOrder, selectedProjectIds, state.projects, state.appSettings.kanbanSettings, saveKanbanSettings]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                Vue Kanban
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
                Visualisez le flux de vos tâches en temps réel
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddingColumn(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une colonne
          </button>
        </div>

        {/* Sélecteur de projet */}
        <div className="flex items-center space-x-3">
          {/* Sélecteur de projets multiples */}
          <div className="relative">
            <button
              onClick={() => setIsProjectFilterOpen(!isProjectFilterOpen)}
              className={`flex items-center justify-between min-w-[180px] px-4 py-2 border rounded-xl shadow-sm transition-all ${selectedProjectIds.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}
            >
              <div className="flex items-center">
                <span className="text-sm font-bold truncate max-w-[120px]">
                  {selectedProjectIds.length === 0
                    ? 'Tous les projets'
                    : `${selectedProjectIds.length} projet${selectedProjectIds.length > 1 ? 's' : ''}`}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isProjectFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProjectFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProjectFilterOpen(false)} />
                <div className="absolute z-50 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2 max-h-80 overflow-y-auto custom-scrollbar">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => setSelectedProjectIds([])}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedProjectIds.length === 0 ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                      Tous les projets
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                    {state.projects.filter(p => p.status === 'active').map(project => (
                      <label key={project.id} className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
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
              </>
            )}
          </div>

          {/* Sélecteur de personnel multiple */}
          <div className="relative">
            <button
              onClick={() => setIsUserFilterOpen(!isUserFilterOpen)}
              className={`flex items-center justify-between min-w-[160px] px-4 py-2 border rounded-xl shadow-sm transition-all ${selectedUserIds.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}
            >
              <span className="text-sm font-bold">
                {selectedUserIds.length === 0
                  ? 'Personnel'
                  : `${selectedUserIds.length} person.${selectedUserIds.length > 1 ? 's' : ''}`}
              </span>
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isUserFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsUserFilterOpen(false)} />
                <div className="absolute z-50 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2 max-h-80 overflow-y-auto custom-scrollbar">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => setSelectedUserIds([])}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedUserIds.length === 0 ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                      Tout le personnel
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                    {state.cloudUser && (
                      <label className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors bg-blue-50/50 dark:bg-blue-900/10 mb-1">
                        <input
                          type="checkbox"
                          checked={!!state.cloudUser && selectedUserIds.includes(state.cloudUser.uid)}
                          onChange={(e) => {
                            if (!state.cloudUser) return;
                            if (e.target.checked) setSelectedUserIds([...selectedUserIds, state.cloudUser!.uid]);
                            else setSelectedUserIds(selectedUserIds.filter(id => id !== state.cloudUser!.uid));
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                        />
                        <div className="flex items-center truncate">
                          {state.cloudUser.photoURL ? (
                            <img src={state.cloudUser.photoURL} alt="Moi" className="w-5 h-5 rounded-full mr-2 object-cover" />
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white mr-2 uppercase">
                              M
                            </span>
                          )}
                          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 truncate">Moi</span>
                        </div>
                      </label>
                    )}
                    {state.users.map(user => (
                      <label key={user.id} className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedUserIds([...selectedUserIds, user.id]);
                            else setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                        />
                        <div className="flex items-center truncate">
                          <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-[10px] font-bold text-blue-600 mr-2">
                            {user.name.charAt(0)}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{user.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout de colonne */}
      {isAddingColumn && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center space-x-2">
            <input
              ref={columnTitleRef}
              type="text"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="Nom de la colonne"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
            />
            <div className="flex space-x-1">
              {availableColors.map((color, index) => (
                <button
                  key={index}
                  className={`w-6 h-6 rounded-full ${color.icon.replace('from-', 'bg-gradient-to-r from-').replace('to-', ' to-')} ${selectedColorIndex === index ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedColorIndex(index)}
                  title={`Couleur ${index + 1}`}
                />
              ))}
            </div>
            <button
              onClick={handleAddColumn}
              className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              disabled={!newColumnTitle.trim()}
            >
              Ajouter
            </button>
            <button
              onClick={() => {
                setIsAddingColumn(false);
                setNewColumnTitle('');
                setSelectedColorIndex(0);
              }}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex space-x-6 pb-4 px-4"
                style={{ minWidth: 'max-content' }}
              >
                {columns.map((column, index) => (
                  <Draggable
                    key={column.id}
                    draggableId={column.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex-shrink-0 w-[450px] h-full ${snapshot.isDragging ? 'shadow-2xl z-10' : 'shadow-md hover:shadow-lg'
                          }`}
                        style={{
                          ...provided.draggableProps.style,
                          opacity: snapshot.isDragging ? 0.9 : 1,
                        }}
                      >
                        <Card
                          className={`bg-gradient-to-br ${column.gradient} p-4 h-full flex flex-col`}
                          gradient
                          blur={!snapshot.isDragging}
                        >
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center group">
                              <div
                                className="p-1 -ml-2 mr-1 rounded-md hover:bg-white/20 transition-colors cursor-grab active:cursor-grabbing touch-none"
                                {...provided.dragHandleProps}
                                title="Déplacer la colonne"
                              >
                                <GripVertical
                                  className="w-5 h-5 text-gray-100 dark:text-gray-300 opacity-70 group-hover:opacity-100 transition-opacity"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                {editingColumnId === column.id ? (
                                  <input
                                    type="text"
                                    value={editingColumnTitle}
                                    onChange={(e) => setEditingColumnTitle(e.target.value)}
                                    onBlur={() => handleRenameColumn(column.id, editingColumnTitle)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRenameColumn(column.id, editingColumnTitle)}
                                    className="w-full bg-white/20 border-none rounded px-2 py-1 text-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    autoFocus
                                  />
                                ) : (
                                  <h2
                                    className="font-bold text-gray-900 dark:text-white text-xl truncate cursor-pointer hover:bg-white/10 rounded px-1 -ml-1 transition-colors"
                                    onClick={() => {
                                      if (column.isCustom) {
                                        setEditingColumnId(column.id);
                                        setEditingColumnTitle(column.title);
                                      }
                                    }}
                                    title={column.isCustom ? "Cliquez pour renommer" : ""}
                                  >
                                    {column.title}
                                  </h2>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`bg-gradient-to-r ${column.iconColor} text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg`}>
                                {column.tasks.length}
                              </div>
                              {column.isCustom && (
                                <div
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    handleDeleteColumn(column.id);
                                  }}
                                  className="p-1.5 rounded-lg transition-all duration-200 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                                  title="Supprimer la colonne"
                                  data-column-id={column.id}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAddingTaskColumnId(column.id);
                                }}
                                className={`p-2 rounded-xl transition-all duration-200 transform hover:scale-110 ${addingTaskColumnId === column.id
                                  ? 'bg-white/20 text-white'
                                  : 'hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-500'
                                  }`}
                                title="Ajouter une tâche"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <Droppable droppableId={column.id} type="task">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`flex-1 overflow-y-auto scrollbar-thin p-2 rounded-lg custom-scrollbar ${snapshot.isDraggingOver
                                  ? 'bg-black/5 dark:bg-white/5 ring-2 ring-blue-400/50'
                                  : 'bg-transparent'
                                  }`}
                              >
                                {column.tasks.length > 0 ? (
                                  column.tasks.map((task, index) => (
                                    <Draggable
                                      key={task.id}
                                      draggableId={task.id}
                                      index={index}
                                    >
                                      {(provided, snapshot) => {
                                        const draggableContent = (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`mb-3 outline-none ${snapshot.isDragging ? 'z-[9999]' : ''}`}
                                            style={{
                                              ...provided.draggableProps.style,
                                              cursor: snapshot.isDragging ? 'grabbing' : 'pointer',
                                              // Assure que la largeur est préservée pendant le portail
                                              width: snapshot.isDragging ? '400px' : (provided.draggableProps.style as any)?.width,
                                            }}
                                          >
                                            <TaskCard
                                              task={task}
                                              showProject
                                              isDragging={snapshot.isDragging}
                                              className={snapshot.isDragging ? 'ring-2 ring-blue-500 shadow-2xl opacity-90' : ''}
                                            />
                                          </div>
                                        );

                                        if (snapshot.isDragging) {
                                          return createPortal(draggableContent, document.body);
                                        }

                                        return draggableContent;
                                      }}
                                    </Draggable>
                                  ))
                                ) : (
                                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm h-[150px] flex flex-col items-center justify-center">
                                    <div className={`w-12 h-12 bg-gradient-to-r ${column.iconColor} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg opacity-50`}>
                                      <Plus className="w-6 h-6 text-white" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                      Aucune tâche {column.title.toLowerCase()}
                                    </p>
                                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                                      Glissez une tâche ici
                                    </p>
                                  </div>
                                )}
                                {provided.placeholder}

                                {/* Formulaire d'ajout de tâche */}
                                {addingTaskColumnId === column.id && (
                                  <div className="mt-3">
                                    <AddTaskForm
                                      projects={state.projects}
                                      selectedProjectId={selectedProjectIds.length === 1 ? selectedProjectIds[0] : (state.projects[0]?.id || '')}
                                      status={column.id}
                                      onAddTask={handleAddTask}
                                      onCancel={handleCancelAddTask}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </Droppable>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}