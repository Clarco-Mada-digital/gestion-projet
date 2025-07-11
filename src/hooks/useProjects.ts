import { useAppSelector, useAppDispatch } from '../store/store';
import { Project } from '../types';
import { 
  setCurrentProject as setCurrentProjectAction,
  addProject as addProjectAction,
  updateProject as updateProjectAction,
  deleteProject as deleteProjectAction 
} from '../store/slices/projectsSlice';
import { 
  setTasks as setTasksAction,
  addTask as addTaskAction,
  updateTask as updateTaskAction,
  deleteTask as deleteTaskAction,
  setSelectedTask as setSelectedTaskAction
} from '../store/slices/taskSlice';

export const useProjects = () => {
  const { projects, currentProjectId } = useAppSelector((state) => ({
    projects: state.projects.projects,
    currentProjectId: state.projects.currentProjectId,
  }));

  const tasks = useAppSelector((state) => state.tasks.tasks);
  const selectedTaskId = useAppSelector((state) => state.tasks.selectedTask);
  const dispatch = useAppDispatch();

  // Projets
  const currentProject = projects.find(p => p.id === currentProjectId) || null;
  const currentProjectTasks = currentProjectId ? tasks[currentProjectId] || [] : [];
  const selectedTask = selectedTaskId 
    ? currentProjectTasks.find(t => t.id === selectedTaskId) || null 
    : null;

  const setCurrentProject = (projectId: string | null) => {
    dispatch(setCurrentProjectAction(projectId));
  };

  const addProject = (project: Project) => {
    dispatch(addProjectAction(project));
  };

  const updateProject = (project: Project) => {
    dispatch(updateProjectAction(project));
  };

  const deleteProject = (projectId: string) => {
    dispatch(deleteProjectAction(projectId));
  };

  // Tâches
  const setSelectedTask = (taskId: string | null) => {
    dispatch(setSelectedTaskAction(taskId));
  };

  const addTask = (projectId: string, task: any) => {
    dispatch(addTaskAction({ projectId, task }));
  };

  const updateTask = (projectId: string, task: any) => {
    dispatch(updateTaskAction({ projectId, task }));
  };

  const deleteTask = (projectId: string, taskId: string) => {
    dispatch(deleteTaskAction({ projectId, taskId }));
  };

  return {
    // Projets
    projects,
    currentProject,
    currentProjectId,
    setCurrentProject,
    addProject,
    updateProject,
    deleteProject,
    
    // Tâches
    tasks: currentProjectTasks,
    allTasks: tasks,
    selectedTask,
    selectedTaskId,
    setSelectedTask,
    addTask,
    updateTask,
    deleteTask,
  };
};

export default useProjects;
