import { useState, useCallback, memo, useMemo } from 'react';
import { Calendar, Clock, Users, Tag, MoreHorizontal, Edit, Trash2, CheckCircle2, User } from 'lucide-react';
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

// Fonction utilitaire pour formater la date
export const formatDate = (date: Date | string) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Fonction de comparaison personnalisée pour React.memo
const areEqual = (prevProps: TaskCardProps, nextProps: TaskCardProps) => {
  // Comparaison des propriétés importantes
  const taskPropsEqual = (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.description === nextProps.task.description &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.task.startDate === nextProps.task.startDate &&
    prevProps.task.endDate === nextProps.task.endDate &&
    JSON.stringify(prevProps.task.assignees) === JSON.stringify(nextProps.task.assignees) &&
    JSON.stringify(prevProps.task.subTasks) === JSON.stringify(nextProps.task.subTasks) &&
    prevProps.className === nextProps.className
  );
  
  return taskPropsEqual;
};

// Composant de carte de tâche optimisé
const TaskCardComponent = ({ task, className = '' }: TaskCardProps) => {
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

  const isOverdue = (() => {
    if (!isValidDate(endDate) || task.status === 'done') return false;

    const now = new Date();
    const taskEndDate = new Date(endDate);

    // Réinitialiser les heures pour la comparaison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDateOnly = new Date(taskEndDate.getFullYear(), taskEndDate.getMonth(), taskEndDate.getDate());

    // La tâche est en retard si la date de fin est antérieure à aujourd'hui
    return endDateOnly < today;
  })();

  const isToday = isValidDate(startDate) && isValidDate(endDate) &&
    new Date(startDate).toDateString() <= new Date().toDateString() &&
    new Date(endDate).toDateString() >= new Date().toDateString() &&
    task.status !== 'done';

  const toggleStatus = useCallback(() => {
    const now = new Date().toISOString();
    let newStatus: string;

    // Si la tâche a des sous-tâches non terminées
    if (task.subTasks && task.subTasks.length > 0) {
      const allSubtasksCompleted = task.subTasks.every(subtask => subtask.completed);

      // Si on essaie de marquer comme terminé mais que toutes les sous-tâches ne le sont pas
      if (task.status !== 'done' && !allSubtasksCompleted) {
        // On force le statut à 'in-progress' et on ne permet pas de passer à 'done'
        newStatus = 'in-progress';

        dispatch({
          type: 'UPDATE_TASK',
          payload: {
            ...task,
            status: newStatus,
            updatedAt: now,
            completedAt: undefined
          }
        });

        // Afficher un message à l'utilisateur
        alert('Veuillez terminer toutes les sous-tâches avant de marquer cette tâche comme terminée.');
        return;
      }

      // Si on essaie de marquer comme terminé et que toutes les sous-tâches sont terminées
      if (task.status !== 'done' && allSubtasksCompleted) {
        newStatus = 'done';

        dispatch({
          type: 'UPDATE_TASK',
          payload: {
            ...task,
            status: newStatus,
            updatedAt: now,
            completedAt: now
          }
        });
        return;
      }
    }

    // Pour les tâches sans sous-tâches ou pour le cycle normal des statuts
    newStatus = task.status === 'done' ? 'todo' :
      task.status === 'todo' ? 'in-progress' : 'done';

    // Mettre à jour la tâche avec le nouveau statut
    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        ...task,
        status: newStatus,
        updatedAt: now,
        // Mettre à jour completedAt uniquement si on passe à 'done'
        completedAt: newStatus === 'done' ? now :
          newStatus === 'in-progress' ? undefined : task.completedAt
      }
    });
  }, [dispatch, task]);

  const handleDelete = useCallback(() => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      dispatch({ type: 'DELETE_TASK', payload: { projectId: task.projectId, taskId: task.id } });
    }
  }, [dispatch, task.projectId, task.id]);

  const handleEdit = useCallback(() => {
    openModal({
      title: 'Modifier la tâche',
      content: <EditTaskForm task={task} onClose={closeModal} />,
      size: 'lg'
    });
  }, [openModal, closeModal, task]);

  const dateDisplay = useMemo(() => {
    if (!isValidDate(startDate) && !isValidDate(endDate)) return null;

    const start = formatDate(startDate);
    const end = formatDate(endDate);

    return (
      <div className="task-date">
        <Calendar size={14} />
        <span>{start} {end && start !== end && `- ${end}`}</span>
      </div>
    );
  }, [startDate, endDate]);

  const priorityBadge = useMemo(() => {
    if (!task.priority) return null;

    const priorityMap = {
      low: 'Basse',
      medium: 'Moyenne',
      high: 'Haute',
      urgent: 'Urgent'
    };

    return (
      <span className={`priority-badge ${task.priority}`}>
        {priorityMap[task.priority as keyof typeof priorityMap]}
      </span>
    );
  }, [task.priority]);

  return (
    <div className="relative">
      <Card
        className={`p-6 transition-all duration-200 ${isOverdue ? 'border-l-4 border-red-500 dark:border-red-700' : ''} ${isToday ? 'ring-2 ring-blue-500/20 dark:rign-blue-500' : ''} ${className}`}
        hover
        gradient
      >
        {/* Bouton d'édition rapide */}
        <button
          onClick={handleEdit}
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
                  handleEdit();
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100/50 dark:hover:bg-gray-700/50 flex items-center transition-colors duration-200"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </button>
              <button
                onClick={handleDelete}
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

              <h3 className={`font-semibold ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}>
                <span className={`${state.appSettings?.fontSize === 'small' ? 'text-base' : state.appSettings?.fontSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                  {task.title}
                </span>
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
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white border-2 border-white dark:border-gray-800 ${
                          // Générer une couleur de fond basée sur le nom de l'utilisateur pour la cohérence
                          ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-red-600', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-600', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500', 'bg-fuchsia-500', 'bg-rose-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-pink-500', 'bg-rose-500', 'bg-amber-400'][
                            Math.abs(user.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 20
                          ]
                        }`}
                        title={user.name}
                      >
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                      </div>
                    ))}
                    {assignedUsers.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400 border-2 border-white dark:border-gray-800">
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
};

// Composant mémoïsé avec comparaison personnalisée
const MemoizedTaskCard = memo(TaskCardComponent, areEqual);

// Export nommé pour la compatibilité avec les imports existants
export const TaskCard = MemoizedTaskCard;

// Export par défaut pour la rétrocompatibilité
export default MemoizedTaskCard;