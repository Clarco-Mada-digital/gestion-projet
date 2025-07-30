import { useState, useCallback, memo, useContext } from 'react';
import { Calendar, Clock, Users, MoreHorizontal, Edit, CheckCircle2 } from 'lucide-react';
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
const formatDate = (date?: string): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Fonction de comparaison personnalisée pour React.memo
const areEqual = (prevProps: TaskCardProps, nextProps: TaskCardProps): boolean => {
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

const TaskCardComponent = ({ task, className = '' }: TaskCardProps): JSX.Element | null => {
  const { state, dispatch } = useApp();
  const { openModal, closeModal } = useModal();
  const [showMenu, setShowMenu] = useState(false);

  // Vérifier que la tâche est valide
  if (!task || typeof task !== 'object') {
    console.error('Tâche invalide:', task);
    return null;
  }

  // Vérifier les propriétés essentielles
  if (!task.id || !task.title || !task.projectId) {
    console.error('Tâche manquante des propriétés requises:', task);
    return null;
  }

  // Projet associé à la tâche (pour une utilisation future si nécessaire)
  const assignedUsers = state.users.filter(u => task.assignees.includes(u.id));

  // Fonction utilitaire pour vérifier si une date est valide
  const isValidDate = (date?: string): boolean => {
    if (!date) return false;
    const d = new Date(date);
    return !isNaN(d.getTime());
  };

  // Utiliser dueDate comme fallback pour la rétrocompatibilité
  const startDate = task.startDate || new Date().toISOString();
  const endDate = task.endDate || task.dueDate || startDate;

  const isOverdue = (() => {
    if (!isValidDate(endDate) || task.status === 'done') return false;

    const now = new Date();
    const taskEndDate = endDate ? new Date(endDate) : now;

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
    let newStatus: 'todo' | 'in-progress' | 'done';

    // Si la tâche a des sous-tâches non terminées
    if (task.subTasks && task.subTasks.length > 0) {
      const hasIncompleteSubTasks = task.subTasks.some(st => !st.completed);
      newStatus = hasIncompleteSubTasks ? 'in-progress' : 'done';
    } else {
      // Pour les tâches sans sous-tâches, baser le statut sur la date
      if (isOverdue) {
        newStatus = 'done';
      } else if (isToday) {
        newStatus = 'in-progress';
      } else {
        newStatus = task.status === 'todo' ? 'in-progress' : 'done';
      }
    }

    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        ...task,
        updatedAt: now,
        completedAt: task.status === 'done' && task.status !== 'done' 
          ? new Date().toISOString() 
          : task.completedAt
      }
    });
  }, [dispatch, task.projectId, task.id]);

  const handleEdit = useCallback(() => {
    try {
      // Vérifier que la tâche est valide avant de l'ouvrir
      if (!task || typeof task !== 'object') {
        throw new Error('Tâche invalide');
      }
      
      // Vérifier les propriétés essentielles
      if (!task.id || !task.title || !task.projectId) {
        throw new Error('Tâche manquante des propriétés requises');
      }

      const project = state.projects.find(p => p.id === task.projectId) || null;
      if (!project) {
        console.error('Projet non trouvé pour la tâche:', task);
        return;
      }

      openModal({
        title: 'Modifier la tâche',
        content: <EditTaskForm task={task} onClose={closeModal} project={project} />,
        size: 'lg'
      });
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du formulaire d\'édition:', error);
      alert('Une erreur est survenue lors de la modification de la tâche.');
    }
  }, [openModal, closeModal, task, state.projects]);

  const handleDelete = useCallback(() => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      dispatch({
        type: 'DELETE_TASK',
        payload: {
          projectId: task.projectId,
          taskId: task.id
        }
      });
    }
  }, [dispatch, task.id]);

  return (
    <div className="relative">
      <Card
        className={`p-6 transition-all duration-200 ${isOverdue ? 'border-l-4 border-red-500 dark:border-red-700' : ''} ${isToday ? 'ring-2 ring-blue-500/20 dark:ring-blue-500' : ''} ${className}`}
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
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <button
                  onClick={handleEdit}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                >
                  Modifier
                </button>
                <button
                  onClick={handleDelete}
                  className="block px-4 py-2 text-sm text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-700 w-full text-left"
                >
                  Supprimer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contenu principal */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className={`w-5 h-5 ${
                task.status === 'done' ? 'text-green-500' :
                task.status === 'in-progress' ? 'text-yellow-500' :
                'text-gray-400'
              }`} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {task.title}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              {task.priority && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  task.priority === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                }`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              )}
              {task.assignees.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {assignedUsers.length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {task.description && (
            <p className="text-gray-600 dark:text-gray-300">
              {task.description}
            </p>
          )}

          <div className="flex items-center space-x-4">
            {task.startDate && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {formatDate(task.startDate)}
                </span>
              </div>
            )}
            {task.estimatedHours && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {task.estimatedHours}h
                </span>
              </div>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap items-center space-x-2">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export const TaskCard = memo(TaskCardComponent, areEqual);
export default TaskCard;