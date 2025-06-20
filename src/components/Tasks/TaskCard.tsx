import React, { useState } from 'react';
import { Calendar, Clock, Users, Tag, MoreHorizontal, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { Task } from '../../types';
import { useApp } from '../../context/AppContext';
import { Card } from '../UI/Card';

interface TaskCardProps {
  task: Task;
  showProject?: boolean;
  className?: string;
}

export function TaskCard({ task, showProject = false, className = '' }: TaskCardProps) {
  const { state, dispatch } = useApp();
  const [showMenu, setShowMenu] = useState(false);

  const project = state.projects.find(p => p.id === task.projectId);
  const assignedUsers = state.users.filter(u => task.assignees.includes(u.id));
  
  const isOverdue = new Date(task.dueDate).toDateString() < new Date().toDateString() && task.status !== 'done';
  const isToday = new Date(task.dueDate).toDateString() === new Date().toDateString();

  const priorityColors = {
    low: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300',
    medium: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 dark:from-yellow-900/30 dark:to-orange-900/30 dark:text-yellow-300',
    high: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-300'
  };

  const statusColors = {
    'todo': 'border-l-gray-400',
    'in-progress': 'border-l-blue-500',
    'done': 'border-l-green-500'
  };

  const toggleStatus = () => {
    const newStatus = task.status === 'done' ? 'todo' : 
                     task.status === 'todo' ? 'in-progress' : 'done';
    
    dispatch({
      type: 'UPDATE_TASK',
      payload: { ...task, status: newStatus, updatedAt: new Date().toISOString() }
    });
  };

  const deleteTask = () => {
    dispatch({
      type: 'DELETE_TASK',
      payload: { projectId: task.projectId, taskId: task.id }
    });
  };

  return (
    <Card className={`p-6 transition-all duration-200 ${isOverdue ? 'border-l-4 border-red-500' : ''} ${isToday ? 'ring-2 ring-blue-500/20' : ''} ${className}`} hover gradient>
      {/* Menu contextuel */}
      <div className="absolute top-3 right-3 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 backdrop-blur-sm transition-all duration-200 text-gray-600 dark:text-gray-300"
          aria-label="Menu des tâches"
        >
          <MoreHorizontal className="w-4 h-4 text-gray-500" />
        </button>
        
        {showMenu && (
          <div className="absolute right-0 top-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 py-2 z-10 min-w-[150px]">
            <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100/50 dark:hover:bg-gray-700/50 flex items-center transition-colors duration-200">
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </button>
            <button 
              onClick={deleteTask}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50/50 dark:hover:bg-red-900/20 flex items-center text-red-600 transition-colors duration-200"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </button>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <button
              onClick={toggleStatus}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                task.status === 'done'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 shadow-lg'
                  : 'border-gray-300 dark:border-gray-600 hover:border-green-500 hover:shadow-md'
              }`}
            >
              {task.status === 'done' && (
                <CheckCircle2 className="w-4 h-4 text-white" />
              )}
            </button>
            
            <h3 className={`font-semibold text-lg ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}>
              {task.title}
            </h3>
            
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${priorityColors[task.priority]} shadow-sm`}>
              {task.priority}
            </span>
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {showProject && project && (
            <div className="flex items-center space-x-2 mb-3">
              <div 
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: project.color }}
              />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100/50 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                {project.name}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg font-medium ${isOverdue ? 'text-red-600 bg-red-50/80 dark:text-red-300 dark:bg-red-900/30' : isToday ? 'text-blue-600 bg-blue-50/80 dark:text-blue-300 dark:bg-blue-900/30' : 'bg-gray-100/70 dark:bg-gray-700/70 text-gray-700 dark:text-gray-200'}`}>
            <Calendar className="w-4 h-4" />
            <span className="font-medium">
              {new Date(task.dueDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short'
              })}
            </span>
            {isOverdue && <Clock className="w-4 h-4 text-red-500" />}
          </div>
        {/* <div className="flex items-center space-x-4">

        </div> */}
          {assignedUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <div className="flex -space-x-1">
                {assignedUsers.slice(0, 3).map((user) => (
                  <div
                    key={user.id}
                    className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs border-2 border-white dark:border-gray-800 shadow-md"
                    title={user.name}
                  >
                    {user.avatar}
                  </div>
                ))}
                {assignedUsers.length > 3 && (
                  <div className="w-7 h-7 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-white dark:border-gray-800 shadow-md">
                    +{assignedUsers.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}

      </div>
        {task.tags.length > 0 && (
          <div className="flex items-center space-x-1 mt-2 w-auto bg-gray-50/50 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
            <Tag className="w-4 h-4" />
            <span className="font-medium">{task.tags.slice(0, 2).join(', ')}</span>
            {task.tags.length > 2 && <span>+{task.tags.length - 2}</span>}
          </div>
        )}

      {isOverdue && task.status !== 'done' && (
        <div className="mt-4 p-3 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border border-red-200 dark:border-red-800/50 rounded-xl">
          <p className="text-xs text-red-700 dark:text-red-300 flex items-center font-medium">
            <Clock className="w-4 h-4 mr-2" />
            Cette tâche est en retard ! Finissez-la avant de passer aux tâches d'aujourd'hui.
          </p>
        </div>
      )}
    </Card>
  );
}