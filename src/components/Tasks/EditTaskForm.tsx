import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Tag as TagIcon, Users, Plus, X as XIcon } from 'lucide-react';
import { Task, SubTask, User } from '../../types';
import { useApp } from '../../context/AppContext';
import { SubTasksList } from './SubTasksList';
import { v4 as uuidv4 } from 'uuid';

interface EditTaskFormProps {
  task: Task;
  onClose: () => void;
}

export function EditTaskForm({ task, onClose }: EditTaskFormProps) {
  const { state, dispatch } = useApp();
  const [editedTask, setEditedTask] = useState<Task>({ 
    ...task,
    tags: [...(task.tags || [])],
    assignees: [...(task.assignees || [])],
    // Initialiser les dates si elles n'existent pas
    startDate: task.startDate || task.dueDate || new Date().toISOString().split('T')[0],
    endDate: task.endDate || task.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Utiliser le premier utilisateur comme utilisateur principal
  const primaryUser = state.users && state.users.length > 0 ? state.users[0] : null;
  
  // Liste des utilisateurs disponibles (tous sauf ceux déjà assignés)
  const availableUsers = state.users.filter(user => 
    !editedTask.assignees.includes(user.id)
  );
  
  // S'assurer que l'utilisateur principal est assigné par défaut pour les nouvelles tâches
  useEffect(() => {
    if (primaryUser && 
        !editedTask.assignees.length && 
        !editedTask.id) { // Seulement pour les nouvelles tâches
      setEditedTask(prev => ({
        ...prev,
        assignees: [primaryUser.id, ...prev.assignees]
      }));
    }
  }, [primaryUser, editedTask.id, editedTask.assignees.length]);

  useEffect(() => {
    setEditedTask({ 
      ...task,
      tags: [...(task.tags || [])],
      assignees: [...(task.assignees || [])]
    });
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ 
      type: 'UPDATE_TASK', 
      payload: {
        ...editedTask,
        updatedAt: new Date().toISOString()
      } 
    });
    onClose();
  };

  const handleSubTasksChange = (subTasks: SubTask[]) => {
    setEditedTask(prev => ({
      ...prev,
      subTasks: subTasks.map(st => ({
        ...st,
        updatedAt: new Date().toISOString()
      }))
    }));
  };

  const addTag = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (newTag.trim() && !editedTask.tags.includes(newTag.trim())) {
      setEditedTask(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
      setIsAddingTag(false);
    }
    return false;
  };

  const removeTag = (tagToRemove: string) => {
    setEditedTask(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const toggleAssignee = (userId: string) => {
    setEditedTask(prev => ({
      ...prev,
      assignees: prev.assignees.includes(userId)
        ? prev.assignees.filter(id => id !== userId)
        : [...prev.assignees, userId]
    }));
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
          Modifier la tâche
        </h2>
      </div>
      
      {/* Content */}
      <div className="max-h-[70vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Titre */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Titre
            </label>
            <input
              type="text"
              id="title"
              value={editedTask.title}
              onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition duration-200"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={editedTask.description || ''}
              onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition duration-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Statut */}
            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                value={editedTask.status}
                onChange={(e) => setEditedTask({...editedTask, status: e.target.value as any})}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
              >
                <option value="todo">À faire</option>
                <option value="in-progress">En cours</option>
                <option value="done">Terminé</option>
              </select>
            </div>

            {/* Priorité */}
            <div>
              <label className="block text-sm font-medium mb-1">Priorité</label>
              <select
                value={editedTask.priority}
                onChange={(e) => setEditedTask({...editedTask, priority: e.target.value as any})}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date de début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date de début
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={editedTask.startDate ? editedTask.startDate.split('T')[0] : ''}
                  onChange={(e) => setEditedTask({...editedTask, startDate: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition duration-200"
                />
              </div>
            </div>

            {/* Date de fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date de fin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={editedTask.endDate ? editedTask.endDate.split('T')[0] : ''}
                  min={editedTask.startDate || undefined}
                  onChange={(e) => setEditedTask({...editedTask, endDate: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition duration-200"
                />
              </div>
            </div>

            {/* Heures estimées */}
            <div>
              <label className="block text-sm font-medium mb-1">Heures estimées</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  value={editedTask.estimatedHours || ''}
                  onChange={(e) => setEditedTask({...editedTask, estimatedHours: parseInt(e.target.value) || 0})}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition duration-200"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Sous-tâches */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sous-tâches
            </label>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <SubTasksList 
                subTasks={editedTask.subTasks || []} 
                onSubTasksChange={handleSubTasksChange} 
              />
            </div>
          </div>

          {/* Assignés */}
          <div>
            <label className="block text-sm font-medium mb-1">Assigné à</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Afficher tous les utilisateurs assignés */}
              {state.users
                .filter(user => editedTask.assignees.includes(user.id))
                .map(user => (
                  <div 
                    key={user.id}
                    className={`flex items-center rounded-full px-3 py-1 text-xs font-medium cursor-pointer ${
                      user.id === primaryUser?.id 
                        ? 'bg-blue-600 text-white border border-blue-700 hover:bg-blue-700' 
                        : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800'
                    }`}
                    onClick={() => toggleAssignee(user.id)}
                  >
                    {user.name} {user.id === primaryUser?.id && '(Moi)'}
                    <XIcon className="ml-1 w-3 h-3" />
                  </div>
                ))}
              
              {availableUsers.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      toggleAssignee(e.target.value);
                      // La réinitialisation se fait automatiquement car on utilise value=""
                    }
                  }}
                  className="text-xs border rounded-full px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Ajouter un membre</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.id === primaryUser?.id ? '(Moi)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tags
              </label>
              {!isAddingTag ? (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  + Ajouter un tag
                </button>
              ) : (
                <form className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Nouveau tag"
                    className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition duration-200"
                    autoFocus
                  />
                  <button 
                    onClick={addTag}
                    type="submit" 
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors duration-200"
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTag(false);
                      setNewTag('');
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {editedTask.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors duration-200"
                    aria-label={`Supprimer le tag ${tag}`}
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

        
          {/* Pied de page fixe */}
          <div className="sticky bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-800 p-4 shadow-lg">
            <div className="flex justify-end space-x-3 max-w-4xl mx-auto w-full">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
              >
                Enregistrer les modifications
              </button>
            </div>
          </div>          
        </form>
      </div>
    </div>
  );
};