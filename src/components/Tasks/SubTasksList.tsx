import React, { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { SubTask } from '../../types';

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

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">Sous-tâches</h3>
      
      <form className="flex gap-2 mb-3">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border bg-transparent rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Ajouter une sous-tâche"
        />
        <div className="flex gap-1">
          <button
            type="button"
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

      <div className="space-y-2">
        {subTasks.map(task => (
          <div 
            key={task.id} 
            className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
            onClick={() => toggleTask(task.id)}
          >
            <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
              task.completed ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
            }`}>
              {task.completed && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-sm ${task.completed ? 'line-through text-gray-400' : ''}`}>
              {task.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
