import React, { useState, useCallback } from 'react';
import { Check, Plus, Trash2, GripVertical } from 'lucide-react';
import { SubTask, Project, Task } from '../../types';
import { DragDropContext, RBDDroppable as Droppable, RBDDraggable as Draggable, RBDDropResult as DropResult } from '../DnDWrapper';
import { AIService } from '../../services/aiService';
import { useApp } from '../../context/AppContext';

interface SubTasksListProps {
  subTasks: SubTask[];
  onSubTasksChange: (subTasks: SubTask[]) => void;
  project: Project;
  task: Task;
}

export function SubTasksList({ subTasks = [], onSubTasksChange, project, task }: SubTasksListProps) {
  const [newTask, setNewTask] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { state } = useApp();
  const aiSettings = state.appSettings?.aiSettings;

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Empêche la propagation de l'événement
    
    if (newTask.trim()) {
      const task: SubTask = {
        id: Date.now().toString(),
        title: newTask.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onSubTasksChange([...subTasks, task]);
      setNewTask('');
    }
    
    return false; // Empêche le comportement par défaut du formulaire
  };

  const toggleTask = (id: string) => {
    const now = new Date().toISOString();
    const updated = subTasks.map(task => 
      task.id === id ? { 
        ...task, 
        completed: !task.completed,
        updatedAt: now,
        completedAt: !task.completed ? now : task.completedAt // Mettre à jour completedAt uniquement si la tâche est marquée comme complétée
      } : task
    );
    onSubTasksChange(updated);
  };

  const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = subTasks.filter(task => task.id !== id);
    onSubTasksChange(updated);
  };

  const generateWithAI = useCallback(async () => {
    console.log('Bouton Générer avec IA cliqué');
    console.log('Paramètres IA:', aiSettings);
    
    if (!aiSettings?.isConfigured) {
      const errorMsg = 'La fonctionnalité IA n\'est pas configurée dans les paramètres';
      console.error(errorMsg);
      alert(errorMsg);
      return;
    }

    // Vérifier que la clé API est disponible
    const apiKey = aiSettings.provider === 'openai' 
      ? aiSettings.openaiApiKey 
      : aiSettings.openrouterApiKey;
    
    if (!apiKey) {
      const errorMsg = `Clé API ${aiSettings.provider} manquante. Veuillez configurer les paramètres IA.`;
      console.error(errorMsg);
      alert(errorMsg);
      return;
    }

    setIsGenerating(true);
    console.log('Début de la génération des sous-tâches avec IA...');
    
    try {
      console.log('Appel à AIService.generateSubTasksWithAI avec les paramètres:', {
        project: { name: project.name, id: project.id },
        task: { title: task.title, id: task.id },
        existingSubTasksCount: subTasks.length
      });
      
      const generatedSubTasks = await AIService.generateSubTasksWithAI(
        aiSettings,
        project,
        task,
        subTasks
      );
      
      console.log('Sous-tâches générées avec succès:', generatedSubTasks);

      if (!generatedSubTasks || generatedSubTasks.length === 0) {
        throw new Error('Aucune sous-tâche générée par l\'IA');
      }

      const newSubTasks = generatedSubTasks.map((st, index) => ({
        id: `ai-gen-${Date.now()}-${index}`,
        title: st.title || `Sous-tâche ${index + 1}`,
        description: st.description || '',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      console.log('Nouvelles sous-tâches à ajouter:', newSubTasks);
      onSubTasksChange([...subTasks, ...newSubTasks]);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Erreur lors de la génération des sous-tâches:', error);
      alert(`Erreur lors de la génération des sous-tâches: ${errorMsg}`);
    } finally {
      console.log('Fin de la génération des sous-tâches');
      setIsGenerating(false);
    }
  }, [aiSettings, project, task, subTasks, onSubTasksChange]);

  // Vérifier si l'IA est disponible
  const isAIAvailable = aiSettings?.isConfigured === true;

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(subTasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onSubTasksChange(items);
  };

  return (
    <div className="mt-2">
      <h3 className="text-sm font-medium mb-2">Sous-tâches</h3> 

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="subtasks">
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef}
              className="space-y-2"
            >
              {subTasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group"
                      onClick={() => toggleTask(task.id)}
                    >
                      <div 
                        {...provided.dragHandleProps}
                        className="p-1 mr-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-move"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                        task.completed ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                      }`}>
                        {task.completed && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm flex-1 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                        {task.title}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => deleteTask(task.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                        title="Supprimer la sous-tâche"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex items-center gap-2 mb-2 pt-2">
        <form className="flex-1 flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Ajouter une sous-tâche..."
            className="flex-1 px-3 py-2 border border-gray-300 bg-transparent rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={addTask}
            type="submit"
            className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            title="Ajouter une sous-tâche"
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            onClick={generateWithAI}
            disabled={isGenerating || !isAIAvailable}
            className={`p-2 rounded-md focus:outline-none ${
              isAIAvailable
                ? 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title={
              isAIAvailable
                ? "Générer des sous-tâches avec l'IA"
                : "Configurez l'IA dans les paramètres pour utiliser cette fonctionnalité"
            }
          >
            {isGenerating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
                <path d="M5 3v4"></path>
                <path d="M19 17v4"></path>
                <path d="M3 5h4"></path>
                <path d="M17 19h4"></path>
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
