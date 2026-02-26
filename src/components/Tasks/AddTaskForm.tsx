import { useState, useRef, useEffect } from 'react';
import { Clock, TextCursorInput, Folder, Sparkles } from 'lucide-react';
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
  const [estimatedHours, setEstimatedHours] = useState<number>(2);
  const [subTasks, setSubTasks] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimationReasoning, setEstimationReasoning] = useState('');

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
    if (!projectId || !title.trim()) {
      alert('Veuillez au moins saisir un titre pour que l\'IA puisse travailler.');
      return;
    }

    try {
      setIsGenerating(true);
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return;

      const aiSettings = (project.aiSettings || state.appSettings?.aiSettings) as AISettings;

      // 1. Générer titre et description plus riches
      const generatedTask = await AIService.generateTask(aiSettings, project, title, description);
      setTitle(generatedTask.title || title);
      setDescription(generatedTask.description || description);

      // 2. Estimer la durée basée sur l'historique et le délai prévu
      setIsEstimating(true);
      const estimation = await AIService.estimateTaskDuration(
        aiSettings,
        state,
        generatedTask.title || title,
        generatedTask.description,
        new Date().toISOString().split('T')[0],
        dueDate
      );

      // Si l'IA suggère une date (tâche longue), on l'applique
      if (estimation.suggestedDueDate) {
        setDueDate(estimation.suggestedDueDate);
      }

      // Si c'est une tâche de plus d'un jour (> 8h), on ne remplit pas l'effort (sera géré par les dates)
      // Sinon on remplit les heures estimées
      if (estimation.estimatedHours > 8) {
        setEstimatedHours(0); // On laisse à 0 pour que le calcul par dates prenne le dessus plus tard ou soit saisi manuellement
      } else {
        setEstimatedHours(estimation.estimatedHours);
      }

      setEstimationReasoning(estimation.reasoning);
      setIsEstimating(false);

      // 3. Décomposer en sous-tâches si c'est "complexe" (titre long ou description fournie)
      if (title.length > 20 || description.length > 50) {
        const generatedSubs = await AIService.generateSubTasksWithAI(aiSettings, project, { ...generatedTask, id: 'temp', subTasks: [] } as any);
        setSubTasks(generatedSubs.map(s => ({
          id: Math.random().toString(36).substr(2, 9),
          title: s.title,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })));
      }

    } catch (error) {
      console.error('Erreur lors de la génération avec IA:', error);
    } finally {
      setIsGenerating(false);
      setIsEstimating(false);
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
      estimatedHours: estimatedHours,
      assignees: [],
      tags: [],
      subTasks: subTasks,
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

            {/* Estimation Heures */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Estimation</span>
                </div>
                {isEstimating && <Sparkles className="w-3 h-3 text-purple-500 animate-pulse" />}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                  min="0"
                />
                <span className="text-xs text-gray-400 font-bold uppercase">Heures</span>
              </div>
              {estimationReasoning && (
                <p className="text-[10px] text-purple-500 italic mt-1 font-medium leading-tight">
                  💡 {estimationReasoning}
                </p>
              )}
            </div>
          </div>

          {/* Sous-tâches générées preview */}
          {subTasks.length > 0 && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest flex items-center">
                  <Sparkles className="w-3 h-3 mr-1" /> Sous-tâches suggérées ({subTasks.length})
                </span>
                <button
                  type="button"
                  onClick={() => setSubTasks([])}
                  className="text-[10px] text-gray-400 hover:text-red-500 transition-colors uppercase font-bold"
                >
                  Effacer
                </button>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {subTasks.map((st) => (
                  <div key={st.id} className="flex items-center p-2 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-lg text-xs text-gray-600 dark:text-gray-400 italic">
                    <div className="w-1 h-1 rounded-full bg-purple-400 mr-2" />
                    {st.title}
                  </div>
                ))}
              </div>
            </div>
          )}
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
