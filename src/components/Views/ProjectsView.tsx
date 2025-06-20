import React, { useState } from 'react';
import { Plus, FolderOpen, Calendar, Users, MoreHorizontal, Sparkles, Rocket } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { Project } from '../../types';

export function ProjectsView() {
  const { state, dispatch } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: '#0EA5E9'
  });

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
      tasks: []
    };

    dispatch({ type: 'ADD_PROJECT', payload: project });
    setNewProject({ name: '', description: '', color: '#0EA5E9' });
    setShowCreateModal(false);
  };

  const getProjectStats = (project: Project) => {
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'done').length;
    const overdueTasks = project.tasks.filter(t => 
      new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length;

    return { totalTasks, completedTasks, overdueTasks };
  };

  const colors = [
    '#0EA5E9', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
    '#EC4899', '#8B5CF6', '#06B6D4', '#10B981'
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              Projets
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Gérez tous vos projets en cours avec style
            </p>
          </div>
        </div>
        
        <Button
          icon={Plus}
          onClick={() => setShowCreateModal(true)}
          variant="gradient"
          size="lg"
        >
          Nouveau Projet
        </Button>
      </div>

      {/* Statistiques générales avec design futuriste */}
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
      {state.projects.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {state.projects.map(project => {
            const stats = getProjectStats(project);
            const progress = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

            return (
              <Card key={project.id} className="p-6 group" hover gradient>
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
                  
                  <button className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200">
                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                  </button>
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

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-gray-100/50 dark:bg-gray-700/50 px-3 py-1 rounded-lg">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{stats.totalTasks} tâches</span>
                    </div>
                    
                    {stats.overdueTasks > 0 && (
                      <div className="flex items-center space-x-1 text-red-500 bg-red-50/50 dark:bg-red-900/20 px-3 py-1 rounded-lg">
                        <span className="font-medium">{stats.overdueTasks} en retard</span>
                      </div>
                    )}
                  </div>

                  <div className="flex -space-x-1">
                    {project.tasks
                      .flatMap(t => t.assignees)
                      .filter((assignee, index, arr) => arr.indexOf(assignee) === index)
                      .slice(0, 3)
                      .map(assigneeId => {
                        const user = state.users.find(u => u.id === assigneeId);
                        return user ? (
                          <div
                            key={assigneeId}
                            className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs border-2 border-white dark:border-gray-800 shadow-lg"
                            title={user.name}
                          >
                            {user.avatar}
                          </div>
                        ) : null;
                      })}
                  </div>
                </div>
              </Card>
            );
          })}
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
    </div>
  );
}