import { useState, useRef, useEffect } from 'react';
import { Calendar, TextCursorInput, Folder, Sparkles } from 'lucide-react';
import { Task, Project, AISettings } from '../../types';
import { useApp } from '../../context/AppContext';
import AIService from '../../services/aiService';

interface AddTaskFormProps {
  projects: Project[];
  selectedProjectId: string;
  status: string;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function AddTaskForm({ projects, selectedProjectId, status, onAddTask, onCancel }: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [projectId, setProjectId] = useState(selectedProjectId);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialiser la date d'échéance au chargement du composant
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDueDate(today);
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
      const aiSettings = (project.aiSettings || state.appSettings?.aiSettings) as AISettings;

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

    const now = new Date().toISOString();
    const defaultDate = new Date().toISOString().split('T')[0];
    const taskDueDate = dueDate || defaultDate;

    const newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: title.trim(),
      description: description.trim(),
      status,
      projectId,
      startDate: now.split('T')[0],
      dueDate: taskDueDate,
      priority: 'medium',
      assignees: [],
      tags: [],
      subTasks: [],
      completedAt: status === 'done' ? now : undefined
    };

    onAddTask(newTask);
    setTitle('');
    setDescription('');
    setDueDate(defaultDate);
  };

  const isFormValid = title.trim() !== '' && projectId !== '';

  return (
    <form onSubmit={handleSubmit} className="mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
        <div className="p-5 space-y-5">
          {/* Titre avec focus auto */}
          <div className="relative group">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Qu'y a-t-il à faire ?"
              className="w-full px-0 py-2 text-lg font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-gray-100 dark:border-gray-700 focus:border-blue-500 focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <TextCursorInput className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Description</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ajouter des détails..."
              rows={2}
              className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none placeholder-gray-400 dark:placeholder-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Projet */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <Folder className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Projet</span>
              </div>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={projects.length === 0}
                className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date d'échéance */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Échéance</span>
              </div>
              <div className="relative group">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center bg-stripes">
          <button
            type="button"
            onClick={handleGenerateWithAI}
            disabled={isGenerating || !projectId}
            className={`
              inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 transform active:scale-95
              ${isGenerating
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-wait'
                : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5'
              }
            `}
          >
            <Sparkles className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : 'animate-pulse'}`} />
            {isGenerating ? 'Analyse...' : 'Magie IA'}
          </button>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors uppercase tracking-tight"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className={`
                px-6 py-2 text-sm font-bold text-white rounded-xl transition-all duration-300 transform active:scale-95
                ${isFormValid
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Créer la tâche
            </button>
          </div>
        </div>

        {!projectId && (
          <div className="px-5 py-2 bg-amber-500/10 dark:bg-amber-500/20 border-t border-amber-500/20">
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest text-center">
              Sélectionnez un projet pour activer la puissance de l'IA
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
