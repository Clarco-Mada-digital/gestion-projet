import React, { useState, useCallback, memo } from 'react';
import { Clock, Edit2, MoreHorizontal, CheckCircle2, User as UserType } from 'lucide-react';
import { Task, Project, TaskStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../context/ModalContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useOffline } from '../../hooks/useOffline';
import { Card } from '../UI/Card';
import { EditTaskForm } from './EditTaskForm';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TaskCardProps {
  task: Task;
  project?: Project | null;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string, projectId: string) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  className?: string;
  isDragging?: boolean;
}

// Fonction pour nettoyer le markdown mal formé
const cleanMarkdown = (text: string): string => {
  if (!text) return text;

  // Corrige les doubles astérisques mal placés
  return text
    // Remplace les ** finaux par un seul **
    .replace(/\*\*\*+/g, '**')
    // S'assure que les ** sont bien appariés
    .replace(/\*\*(.*?)\*\*/g, '**$1**')
    // Nettoie les ** orphelins
    .replace(/\*\*([^*]*?)\*\*/g, '**$1**');
};

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
    prevProps.task.dueDate === nextProps.task.dueDate &&
    JSON.stringify(prevProps.task.assignees) === JSON.stringify(nextProps.task.assignees) &&
    JSON.stringify(prevProps.task.subTasks) === JSON.stringify(nextProps.task.subTasks) &&
    prevProps.className === nextProps.className
  );

  return taskPropsEqual;
};

const TaskCardComponent: React.FC<TaskCardProps> = ({ task, project, className, isDragging = false }) => {
  const { state, dispatch } = useApp();
  const { openModal, closeModal } = useModal();
  const { showTaskCompleted } = useNotifications();
  const { saveTaskOffline } = useOffline();
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

  // Récupérer le projet associé à la tâche
  const taskProject = state.projects.find(p => p.id === task.projectId);
  const projectName = taskProject?.name || 'Projet inconnu';

  // Récupérer les utilisateurs assignés
  const assignedUsers = state.users.filter(u => task.assignees.includes(u.id));

  // Fonction utilitaire pour vérifier si une date est valide
  const isValidDate = (date?: string): boolean => {
    if (!date) return false;
    const d = new Date(date);
    return !isNaN(d.getTime());
  };

  const isOverdue = (() => {
    if (!isValidDate(task.dueDate) || task.status === 'done' || task.status === 'non-suivi') return false;

    const now = new Date();
    const taskDueDate = new Date(task.dueDate);

    // Réinitialiser les heures pour la comparaison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDateOnly = new Date(taskDueDate.getFullYear(), taskDueDate.getMonth(), taskDueDate.getDate());

    // La tâche est en retard si la date d'échéance est antérieure à aujourd'hui
    return dueDateOnly < today;
  })();

  const isToday = (() => {
    if (!isValidDate(task.dueDate) || task.status === 'done' || task.status === 'non-suivi') return false;
    const now = new Date();
    const taskDueDate = new Date(task.dueDate);
    return taskDueDate.toDateString() === now.toDateString();
  })();

  const isActive = (() => {
    if (task.status === 'done') return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const start = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : null);
    const end = task.dueDate ? new Date(task.dueDate) : null;

    if (!start || !end) return false;

    const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

    return today >= startTime && today <= endTime;
  })();

  const isViewer = project?.source === 'firebase' &&
    project.ownerId !== state.cloudUser?.uid &&
    project.memberRoles?.[state.cloudUser?.uid || ''] === 'viewer';

  const toggleStatus = useCallback(() => {
    if (isViewer) {
      alert("Vous n'avez pas les droits pour modifier le statut de cette tâche.");
      return;
    }

    const now = new Date().toISOString();
    let newStatus: TaskStatus;

    // Basculer entre 'done' et 'in-progress' pour les clics simples
    if (task.status === 'done') {
      newStatus = 'in-progress';
    } else if (task.status === 'non-suivi') {
      // Les tâches non suivies ne changent pas de statut
      newStatus = 'non-suivi';
    } else {
      newStatus = 'done';
    }

    const updatedTask = {
      ...task,
      status: newStatus,
      updatedAt: now,
      completedAt: newStatus === 'done' ? now : undefined
    };

    dispatch({
      type: 'UPDATE_TASK',
      payload: updatedTask
    });

    // Afficher une notification si la tâche est marquée comme terminée
    if (newStatus === 'done' && task.status !== 'done') {
      showTaskCompleted(updatedTask);
    }

    // Sauvegarder localement si hors-ligne
    if (!navigator.onLine) {
      saveTaskOffline(updatedTask);
    }
  }, [dispatch, task, isViewer, saveTaskOffline, showTaskCompleted]);

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
        title: isViewer ? 'Détails de la tâche' : 'Modifier la tâche',
        content: <EditTaskForm task={task} onClose={closeModal} project={project} />,
        size: 'lg'
      });
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du modal de tâche:', error);
      alert('Une erreur est survenue lors de l\'ouverture de la tâche.');
    }
  }, [openModal, closeModal, task, state.projects, isViewer]);

  const handleDelete = useCallback(() => {
    if (isViewer) {
      alert("Vous n'avez pas les droits pour supprimer cette tâche.");
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      dispatch({
        type: 'DELETE_TASK',
        payload: {
          projectId: task.projectId,
          taskId: task.id
        }
      });
    }
  }, [dispatch, task.id, task.projectId, isViewer]);

  return (
    <Card
      className={`relative group p-4 cursor-pointer ${!isDragging ? 'transition-all duration-200' : 'bg-white dark:bg-gray-800'} ${isOverdue ? 'border-l-4 border-red-500 dark:border-red-700' :
        task.status === 'non-suivi' ? 'border-l-4 border-orange-400 dark:border-orange-600 bg-orange-50/30 dark:bg-orange-900/10' : ''
        } ${isToday ? 'ring-1 ring-blue-500/30 dark:ring-blue-500/50' : ''
        } ${className} ${!isDragging ? 'hover:shadow-md' : ''}`}
      hover={!isDragging}
      gradient={!isDragging}
      blur={!isDragging}
      onClick={handleEdit}
    >
      {/* En-tête de la carte avec titre et actions */}
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-1 break-words">
            {task.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={projectName}>
            {projectName}
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center space-x-1">
          {!isViewer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Modifier la tâche"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {/* Menu contextuel */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 z-10 mt-1 w-40 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1">
                  {!isViewer && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit();
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete();
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50"
                      >
                        <span>Supprimer</span>
                      </button>
                    </>
                  )}
                  {isViewer && (
                    <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
                      Mode lecture seule
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="space-y-3">
        {/* Description */}
        {task.description && (
          <div
            className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed break-all markdown-body pointer-events-none"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                strong: ({ children }) => <strong style={{ fontWeight: 'bold', color: 'inherit' }}>{children}</strong>,
                em: ({ children }) => <em style={{ fontStyle: 'italic', color: 'inherit' }}>{children}</em>,
                code: ({ className, children }) => {
                  const isInline = !className?.includes('language-');
                  return isInline
                    ? <code style={{ backgroundColor: '#f3f4f6', padding: '0.1em 0.2em', borderRadius: '2px', fontSize: '0.8em', fontFamily: 'monospace' }}>{children}</code>
                    : <code style={{ backgroundColor: '#f3f4f6', padding: '0.5em', borderRadius: '4px', display: 'block', overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.8em' }}>{children}</code>;
                },
                p: ({ children }) => <p style={{ margin: '0' }}>{children}</p>,
                ul: ({ children }) => <ul style={{ margin: '0', paddingLeft: '1em' }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ margin: '0', paddingLeft: '1em' }}>{children}</ol>,
                li: ({ children }) => <li style={{ marginBottom: '0' }}>{children}</li>,
                h1: ({ children }) => <h1 style={{ fontSize: '1em', fontWeight: 'bold', margin: '0' }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ fontSize: '1em', fontWeight: 'bold', margin: '0' }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ fontSize: '1em', fontWeight: 'bold', margin: '0' }}>{children}</h3>,
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#3b82f6', textDecoration: 'underline' }}
                  >
                    {children}
                  </a>
                )
              }}
            >
              {cleanMarkdown(task.description)}
            </ReactMarkdown>
          </div>
        )}
        {/* Métadonnées */}
        <div className="space-y-2">
          {/* Dates */}
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 opacity-75" />
            <div className="flex flex-wrap items-center gap-x-1">
              <span className="whitespace-nowrap">{formatDate(task.dueDate)}</span>
            </div>
          </div>

          {/* Assignés */}
          {assignedUsers.length > 0 && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <UserType className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 opacity-75" />
              <div className="flex items-center flex-wrap gap-1">
                {assignedUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className={`w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/80 flex items-center justify-center text-xs font-medium text-blue-700 dark:text-blue-200 border-2 border-white dark:border-gray-800 ${index > 0 ? '-ml-2' : ''
                      }`}
                    title={user.name || user.email}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100/80 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200/50 dark:border-blue-800/50"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pied de carte avec statut et actions */}
        <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStatus();
            }}
            className={`flex items-center text-xs font-medium transition-colors ${task.status === 'done'
              ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
              : task.status === 'non-suivi'
                ? 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
          >
            <CheckCircle2
              className={`w-3.5 h-3.5 mr-1.5 ${task.status === 'done' ? 'fill-current' : task.status === 'non-suivi' ? 'fill-gray-400' : ''
                }`}
            />
            {task.status === 'done' ? 'Terminée' : task.status === 'non-suivi' ? 'Non suivi' : 'Marquer comme terminée'}
          </button>

          <div className="flex space-x-2">
            {isOverdue && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                En retard
              </span>
            )}
            {isToday && !isOverdue && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200 border border-pink-200 dark:border-pink-800">
                🔥 Échéance
              </span>
            )}
            {isActive && !isToday && !isOverdue && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                En cours
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export const TaskCard = memo(TaskCardComponent, areEqual);
export default TaskCard;