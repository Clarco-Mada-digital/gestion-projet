import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, FolderOpen, MoreHorizontal, Edit, Trash2, Archive, AlertTriangle, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { Project, Task } from '../../types';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onArchive: (project: Project) => void;
  onDelete: (project: Project) => void;
  getProjectStats: (project: Project) => { totalTasks: number; completedTasks: number };
  children?: React.ReactNode;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onEdit, 
  onArchive, 
  onDelete, 
  getProjectStats,
  children 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const stats = getProjectStats(project);
  const progress = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Card className="p-6 group" hover gradient>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div 
            className="w-5 h-5 rounded-full shadow-lg"
            style={{ backgroundColor: project.color }}
          />
          <h3 className="font-bold text-gray-900 dark:text-white text-xl">
            {project.name}
          </h3>
        </div>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200"
            aria-label="Options du projet"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => onEdit(project)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Edit className="w-4 h-4 mr-3" />
                Modifier
              </button>
              <button
                onClick={() => onArchive(project)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Archive className="w-4 h-4 mr-3" />
                {project.status === 'archived' ? 'Désarchiver' : 'Archiver'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <Trash2 className="w-4 h-4 mr-3" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      {project.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed">
          {project.description}
        </p>
      )}

      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Progression</span>
          <span className="font-bold text-gray-900 dark:text-white">
            {stats.completedTasks}/{stats.totalTasks}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 transition-all duration-500 shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {children}
    </Card>
  );
};

export function ProjectsView() {
  const { state, dispatch } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const [showCompletedProjects, setShowCompletedProjects] = useState(false);
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);

  const [newProject, setNewProject] = useState<Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { tasks: Task[] }>({
    name: '',
    description: '',
    color: '#0EA5E9',
    status: 'active',
    tasks: []
  });
  
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'subTasks'>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0],
    assignees: [],
    tags: [],
    notes: '',
    estimatedHours: 0
  });



  const addTask = () => {
    if (!newTask.title.trim()) return;
    
    const taskToAdd: Task = {
      ...newTask,
      id: uuidv4(),
      projectId: editingProject?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subTasks: []
    };
    
    if (editingProject) {
      // Ajouter la tâche au projet en cours d'édition
      setEditingProject({
        ...editingProject,
        tasks: [...(editingProject.tasks || []), taskToAdd]
      });
    } else {
      // Ajouter la tâche au nouveau projet
      setNewProject({
        ...newProject,
        tasks: [...newProject.tasks, taskToAdd]
      });
    }
    
    // Réinitialiser le formulaire de tâche
    setNewTask({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0],
      assignees: [],
      tags: [],
      notes: '',
      estimatedHours: 0
    });
  };
  
  const removeTask = (taskId: string, isEditing: boolean = false) => {
    if (isEditing) {
      if (!editingProject) return;
      
      const updatedTasks = editingProject.tasks?.filter(task => task.id !== taskId) || [];
      setEditingProject({
        ...editingProject,
        tasks: updatedTasks
      });
    } else {
      setNewProject({
        ...newProject,
        tasks: newProject.tasks?.filter(t => t.id !== taskId) || []
      });
    }
  };

  const createProject = () => {
    if (!newProject.name.trim()) return;

    const project: Project = {
      id: Date.now().toString(),
      name: newProject.name,
      description: newProject.description,
      color: newProject.color,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: (newProject.tasks || []).map(task => ({
        ...task,
        id: task.id || uuidv4(),
        projectId: '', // Sera mis à jour avec l'ID du projet
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subTasks: []
      }))
    };

    dispatch({ type: 'ADD_PROJECT', payload: project });
    setNewProject({ 
      name: '', 
      description: '', 
      color: '#0EA5E9', 
      status: 'active',
      tasks: []
    });
    setShowCreateModal(false);
  };

  const updateProject = () => {
    if (!editingProject) return;

    const updatedProject: Project = {
      ...editingProject,
      updatedAt: new Date().toISOString(),
      // S'assurer que les tâches ont toutes les propriétés requises
      tasks: editingProject.tasks?.map(task => ({
        ...task,
        subTasks: task.subTasks || [],
        assignees: task.assignees || [],
        tags: task.tags || [],
        dueDate: task.dueDate || new Date().toISOString().split('T')[0],
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        createdAt: task.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })) || []
    };

    dispatch({
      type: 'UPDATE_PROJECT',
      payload: updatedProject
    });

    setEditingProject(null);
  };
  


  const getProjectStats = (project: Project) => {
    const totalTasks = project.tasks?.length || 0;
    const completedTasks = project.tasks?.filter(t => t.status === 'done').length || 0;
    const inProgressTasks = project.tasks?.filter(t => t.status === 'in-progress').length || 0;
    const todoTasks = project.tasks?.filter(t => t.status === 'todo').length || 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  };

  const handleUpdateProjectStatus = (project: Project, newStatus: 'active' | 'on-hold' | 'archived') => {
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        ...project,
        status: newStatus,
        updatedAt: new Date().toISOString()
      }
    });
  };

  const handleArchiveProject = (project: Project) => {
    handleUpdateProjectStatus(project, project.status === 'archived' ? 'active' : 'archived');
    setShowMenuId(null);
  };

  const handleActivateProject = (project: Project) => {
    handleUpdateProjectStatus(project, 'active');
  };

  const handleCompleteProject = (project: Project) => {
    handleUpdateProjectStatus(project, 'completed');
  };

  const confirmDeleteProject = () => {
    if (!projectToDelete) return;

    try {
      dispatch({ type: 'DELETE_PROJECT', payload: projectToDelete.id });

      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'success',
          message: `Le projet "${projectToDelete.name}" a été supprimé avec succès`,
          timeout: 5000
        }
      });
    } catch (error) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: 'Une erreur est survenue lors de la suppression du projet',
          timeout: 5000
        }
      });
      console.error('Erreur lors de la suppression du projet:', error);
    } finally {
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
      setShowMenuId(null);
    }
  };

  const startEditing = (project: Project) => {
    setEditingProject({
      ...project,
      tasks: project.tasks || []
    });
    // Réinitialiser le formulaire de tâche
    setNewTask({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0],
      assignees: [],
      tags: [],
      notes: '',
      estimatedHours: 0
    });
  };

  const colors = [
    '#0EA5E9', 
    '#8B5CF6', 
    '#EC4899', 
    '#10B981', 
    '#F59E0B', 
    '#EF4444', 
    '#06B6D4', 
    '#F97316'  
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projets</h1>
        <Button
          icon={Plus}
          onClick={() => setShowCreateModal(true)}
          variant="gradient"
          size="lg"
        >
          Nouveau Projet
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center" hover gradient>
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">
              {state.projects.length}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Projets</div>
        </Card>
        
        <Card className="p-6 text-center" hover gradient>
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">
              {state.projects.filter(p => p.status === 'active').length}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Actifs</div>
        </Card>
        
        <Card className="p-6 text-center" hover gradient>
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">
              {state.projects.reduce((acc, p) => acc + p.tasks.length, 0)}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Tâches</div>
        </Card>
        
        <Card className="p-6 text-center" hover gradient>
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">
              {state.projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'done').length, 0)}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Terminées</div>
        </Card>
      </div>

      {/* Liste des projets */}
      {state.projects.filter(p => p.status !== 'archived').length === 0 ? (
        <Card className="p-16 text-center" gradient>
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <FolderOpen className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Aucun projet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
            Créez votre premier projet pour commencer à organiser vos tâches.
          </p>
          <Button
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
            variant="gradient"
            size="lg"
          >
            Créer un Projet
          </Button>
        </Card>
      ) : (
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Projets actifs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.projects
              .filter(project => project.status === 'active')
              .map(project => (
                <ProjectCard 
                  key={project.id}
                  project={project}
                  onEdit={startEditing}
                  onArchive={handleArchiveProject}
                  onDelete={(p) => {
                    setProjectToDelete(p);
                    setShowDeleteConfirm(true);
                  }}
                  getProjectStats={getProjectStats}
                />
              ))}
          </div>
          
          {/* Projets en attente */}
          {state.projects.some(p => p.status === 'on-hold') && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">En attente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.projects
                  .filter(project => project.status === 'on-hold')
                  .map(project => (
                    <ProjectCard 
                      key={project.id}
                      project={project}
                      onEdit={startEditing}
                      onArchive={handleArchiveProject}
                      onDelete={(p) => {
                        setProjectToDelete(p);
                        setShowDeleteConfirm(true);
                      }}
                      getProjectStats={getProjectStats}
                    >
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivateProject(project);
                        }}
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full"
                      >
                        Activer le projet
                      </Button>
                    </ProjectCard>
                  ))}
              </div>
            </div>
          )}
          
          {/* Projets terminés */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Projets terminés</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCompletedProjects(!showCompletedProjects)}
                className="flex items-center gap-2"
              >
                {showCompletedProjects ? 'Masquer' : 'Afficher'} les projets terminés
                <svg 
                  className={`w-4 h-4 transition-transform ${showCompletedProjects ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </div>
            
            {showCompletedProjects && state.projects.some(p => p.status === 'completed') && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {state.projects
                  .filter(project => project.status === 'completed')
                  .map(project => (
                    <ProjectCard 
                      key={project.id}
                      project={project}
                      onEdit={startEditing}
                      onArchive={handleArchiveProject}
                      onDelete={(p) => {
                        setProjectToDelete(p);
                        setShowDeleteConfirm(true);
                      }}
                      getProjectStats={getProjectStats}
                    >
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivateProject(project);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          Réactiver
                        </Button>
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveProject(project);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          Archiver
                        </Button>
                      </div>
                    </ProjectCard>
                  ))}
              </div>
            )}
            {showCompletedProjects && !state.projects.some(p => p.status === 'completed') && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucun projet terminé pour le moment
              </div>
            )}
          </div>
          
          {/* Projets archivés */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Projets archivés</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowArchivedProjects(!showArchivedProjects)}
                className="flex items-center gap-2"
              >
                {showArchivedProjects ? 'Masquer' : 'Afficher'} les projets archivés
                <svg 
                  className={`w-4 h-4 transition-transform ${showArchivedProjects ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </div>
            
            {showArchivedProjects && state.projects.some(p => p.status === 'archived') && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {state.projects
                  .filter(project => project.status === 'archived')
                  .map(project => {
                    const stats = getProjectStats(project);
                    const progress = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;
                    
                    return (
                      <Card key={project.id} className="p-6 group opacity-75 hover:opacity-100 transition-opacity duration-200" hover>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-5 h-5 rounded-full shadow-lg"
                              style={{ backgroundColor: project.color }}
                            />
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                              {project.name}
                            </h3>
                          </div>
                          <div className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">
                            Archivé
                          </div>
                        </div>
                        
                        {project.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleArchiveProject(project)}
                              className="text-xs px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
                            >
                              Désarchiver
                            </button>
                            <button
                              onClick={() => {
                                setProjectToDelete(project);
                                setShowDeleteConfirm(true);
                              }}
                              className="text-xs px-3 py-1 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            )}
            {showArchivedProjects && !state.projects.some(p => p.status === 'archived') && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucun projet archivé pour le moment
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de création avec design moderne */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouveau Projet"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Nom du projet
            </label>
            <input
              type="text"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white backdrop-blur-sm transition-all duration-200"
              placeholder="Ex: Site Web E-commerce"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Description
            </label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white backdrop-blur-sm transition-all duration-200"
              placeholder="Description du projet..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Couleur
            </label>
            <div className="flex flex-wrap gap-3">
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => setNewProject({ ...newProject, color })}
                  className={`w-10 h-10 rounded-2xl border-2 transition-all duration-200 transform hover:scale-110 shadow-lg ${
                    newProject.color === color ? 'border-gray-400 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex space-x-4 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={createProject}
              variant="gradient"
              className="flex-1"
            >
              Créer
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Modal d'édition de projet */}
      <Modal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        title="Modifier le projet"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom du projet *
              </label>
              <input
                type="text"
                value={editingProject?.name || ''}
                onChange={(e) => editingProject && setEditingProject({...editingProject, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                placeholder="Ex: Site e-commerce"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut
              </label>
              <select
                value={editingProject?.status || 'active'}
                onChange={(e) => editingProject && setEditingProject({...editingProject, status: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
              >
                <option value="active">Actif</option>
                <option value="on-hold">En attente</option>
                <option value="completed">Terminé</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={editingProject?.description || ''}
              onChange={(e) => editingProject && setEditingProject({...editingProject, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white min-h-[100px]"
              placeholder="Description du projet..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Couleur du projet
            </label>
            <div className="flex flex-wrap gap-3">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => editingProject && setEditingProject({...editingProject, color})}
                  className={`w-10 h-10 rounded-2xl border-2 transition-all duration-200 transform hover:scale-110 shadow-lg ${
                    editingProject?.color === color ? 'border-gray-400 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          
          {/* Liste des tâches existantes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Tâches du projet
            </h3>
            
            {editingProject?.tasks?.length ? (
              <div className="space-y-3">
                {editingProject.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {task.dueDate} • {task.estimatedHours}h estimées
                      </p>
                    </div>
                    <button
                      onClick={() => removeTask(task.id, true)}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Aucune tâche pour le moment</p>
              </div>
            )}
          </div>
          
          {/* Formulaire d'ajout de tâche */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Titre de la tâche *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                  placeholder="Ex: Créer la maquette"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priorité
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optionnel)
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white min-h-[80px]"
                placeholder="Détails de la tâche..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date d'échéance
                </label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Temps estimé (heures)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({...newTask, estimatedHours: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={addTask}
                  disabled={!newTask.title.trim()}
                  className="w-full mt-2"
                >
                  Ajouter la tâche
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4 pt-6">
            <Button
              variant="outline"
              onClick={() => setEditingProject(null)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={updateProject}
              variant="gradient"
              className="flex-1"
              disabled={!editingProject?.name?.trim()}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Confirmation de suppression */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-center text-yellow-500 mb-4">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <p className="text-center text-gray-700 dark:text-gray-300">
            Êtes-vous sûr de vouloir supprimer le projet <span className="font-bold">{projectToDelete?.name}</span> ?
            <br />
            <span className="text-sm text-red-500 dark:text-red-400">
              Attention : Cette action est irréversible et supprimera également toutes les tâches associées.
            </span>
          </p>
          <div className="flex space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setProjectToDelete(null);
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (projectToDelete) {
                  dispatch({ type: 'DELETE_PROJECT', payload: projectToDelete.id });
                  setShowDeleteConfirm(false);
                  setProjectToDelete(null);
                }
              }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              variant="gradient"
              autoFocus
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}