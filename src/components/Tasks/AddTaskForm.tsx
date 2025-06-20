import { useState, useRef, useEffect } from 'react';
import { Calendar, TextCursorInput, Folder } from 'lucide-react';
import { Task, Project } from '../../types';
import { Select } from '../UI/Select';

interface AddTaskFormProps {
  projects: Project[];
  selectedProjectId: string;
  status: 'todo' | 'in-progress' | 'done';
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function AddTaskForm({ projects, selectedProjectId, status, onAddTask, onCancel }: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState(selectedProjectId);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Si le projet sélectionné change, mettons à jour le formulaire
  useEffect(() => {
    setProjectId(selectedProjectId);
  }, [selectedProjectId]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    const newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: title.trim(),
      description: description.trim(),
      status,
      projectId,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      priority: 'medium',
      assignees: [],
      tags: [],
    };

    onAddTask(newTask);
    setTitle('');
    setDescription('');
    setDueDate('');
  };
  
  const isFormValid = title.trim() !== '' && projectId !== '';

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex flex-col space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Saisissez un titre pour cette tâche"
            className="w-full px-4 py-3 text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 text-sm font-medium"
          />
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Projet</span>
            </div>
            <Select
              value={projectId}
              onValueChange={setProjectId}
              disabled={projects.length === 0}
              className="w-full"
            >
              {projects.map((project) => (
                <Select.Item key={project.id} value={project.id}>
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate">{project.name}</span>
                  </div>
                </Select.Item>
              ))}
            </Select>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center space-x-2 mb-2">
            <TextCursorInput className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ajouter une description (optionnel)"
              className="flex-1 text-sm text-gray-600 dark:text-gray-300 bg-transparent border-none focus:ring-0 focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="text-sm text-gray-600 dark:text-gray-300 bg-transparent border-none focus:ring-0 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!isFormValid}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ajouter la tâche
          </button>
        </div>
      </div>
    </form>
  );
}
