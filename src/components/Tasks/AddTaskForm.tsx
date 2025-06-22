import { useState, useRef, useEffect } from 'react';
import { Calendar, TextCursorInput, Folder, Sparkles } from 'lucide-react';
import { Task, Project } from '../../types';
import { useApp } from '../../context/AppContext';
import AIService from '../../services/aiService';

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [projectId, setProjectId] = useState(selectedProjectId);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Initialiser les dates au chargement du composant
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  }, []);
  const inputRef = useRef<HTMLInputElement>(null);
  const { state } = useApp();
  
  // Si le projet sélectionné change, mettons à jour le formulaire
  useEffect(() => {
    setProjectId(selectedProjectId);
  }, [selectedProjectId]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleGenerateWithAI = async () => {
    if (!projectId) return;
    
    try {
      setIsGenerating(true);
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return;

      // Récupérer les paramètres IA du projet ou des paramètres généraux
      const aiSettings = project.aiSettings || state.appSettings?.aiSettings;
      
      // Vérifier si les paramètres IA sont correctement configurés
      if (!aiSettings?.provider) {
        alert('Veuillez sélectionner un fournisseur IA dans les paramètres du projet');
        return;
      }
      
      // Vérifier la présence de la clé API selon le fournisseur
      const apiKey = aiSettings.provider === 'openai' 
        ? aiSettings.openaiApiKey 
        : aiSettings.openrouterApiKey;
        
      if (!apiKey) {
        const providerName = aiSettings.provider === 'openai' ? 'OpenAI' : 'OpenRouter';
        alert(`Veuillez configurer la clé API ${providerName} dans les paramètres du projet`);
        return;
      }

      const generatedTask = await AIService.generateTask(
        aiSettings,
        project,
        title,
        description
      );

      setTitle(generatedTask.title || '');
      setDescription(generatedTask.description || '');
      // Mettre à jour d'autres champs si nécessaire
    } catch (error) {
      console.error('Erreur lors de la génération avec IA:', error);
      alert('Erreur lors de la génération avec IA. Voir la console pour plus de détails.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    const newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: title.trim(),
      description: description.trim(),
      status,
      projectId,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || startDate || new Date().toISOString().split('T')[0],
      dueDate: endDate || startDate || new Date().toISOString().split('T')[0], // Utilisation de endDate comme dueDate
      priority: 'medium',
      assignees: [],
      tags: [],
      subTasks: [],
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
        <div className="p-4 space-y-4">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Saisissez un titre pour cette tâche"
            className="w-full px-3 py-2 text-gray-900 dark:text-white bg-transparent border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 text-sm font-medium"
          />
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Projet</span>
            </div>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={projects.length === 0}
              className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <TextCursorInput className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ajouter une description (optionnel)"
              rows={3}
              className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-transparent border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 resize-none"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date de début</span>
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-transparent border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date de fin</span>
              </div>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-transparent border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <button
            type="button"
            onClick={handleGenerateWithAI}
            disabled={isGenerating || !projectId}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? 'Génération...' : 'Générer avec IA'}
          </button>
          
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ajouter la tâche
            </button>
          </div>
        </div>
        
        {!projectId && (
          <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-100 dark:border-yellow-800">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Sélectionnez un projet pour activer la génération IA
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
