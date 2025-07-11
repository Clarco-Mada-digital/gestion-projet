import { useCallback, useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Plus, BarChart3, GripVertical, ChevronDown, ChevronUp, X, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskCard } from '../Tasks/TaskCard';
import { AddTaskForm } from '../Tasks/AddTaskForm';
import { Card } from '../UI/Card';

// Type pour les colonnes
interface Column {
  id: string;
  title: string;
  tasks: any[];
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
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all');
  const [isProjectSelectOpen, setIsProjectSelectOpen] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [addingTaskColumnId, setAddingTaskColumnId] = useState<string | null>(null);
  const columnTitleRef = useRef<HTMLInputElement>(null);

  // Charger les projets
  useEffect(() => {
    // Effet de chargement des données
  }, [state.projects]);

  // Charger les colonnes personnalisées et l'ordre des colonnes depuis le stockage local
  useEffect(() => {
    const savedColumns = localStorage.getItem('customKanbanColumns');
    const savedOrder = localStorage.getItem('kanbanColumnOrder');
    
    if (savedColumns) {
      setCustomColumns(JSON.parse(savedColumns));
    }
    
    if (savedOrder) {
      setColumnOrder(JSON.parse(savedOrder));
    }
  }, []);

  // Mettre à jour les colonnes quand les tâches, le projet sélectionné, les colonnes personnalisées ou l'ordre changent
  useEffect(() => {
    let tasksToDisplay = [];
    
    if (selectedProjectId === 'all') {
      // Ne prendre que les tâches des projets actifs
      tasksToDisplay = state.projects
        .filter(project => project.status === 'active')
        .flatMap(p => p.tasks);
    } else {
      // Vérifier que le projet sélectionné est actif
      const selectedProject = state.projects.find(p => p.id === selectedProjectId);
      tasksToDisplay = (selectedProject && selectedProject.status === 'active') 
        ? selectedProject.tasks 
        : [];
    }

    // Créer les colonnes par défaut avec leurs tâches
    const defaultCols = defaultColumns.map(col => ({
      ...col,
      tasks: tasksToDisplay.filter(t => t.status === col.id)
    }));

    // Créer les colonnes personnalisées avec leurs tâches
    const customCols = customColumns.map(col => ({
      ...col,
      tasks: tasksToDisplay.filter(t => t.status === col.id),
      isCustom: true
    }));
    
    // Fusionner les colonnes
    const allColumns = [...defaultCols, ...customCols];
    
    // Si on a un ordre défini, on l'applique
    if (columnOrder.length > 0) {
      // Vérifier que toutes les colonnes sont dans l'ordre
      const allColumnIds = allColumns.map(col => col.id);
      const validOrder = columnOrder.filter(id => allColumnIds.includes(id));
      
      // Ajouter les colonnes manquantes à la fin
      const missingColumns = allColumns.filter(col => !validOrder.includes(col.id));
      const finalOrder = [...validOrder, ...missingColumns.map(col => col.id)];
      
      // Trier les colonnes selon l'ordre défini
      allColumns.sort((a, b) => {
        return finalOrder.indexOf(a.id) - finalOrder.indexOf(b.id);
      });
    }
    
    setColumns(allColumns);
  }, [state.projects, selectedProjectId, customColumns, columnOrder]);

  // Ajouter une nouvelle colonne personnalisée
  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return;
    
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
    
    // Sauvegarder dans le stockage local
    localStorage.setItem('customKanbanColumns', JSON.stringify(updatedCustomColumns));
    
    // Réinitialiser le formulaire
    setNewColumnTitle('');
    setIsAddingColumn(false);
    setSelectedColorIndex(0);
  };

  // Supprimer une colonne personnalisée avec confirmation
  const handleDeleteColumn = (columnId: string) => {
    console.log('handleDeleteColumn appelée avec ID:', columnId);
    
    // Vérifier si la colonne est une colonne personnalisée
    const isCustomColumn = customColumns.some(col => col.id === columnId);
    console.log('Est une colonne personnalisée:', isCustomColumn);
    
    if (!isCustomColumn) {
      console.log('La colonne ne peut pas être supprimée car elle n\'est pas personnalisée');
      return;
    }
    
    // Demander confirmation avant de supprimer
    const confirmDelete = window.confirm(
      'Êtes-vous sûr de vouloir supprimer cette colonne ? Toutes les tâches qu\'elle contient seront déplacées dans "À faire".'
    );
    
    if (confirmDelete) {
      // Mettre à jour les tâches des projets
      const updatedProjects = state.projects.map(project => {
        const updatedTasks = project.tasks.map(task => {
          if (task.status === columnId) {
            return {
              ...task,
              status: 'todo',
              updatedAt: new Date().toISOString()
            };
          }
          return task;
        });
        
        return {
          ...project,
          tasks: updatedTasks
        };
      });
      
      // Mettre à jour les projets avec les tâches mises à jour
      dispatch({
        type: 'SET_PROJECTS',
        payload: updatedProjects
      });
      
      // Mettre à jour l'état local des colonnes personnalisées
      const updatedCustomColumns = customColumns.filter(col => col.id !== columnId);
      setCustomColumns(updatedCustomColumns);
      localStorage.setItem('customKanbanColumns', JSON.stringify(updatedCustomColumns));
      
      // Mettre à jour l'ordre des colonnes
      const updatedOrder = columnOrder.filter(id => id !== columnId);
      setColumnOrder(updatedOrder);
      localStorage.setItem('kanbanColumnOrder', JSON.stringify(updatedOrder));
      
      // Forcer la mise à jour des colonnes
      setColumns(prevColumns => prevColumns.filter(col => col.id !== columnId));
    }
  };

  // Ajouter une nouvelle tâche
  const handleAddTask = (newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!newTask.projectId) {
      console.error('Impossible d\'ajouter une tâche sans projet');
      return;
    }

    const task: Task = {
      ...newTask,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch({
      type: 'ADD_TASK',
      payload: {
        projectId: newTask.projectId,
        task: task
      },
    });

    setAddingTaskColumnId(null);
  };

  // Annuler l'ajout d'une tâche
  const handleCancelAddTask = () => {
    setAddingTaskColumnId(null);
  };

  // Réorganiser les colonnes
  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination, type } = result;

    // Si pas de destination, on ne fait rien
    if (!destination) return;

    // Gestion du déplacement des colonnes
    if (type === 'COLUMN') {
      const newColumnOrder = Array.from(columnOrder);
      // Si c'est la première fois qu'on déplace des colonnes, initialiser l'ordre
      if (newColumnOrder.length === 0) {
        newColumnOrder.push(...columns.map(col => col.id));
      }
      
      const [movedColumnId] = newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, movedColumnId);
      
      // Mettre à jour l'ordre des colonnes
      setColumnOrder(newColumnOrder);
      localStorage.setItem('kanbanColumnOrder', JSON.stringify(newColumnOrder));
      
      // Mettre à jour l'ordre des colonnes dans l'état
      const newColumns = [...columns];
      const movedColumnIndex = newColumns.findIndex(col => col.id === movedColumnId);
      const [movedColumn] = newColumns.splice(movedColumnIndex, 1);
      newColumns.splice(destination.index, 0, movedColumn);
      
      setColumns(newColumns);
      return;
    }

    // Gestion du déplacement des tâches (code existant)
    const { source: taskSource, destination: taskDestination } = result;
    if (!taskDestination) return;
    if (taskSource.droppableId === taskDestination.droppableId && taskSource.index === taskDestination.index) return;

    // Vérifier si le drop est valide
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Trouver la colonne source
    const sourceColIndex = columns.findIndex(col => col.id === source.droppableId);
    const destColIndex = columns.findIndex(col => col.id === destination.droppableId);
    
    if (sourceColIndex === -1 || destColIndex === -1) return;

    // Créer une copie des colonnes
    const newColumns = [...columns];
    
    // Retirer la tâche de la colonne source
    const [movedTask] = newColumns[sourceColIndex].tasks.splice(source.index, 1);
    
    // Mettre à jour le statut de la tâche
    movedTask.status = destination.droppableId as 'todo' | 'in-progress' | 'done';
    movedTask.updatedAt = new Date().toISOString();
    
    // Ajouter la tâche à la colonne de destination
    newColumns[destColIndex].tasks.splice(destination.index, 0, movedTask);
    
    // Mettre à jour l'état local immédiatement pour un meilleur ressenti
    setColumns(newColumns);
    
    // Mettre à jour l'état global
    dispatch({
      type: 'UPDATE_TASK',
      payload: movedTask
    });
  }, [dispatch, columns]);

  return (
    <div className="space-y-8 max-h-[95vh] overflow-y-hidden">
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
        <div className="relative">
          <button 
            onClick={() => setIsProjectSelectOpen(!isProjectSelectOpen)}
            className="flex items-center justify-between w-full md:w-64 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="truncate">
              {selectedProjectId === 'all' 
                ? 'Tous les projets' 
                : state.projects.find(p => p.id === selectedProjectId)?.name || 'Sélectionner un projet'}
            </span>
            {isProjectSelectOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400 ml-2" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400 ml-2" />
            )}
          </button>
          
          {isProjectSelectOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsProjectSelectOpen(false)}
              />
              <div className="absolute z-50 mt-1 w-full md:w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedProjectId('all');
                      setIsProjectSelectOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedProjectId === 'all' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''
                    }`}
                  >
                    Tous les projets
                  </button>
                  {state.projects
                    .filter(project => project.status === 'active')
                    .map(project => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setIsProjectSelectOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center ${
                        selectedProjectId === project.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''
                      }`}
                    >
                      <div 
                        className="w-2 h-2 rounded-full mr-3 flex-shrink-0" 
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="truncate">{project.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
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
                    className={`flex-shrink-0 w-[450px] min-h-[80vh] space-y-6 transition-all duration-200 ${
                      snapshot.isDragging ? 'shadow-2xl scale-105 z-10' : 'shadow-md hover:shadow-lg'
                    }`}
                    style={{
                      ...provided.draggableProps.style,
                      opacity: snapshot.isDragging ? 0.9 : 1,
                      transform: `${provided.draggableProps.style?.transform || ''} ${
                        snapshot.isDragging ? 'rotate(1deg)' : ''
                      }`,
                    }}
                  >
                    <Card 
                      className={`bg-gradient-to-br ${column.gradient} p-6`} 
                      gradient
                      onClick={(e) => {
                        // Empêcher la propagation des événements de clic sur la carte
                        e.stopPropagation();
                      }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center group">
                          <div 
                            className="p-1 -ml-2 mr-1 rounded-md hover:bg-white/20 transition-colors cursor-grab active:cursor-grabbing"
                            {...provided.dragHandleProps}
                            title="Déplacer la colonne"
                          >
                            <GripVertical 
                              className="w-5 h-5 text-gray-100 dark:text-gray-300 opacity-70 group-hover:opacity-100 transition-opacity" 
                            />
                          </div>
                          <h2 className="font-bold text-gray-900 dark:text-white text-xl">
                            {column.title}
                          </h2>
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
                                console.log('Bouton de suppression cliqué pour la colonne:', column.id);
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
                            className={`p-2 rounded-xl transition-all duration-200 transform hover:scale-110 ${
                              addingTaskColumnId === column.id 
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
                        className={`space-y-3 max-h-[75vh] overflow-y-auto scrollbar-thin p-2 rounded-lg transition-all duration-200 ${
                          snapshot.isDraggingOver 
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
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`mb-2 group ${snapshot.isDragging ? 'opacity-80' : 'opacity-100'}`}
                                >
                                  <div className="flex items-start">
                                    <div 
                                      className="p-1 -ml-1 mr-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                      {...provided.dragHandleProps}
                                    >
                                      <GripVertical 
                                        size={16} 
                                        className="text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" 
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <TaskCard 
                                        task={task} 
                                        showProject 
                                        className={`transition-transform duration-200 ${
                                          snapshot.isDragging 
                                            ? 'shadow-lg scale-[1.02] rotate-1' 
                                            : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'
                                        }`} 
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
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
                              selectedProjectId={selectedProjectId === 'all' ? state.projects[0]?.id || '' : selectedProjectId}
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