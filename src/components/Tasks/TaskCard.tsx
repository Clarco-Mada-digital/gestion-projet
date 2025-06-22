import { useState } from 'react';
import { Calendar, Clock, Users, Tag, MoreHorizontal, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { Task } from '../../types';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../context/ModalContext';
import { Card } from '../UI/Card';
import { EditTaskForm } from './EditTaskForm';

interface TaskCardProps {
  task: Task;
  showProject?: boolean;
  className?: string;
}

export function TaskCard({ task, className = '' }: TaskCardProps) {
  const { state, dispatch } = useApp();
  const { openModal, closeModal } = useModal();
  const [showMenu, setShowMenu] = useState(false);

  // Projet associé à la tâche (pour une utilisation future si nécessaire)
  // const project = state.projects.find(p => p.id === task.projectId);
  const assignedUsers = state.users.filter(u => task.assignees.includes(u.id));
  
  // Fonction utilitaire pour vérifier si une date est valide
  const isValidDate = (date: string | Date) => {
    const d = new Date(date);
    return !isNaN(d.getTime());
  };

  // Utiliser dueDate comme fallback pour la rétrocompatibilité
  const startDate = task.startDate || task.dueDate;
  const endDate = task.endDate || task.dueDate || startDate;
  
  const isOverdue = isValidDate(endDate) && 
                   new Date(endDate).toDateString() < new Date().toDateString() && 
                   task.status !== 'done';
                   
  const isToday = isValidDate(startDate) && isValidDate(endDate) &&
                 new Date(startDate).toDateString() <= new Date().toDateString() && 
                 new Date(endDate).toDateString() >= new Date().toDateString() &&
                 task.status !== 'done';



  // Couleurs de priorité (pour une utilisation future si nécessaire)
  // const priorityColors = {
  //   low: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300',
  //   medium: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 dark:from-yellow-900/30 dark:to-orange-900/30 dark:text-yellow-300',
  //   high: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-300'
  // };


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

  const handleEditClick = () => {
    openModal(
      <EditTaskForm 
        task={task} 
        onClose={closeModal} 
      />
    );
  };

  return (
    <div className="relative">
      <Card 
        className={`p-6 transition-all duration-200 ${isOverdue ? 'border-l-4 border-red-500' : ''} ${isToday ? 'ring-2 ring-blue-500/20' : ''} ${className}`} 
        hover 
        gradient
      >
        {/* Bouton d'édition rapide */}
        <button
          onClick={handleEditClick}
          className="absolute top-3 right-10 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
          aria-label="Modifier la tâche"
        >
          <Edit className="w-4 h-4" />
        </button>
        
        {/* Menu contextuel */}
        <div className="absolute top-3 right-3 opacity-70 hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 backdrop-blur-sm transition-all duration-200 text-gray-600 dark:text-gray-300"
            aria-label="Menu des tâches"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 py-2 z-10 min-w-[150px]">
              <button 
                onClick={() => {
                  setShowMenu(false);
                  handleEditClick();
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100/50 dark:hover:bg-gray-700/50 flex items-center transition-colors duration-200"
              >
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
              
              {task.priority === 'high' && (
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full dark:bg-red-900/30 dark:text-red-300">
                  Haute
                </span>
              )}
              {task.priority === 'medium' && (
                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300">
                  Moyenne
                </span>
              )}
            </div>
            
            {task.description && (
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                {task.description.length > 120 
                  ? `${task.description.substring(0, 120)}...` 
                  : task.description}
              </p>
            )}

            {/* Affichage des sous-tâches */}
            {task.subTasks && task.subTasks.length > 0 && (
              <div className="mt-2 mb-3">
                <div className="text-xs text-gray-500 mb-1">
                  {task.subTasks.filter(st => st.completed).length} sur {task.subTasks.length} sous-tâches
                </div>
                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500"
                    style={{
                      width: `${(task.subTasks.filter(st => st.completed).length / task.subTasks.length) * 100}%`
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <div 
                className="flex items-center" 
                title={`${startDate ? `Du ${new Date(startDate).toLocaleDateString('fr-FR')} ` : ''}${endDate ? `au ${new Date(endDate).toLocaleDateString('fr-FR')}` : ''}`.trim()}
              >
                <Calendar className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                <span className="whitespace-nowrap">
                  {startDate && isValidDate(startDate) ? (
                    <>
                      {new Date(startDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                      {' - '}
                      {endDate && isValidDate(endDate) ? (
                        new Date(endDate).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: new Date(startDate).getFullYear() !== new Date(endDate).getFullYear() ? 'numeric' : undefined
                        })
                      ) : (
                        'Date indéfinie'
                      )}
                    </>
                  ) : (
                    'Dates non définies'
                  )}
                </span>
              </div>
              
              {task.estimatedHours && (
                <div className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  <span className="whitespace-nowrap">{task.estimatedHours}h</span>
                </div>
              )}
              
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center">
                  <Tag className="w-3.5 h-3.5 mr-1" />
                  {task.tags.slice(0, 2).join(', ')}
                  {task.tags.length > 2 && ` +${task.tags.length - 2}`}
                </div>
              )}
              
              {assignedUsers.length > 0 && (
                <div className="flex items-center">
                  <Users className="w-3.5 h-3.5 mr-1" />
                  <div className="flex -space-x-1">
                    {assignedUsers.slice(0, 3).map((user) => (
                      <div 
                        key={user.id} 
                        className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200 border-2 border-white dark:border-gray-800"
                        title={user.name}
                      >
                        {user.avatar}
                      </div>
                    ))}
                    {assignedUsers.length > 3 && (
                      <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400 border-2 border-white dark:border-gray-800">
                        +{assignedUsers.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}