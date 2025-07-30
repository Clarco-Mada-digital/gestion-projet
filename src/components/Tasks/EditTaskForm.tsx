import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar as CalendarIcon, Clock, Tag as TagIcon, Users, Plus, X as XIcon } from 'lucide-react';
import { Task, User, Project, SubTask } from '../../types';
import { useApp } from '../../context/AppContext';
import { SubTasksList } from './SubTasksList';
import type { SubTasksListProps } from './SubTasksList';

// Fonction de validation des données de la tâche
const validateTaskData = (task: Task): Task => {
  const dueDate = task.dueDate || new Date().toISOString().split('T')[0];
  
  const validatedTask: Task = {
    ...task,
    title: task.title || '',
    description: task.description || '',
    startDate: task.startDate || new Date().toISOString().split('T')[0],
    dueDate: dueDate,
    priority: task.priority || 'medium',
    estimatedHours: typeof task.estimatedHours === 'number' ? task.estimatedHours : 0,
    tags: Array.isArray(task.tags) ? task.tags : [],
    assignees: Array.isArray(task.assignees) ? task.assignees : [],
    subTasks: Array.isArray(task.subTasks) ? task.subTasks : [],
    status: task.status || 'todo',
    projectId: task.projectId || '',
    id: task.id || '',
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || new Date().toISOString()
  };
  
  return validatedTask;
};

interface EditTaskFormProps {
  task: Task;
  onClose: () => void;
  project: Project;
}

export function EditTaskForm({ task, onClose, project }: EditTaskFormProps) {
  const { state, dispatch } = useApp();
  
  // Le projet est déjà passé en props, pas besoin de le chercher

  // State initial avec validation
  const [editedTask, setEditedTask] = useState<Task>(() => {
    const dueDate = task.dueDate || new Date().toISOString().split('T')[0];
    
    return validateTaskData({
      ...task,
      tags: [...(task.tags || [])],
      assignees: [...(task.assignees || [])],
      startDate: task.startDate || new Date().toISOString().split('T')[0],
      dueDate: dueDate,
      priority: task.priority || 'medium',
      estimatedHours: task.estimatedHours || 0,
      subTasks: [...(task.subTasks || [])],
      completedAt: task.completedAt,
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: task.updatedAt || new Date().toISOString()
    });
  });

  // Gérer les changements des sous-tâches
  const handleSubTasksChange = useCallback((newSubTasks: SubTask[]) => {
    setEditedTask(prev => ({
      ...prev,
      subTasks: newSubTasks,
      updatedAt: new Date().toISOString()
    }));
  }, []);

  // Gérer l'ajout d'un tag
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Empêche la propagation de l'événement au formulaire parent
    
    const tagToAdd = newTag.trim();
    if (tagToAdd && !editedTask.tags.includes(tagToAdd)) {
      const updatedTags = [...editedTask.tags, tagToAdd];
      setEditedTask(prev => ({
        ...prev,
        tags: updatedTags,
        updatedAt: new Date().toISOString()
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    const updatedTags = editedTask.tags.filter(t => t !== tag);
    setEditedTask(prev => ({
      ...prev,
      tags: updatedTags,
      updatedAt: new Date().toISOString()
    }));
  };

  // Gérer l'ajout d'un assigné
  const [isAddingAssignee, setIsAddingAssignee] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');

  const handleAddAssignee = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (!editedTask.assignees.includes(userId)) {
      const updatedAssignees = [...editedTask.assignees, userId];
      setEditedTask(prev => ({
        ...prev,
        assignees: updatedAssignees,
        updatedAt: new Date().toISOString()
      }));
    }
    setAssigneeSearch('');
    setIsAddingAssignee(false);
  };

  const handleRemoveAssignee = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    const updatedAssignees = editedTask.assignees.filter(id => id !== userId);
    setEditedTask(prev => ({
      ...prev,
      assignees: updatedAssignees,
      updatedAt: new Date().toISOString()
    }));
  };

  // Gérer la soumission du formulaire avec validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Valider les données
      const validatedTask = validateTaskData(editedTask);
      
      // Vérifier que les données sont valides
      if (!validatedTask.title || !validatedTask.projectId) {
        throw new Error('Le titre et le projet sont requis');
      }
      
      // Vérifier que les dates sont valides
      const startDate = new Date(validatedTask.startDate);
      const dueDate = new Date(validatedTask.dueDate);
      
      if (isNaN(startDate.getTime()) || isNaN(dueDate.getTime())) {
        throw new Error('Les dates doivent être valides');
      }
      
      // Vérifier que la date de début est inférieure ou égale à la date d'échéance
      if (startDate > dueDate) {
        throw new Error('La date de début doit être antérieure ou égale à la date d\'échéance');
      }
      
      // Préparer les données mises à jour
      const updatedTask: Task = {
        ...validatedTask,
        updatedAt: new Date().toISOString(),
        completedAt: validatedTask.status === 'done' && task.status !== 'done' 
          ? new Date().toISOString() 
          : validatedTask.completedAt ?? undefined
      };
      
      // Mettre à jour la tâche
      dispatch({
        type: 'UPDATE_TASK',
        payload: updatedTask
      });
      
      // Fermer le formulaire
      onClose();
    } catch (error) {
      console.error('Erreur lors de la modification de la tâche:', error);
      alert('Une erreur est survenue lors de la modification de la tâche. Veuillez vérifier les données.');
    }
  };

  // Filtrer les utilisateurs disponibles pour l'assignation
  const availableUsers = state.users.filter(
    (user: User) => !editedTask.assignees.includes(user.id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Modifier la tâche
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium mb-1">Titre</label>
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition duration-200"
              placeholder="Titre de la tâche"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={editedTask.description}
              onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
              rows={4}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition duration-200 resize-y"
              placeholder="Description détaillée de la tâche"
            />
          </div>

          {/* Priorité et Statut sur la même ligne */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priorité */}
            <div>
              <label className="block text-sm font-medium mb-1">Priorité</label>
              <select
                value={editedTask.priority}
                onChange={(e) => setEditedTask({...editedTask, priority: e.target.value})}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition duration-200"
              >
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                value={editedTask.status}
                onChange={(e) => setEditedTask({...editedTask, status: e.target.value})}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition duration-200"
              >
                <option value="todo">À faire</option>
                <option value="in-progress">En cours</option>
                <option value="done">Terminé</option>
                <option value="blocked">Bloqué</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex flex-wrap gap-2">
              {isAddingTag ? (
                <form onSubmit={handleAddTag} className="flex items-center">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-l-full border border-r-0 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                    placeholder="Nouveau tag"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-r-full hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
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
              ) : (
                <button
                  onClick={() => setIsAddingTag(true)}
                  className="flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un tag
                </button>
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

          {/* Sous-tâches */}
          <div>
            <label className="block text-sm font-medium mb-1">Sous-tâches</label>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <SubTasksList 
                subTasks={editedTask.subTasks || []} 
                onSubTasksChange={handleSubTasksChange}
                project={project}
                task={editedTask}
              />
            </div>
          </div>

          {/* Dates et estimation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date de début */}
            <div>
              <label className="block text-sm font-medium mb-1">Date de début</label>
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

            {/* Date d'échéance */}
            <div>
              <label className="block text-sm font-medium mb-1">Date d'échéance</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={editedTask.dueDate ? editedTask.dueDate.split('T')[0] : ''}
                  min={editedTask.startDate || undefined}
                  onChange={(e) => setEditedTask({...editedTask, dueDate: e.target.value})}
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

          {/* Assignés */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1">Assigné à</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Afficher tous les utilisateurs assignés */}
              {state.users
                .filter(user => editedTask.assignees.includes(user.id))
                .map(user => (
                  <div 
                    key={user.id}
                    className="flex items-center rounded-full px-3 py-1.5 text-sm font-medium cursor-pointer bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/70 transition-colors duration-200"
                    onClick={(e) => handleRemoveAssignee(e, user.id)}
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-xs font-medium text-blue-800 dark:text-blue-200 mr-2 shrink-0">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="whitespace-nowrap">{user.name || user.email}</span>
                    <XIcon className="w-3.5 h-3.5 ml-1.5 opacity-70 hover:opacity-100" />
                  </div>
                ))}
              
              {/* Menu déroulant pour ajouter un assigné */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddingAssignee(!isAddingAssignee);
                  }}
                  className="flex items-center px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors duration-200"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Ajouter un membre
                </button>
                
                {isAddingAssignee && (
                  <div 
                    className="absolute z-10 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Rechercher un membre..."
                          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {state.users
                        .filter(user => 
                          !editedTask.assignees.includes(user.id) &&
                          (assigneeSearch === '' || 
                           user.name?.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
                           user.email?.toLowerCase().includes(assigneeSearch.toLowerCase()))
                        )
                        .map(user => (
                          <div
                            key={user.id}
                            onClick={(e) => handleAddAssignee(e, user.id)}
                            className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-sm font-medium text-blue-800 dark:text-blue-200 mr-3">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{user.name || 'Utilisateur sans nom'}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        ))}
                      {state.users.filter(user => 
                        !editedTask.assignees.includes(user.id) &&
                        (assigneeSearch === '' || 
                         user.name?.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
                         user.email?.toLowerCase().includes(assigneeSearch.toLowerCase()))
                      ).length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                          Aucun membre trouvé
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex flex-wrap gap-2">
              {isAddingTag ? (
                <form onSubmit={handleAddTag} className="flex items-center">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-l-full border border-r-0 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                    placeholder="Nouveau tag"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-r-full hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
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
              ) : (
                <button
                  onClick={() => setIsAddingTag(true)}
                  className="flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un tag
                </button>
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
          <div className="sticky bottom-0 left-0 right-0 border rounded-lg border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-800 p-4 shadow-lg">
            <div className="flex justify-between space-x-3 max-w-4xl mx-auto w-full">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-700 transition-colors duration-200"
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
}
