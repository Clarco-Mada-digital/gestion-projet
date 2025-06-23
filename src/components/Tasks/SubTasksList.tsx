import React, { useState } from 'react';
import { Check, Plus, Trash2, GripVertical } from 'lucide-react';
import { SubTask } from '../../types';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface SubTasksListProps {
  subTasks: SubTask[];
  onSubTasksChange: (subTasks: SubTask[]) => void;
}

export function SubTasksList({ subTasks = [], onSubTasksChange }: SubTasksListProps) {
  const [newTask, setNewTask] = useState('');

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Empêche la propagation de l'événement
    
    if (newTask.trim()) {
      const task: SubTask = {
        id: Date.now().toString(),
        title: newTask.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onSubTasksChange([...subTasks, task]);
      setNewTask('');
    }
    
    return false; // Empêche le comportement par défaut du formulaire
  };

  const toggleTask = (id: string) => {
    const updated = subTasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    onSubTasksChange(updated);
  };

  const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = subTasks.filter(task => task.id !== id);
    onSubTasksChange(updated);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(subTasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onSubTasksChange(items);
  };

  return (
    <div className="mt-2">
      <h3 className="text-sm font-medium mb-2">Sous-tâches</h3> 

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="subtasks">
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef}
              className="space-y-2"
            >
              {subTasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group"
                      onClick={() => toggleTask(task.id)}
                    >
                      <div 
                        {...provided.dragHandleProps}
                        className="p-1 mr-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-move"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                        task.completed ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                      }`}>
                        {task.completed && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm flex-1 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                        {task.title}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => deleteTask(task.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                        title="Supprimer la sous-tâche"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <form className="flex gap-2 mt-3">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Ajouter une sous-tâche"
        />
        <div className="flex gap-1">
          <button
            type="submit"
            onClick={addTask}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            title="Ajouter une sous-tâche"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Fonctionnalité IA à implémenter
              console.log('Génération de sous-tâches avec IA');
            }}
            className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1 text-xs"
            title="Générer avec IA"
          >
            <Plus className="w-3 h-3" />
            <span>IA</span>
          </button>
        </div>
      </form>

    </div>
  );
}
