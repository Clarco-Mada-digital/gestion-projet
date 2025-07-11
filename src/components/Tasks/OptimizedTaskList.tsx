import React, { useMemo, useCallback } from 'react';
import { Task } from '../../types';
import { TaskCard } from './TaskCard';
import { useAppSelector } from '../../store/store';

interface OptimizedTaskListProps {
  projectId: string;
  filter?: (task: Task) => boolean;
  sort?: (a: Task, b: Task) => number;
  className?: string;
}

// Fonction de tri par défaut
const defaultSort = (a: Task, b: Task) => {
  // Trier par statut (à faire > en cours > terminé)
  const statusOrder = { 'todo': 0, 'in-progress': 1, 'done': 2 };
  const statusA = statusOrder[a.status as keyof typeof statusOrder] || 0;
  const statusB = statusOrder[b.status as keyof typeof statusOrder] || 0;
  
  if (statusA !== statusB) return statusA - statusB;
  
  // Ensuite par date d'échéance
  const dateA = a.endDate || a.dueDate ? new Date(a.endDate || a.dueDate!).getTime() : Infinity;
  const dateB = b.endDate || b.dueDate ? new Date(b.endDate || b.dueDate!).getTime() : Infinity;
  
  return dateA - dateB;
};

// Composant mémoïsé pour chaque élément de la liste
const TaskItem = React.memo(({ task, projectId }: { task: Task; projectId: string }) => {
  return <TaskCard task={task} className="mb-4" />;
}, (prevProps, nextProps) => {
  // Ne se re-rend que si les propriétés importantes changent
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.description === nextProps.task.description &&
    prevProps.task.priority === nextProps.task.priority &&
    JSON.stringify(prevProps.task.assignees) === JSON.stringify(nextProps.task.assignees) &&
    prevProps.projectId === nextProps.projectId
  );
});

// Composant principal de la liste de tâches optimisée
const OptimizedTaskList: React.FC<OptimizedTaskListProps> = ({
  projectId,
  filter = () => true,
  sort = defaultSort,
  className = ''
}) => {
  // Récupération des tâches du projet depuis le store Redux
  const tasks = useAppSelector(state => {
    const projectTasks = state.tasks.tasks[projectId] || [];
    return projectTasks.filter(filter).sort(sort);
  });

  // Mémoïsation de la liste des tâches
  const memoizedTasks = useMemo(() => {
    return tasks.map(task => (
      <TaskItem 
        key={task.id} 
        task={task} 
        projectId={projectId} 
      />
    ));
  }, [tasks, projectId]);

  // Si pas de tâches, afficher un message
  if (tasks.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        Aucune tâche à afficher
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {memoizedTasks}
    </div>
  );
};

export default React.memo(OptimizedTaskList);
