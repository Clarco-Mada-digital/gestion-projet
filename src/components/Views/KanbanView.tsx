import { useCallback, useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Plus, BarChart3, GripVertical } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskCard } from '../Tasks/TaskCard';
import { Card } from '../UI/Card';

// Type pour les colonnes
interface Column {
  id: 'todo' | 'in-progress' | 'done';
  title: string;
  tasks: any[];
  gradient: string;
  iconColor: string;
}

export function KanbanView() {
  const { state, dispatch } = useApp();
  const [columns, setColumns] = useState<Column[]>([]);

  // Mettre à jour les colonnes quand les tâches changent
  useEffect(() => {
    const allTasks = state.projects.flatMap(p => p.tasks);
    
    const updatedColumns: Column[] = [
      { 
        id: 'todo', 
        title: 'À faire', 
        tasks: allTasks.filter(t => t.status === 'todo'),
        gradient: 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700',
        iconColor: 'from-gray-500 to-gray-600'
      },
      { 
        id: 'in-progress', 
        title: 'En cours', 
        tasks: allTasks.filter(t => t.status === 'in-progress'),
        gradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
        iconColor: 'from-blue-500 to-cyan-500'
      },
      { 
        id: 'done', 
        title: 'Terminé', 
        tasks: allTasks.filter(t => t.status === 'done'),
        gradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
        iconColor: 'from-green-500 to-emerald-500'
      }
    ];
    
    setColumns(updatedColumns);
  }, [state.projects]);

  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
              Vue Kanban
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Visualisez le flux de vos tâches en temps réel
            </p>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {columns.map((column) => (
            <div key={column.id} className="space-y-6">
              <Card className={`bg-gradient-to-br ${column.gradient} p-6`} gradient>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-gray-900 dark:text-white text-xl">
                    {column.title}
                  </h2>
                  <div className="flex items-center space-x-3">
                    <div className={`bg-gradient-to-r ${column.iconColor} text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg`}>
                      {column.tasks.length}
                    </div>
                    <button className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 transform hover:scale-110">
                      <Plus className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <Droppable droppableId={column.id} type="task">
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-all duration-200 ${
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
                    </div>
                  )}
                </Droppable>
              </Card>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}