import React, { useState, useCallback, useMemo } from 'react';
import { Check, Plus, Trash2, GripVertical, Edit2, X } from 'lucide-react';
import { SubTask, Project, Task } from '../../types';
import { DragDropContext, RBDDroppable as Droppable, RBDDraggable as Draggable, RBDDropResult as DropResult } from '../DnDWrapper';
import { AIService } from '../../services/aiService';
import { useApp } from '../../context/AppContext';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';


export interface SubTasksListProps {
  subTasks: SubTask[];
  onSubTasksChange: (subTasks: SubTask[]) => void;
  project: Project;
  task: Task;
  isEditing?: boolean;
  canEdit?: boolean;
}

export function SubTasksList({ subTasks = [], onSubTasksChange, project, task, isEditing = false, canEdit = true }: SubTasksListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pasteLines, setPasteLines] = useState<string[]>([]);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const { state } = useApp();



  const aiSettings = state.appSettings?.aiSettings;

  // Calculer les tâches groupées
  const groupedTasks = useMemo(() => {
    const groups: Record<string, SubTask[]> = {};

    // S'assurer qu'on a toujours au moins le groupe vide s'il y a des tâches sans groupe
    if (subTasks.some(t => !t.group)) {
      groups[''] = [];
    }

    subTasks.forEach(st => {
      const groupName = st.group || '';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(st);
    });

    return groups;
  }, [subTasks]);

  const groupNames = useMemo(() => {
    const names: string[] = [];
    const seen = new Set<string>();

    subTasks.forEach(st => {
      const g = st.group || '';
      if (!seen.has(g)) {
        seen.add(g);
        names.push(g);
      }
    });

    return names;
  }, [subTasks]);

  const addTask = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      const task: SubTask = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        group: newGroupName.trim() || undefined
      };
      onSubTasksChange([...subTasks, task]);
      setNewTaskTitle('');
      // On garde le nom du groupe pour faciliter l'ajout multiple dans le même groupe
    }
  };

  const toggleTask = (id: string) => {
    if (!canEdit) return;
    const now = new Date().toISOString();
    const updated = subTasks.map(task =>
      task.id === id ? {
        ...task,
        completed: !task.completed,
        updatedAt: now,
        completedAt: !task.completed ? now : task.completedAt
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
    if (!aiSettings?.isConfigured) {
      alert('La fonctionnalité IA n\'est pas configurée');
      return;
    }

    setIsGenerating(true);
    try {
      const generatedSubTasks = await AIService.generateSubTasksWithAI(
        aiSettings,
        project,
        task,
        subTasks
      );

      if (generatedSubTasks && generatedSubTasks.length > 0) {
        const newSubTasks = generatedSubTasks.map((st, index) => ({
          id: `ai-gen-${Date.now()}-${index}`,
          title: st.title || `Sous-tâche ${index + 1}`,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          group: undefined // Par défaut sans groupe
        }));
        onSubTasksChange([...subTasks, ...newSubTasks]);
      }
    } catch (error) {
      console.error('Erreur IA:', error);
      alert('Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  }, [aiSettings, project, task, subTasks, onSubTasksChange]);

  /* State pour l'édition d'une sous-tâche existante */
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingGroup, setEditingGroup] = useState('');

  const startEditing = (task: SubTask) => {
    if (!isEditing) return;
    setEditingSubTaskId(task.id);
    setEditingTitle(task.title);
    setEditingGroup(task.group || '');
  };

  const cancelEditing = () => {
    setEditingSubTaskId(null);
    setEditingTitle('');
    setEditingGroup('');
  };

  const saveEditedTask = (taskId: string) => {
    if (editingTitle.trim()) {
      const updated = subTasks.map(t =>
        t.id === taskId
          ? {
            ...t,
            title: editingTitle.trim(),
            group: editingGroup.trim() || undefined,
            updatedAt: new Date().toISOString()
          }
          : t
      );
      onSubTasksChange(updated);
      setEditingSubTaskId(null);
    }
  };

  const onDragEnd = (result: DropResult) => {



    if (!result.destination) {

      return;
    }

    if (!isEditing) {

      return;
    }

    const sourceGroup = result.source.droppableId;
    const destGroup = result.destination.droppableId;

    // Mapper les IDs de droppable vers les clés réelles des groupes
    // Format attendu: group-NomDuGroupe ou group-ungrouped
    const getGroupKey = (id: string) => {
      const g = id.replace('group-', '');
      return g === 'ungrouped' ? '' : g;
    };

    const sourceGroupKey = getGroupKey(sourceGroup);
    const destGroupKey = getGroupKey(destGroup);

    // Si on déplace dans le même groupe
    if (sourceGroup === destGroup) {
      const groupTasks = groupedTasks[sourceGroupKey] || [];
      const items = Array.from(groupTasks);
      const [reorderedItem] = items.splice(result.source.index, 1);
      if (!reorderedItem) return;
      items.splice(result.destination.index, 0, reorderedItem);

      // Reconstruire la liste complète en préservant l'ordre des groupes
      const newSubTasks: SubTask[] = [];
      groupNames.forEach(gName => {
        if (gName === sourceGroupKey) {
          newSubTasks.push(...items);
        } else {
          newSubTasks.push(...(groupedTasks[gName] || []));
        }
      });

      onSubTasksChange(newSubTasks);
    } else {
      // Déplacement entre groupes
      const sourceItems = Array.from(groupedTasks[sourceGroupKey] || []);
      const destItems = Array.from(groupedTasks[destGroupKey] || []);

      const [movedItem] = sourceItems.splice(result.source.index, 1);
      if (!movedItem) return;

      // Mettre à jour le groupe de l'item
      const updatedItem = { ...movedItem, group: destGroupKey === '' ? undefined : destGroupKey };

      destItems.splice(result.destination.index, 0, updatedItem);

      // Reconstruire la liste complète en préservant l'ordre des groupes
      const newSubTasks: SubTask[] = [];
      groupNames.forEach(gName => {
        if (gName === sourceGroupKey) {
          newSubTasks.push(...sourceItems);
        } else if (gName === destGroupKey) {
          newSubTasks.push(...destItems);
        } else {
          newSubTasks.push(...(groupedTasks[gName] || []));
        }
      });

      onSubTasksChange(newSubTasks);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (text.includes('\n')) {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 1) {
        e.preventDefault();
        setPasteLines(lines);
        setIsPasteModalOpen(true);
      }
    }
  };

  const confirmPasteLines = () => {
    const now = new Date().toISOString();
    const newSubTasks: SubTask[] = pasteLines.map((line, index) => ({
      id: `paste-${Date.now()}-${index}`,
      title: line,
      completed: false,
      createdAt: now,
      updatedAt: now,
      group: newGroupName.trim() || undefined
    }));
    onSubTasksChange([...subTasks, ...newSubTasks]);
    setIsPasteModalOpen(false);
    setPasteLines([]);
  };

  return (
    <div className="mt-4 space-y-4">
      {isEditing ? (
        <div className="flex items-center justify-between mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2">
            <GripVertical className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Mode édition : Glissez-déposez les sous-tâches pour les réorganiser
            </span>
          </div>
          {aiSettings?.isConfigured && (
            <button
              type="button"
              onClick={generateWithAI}
              disabled={isGenerating}
              className="text-xs flex items-center text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
            >
              {isGenerating ? 'Génération...' : 'Suggérer avec IA'}
            </button>
          )}
        </div>
      ) : (
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sous-tâches</h3>
        </div>
      )}

      <div className="space-y-4">
        <DragDropContext onDragEnd={onDragEnd}>
          {groupNames.map(groupName => {
            const tasks = groupedTasks[groupName] || [];
            if (tasks.length === 0 && !isEditing) return null;
            if (tasks.length === 0 && groupName === '' && groupNames.length > 1) return null;

            // Identifiant unique pour le droppable (ne doit pas être une chaîne vide)
            const droppableId = `group-${groupName || 'ungrouped'}`;

            return (
              <div key={groupName || 'ungrouped'} className="relative group/section">
                {/* En-tête du groupe */}
                {(groupName || groupNames.length > 1) && (
                  <div className="flex items-center mb-2 px-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${groupName ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 italic'}`}>
                      {groupName || 'Sans groupe'}
                    </span>
                    <span className="ml-2 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
                  </div>
                )}

                <Droppable droppableId={droppableId} isDropDisabled={!isEditing}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`space-y-1 min-h-[10px] rounded-lg transition-all ${snapshot.isDraggingOver ? 'bg-blue-100/60 dark:bg-blue-900/40 border-2 border-blue-300 dark:border-blue-600' : isEditing ? 'bg-gray-50/30 dark:bg-gray-700/20 border-2 border-dashed border-gray-200 dark:border-gray-600' : ''}`}
                    >
                      {tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!isEditing || editingSubTaskId === task.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center p-2 rounded-md group transition-all ${task.completed ? 'opacity-60 bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700'
                                } border border-transparent ${snapshot.isDragging ? 'shadow-lg border-blue-200 z-10' : 'hover:border-gray-200 dark:hover:border-gray-600'} ${!isEditing ? 'cursor-pointer' : ''}`}
                            >
                              {isEditing && editingSubTaskId !== task.id && (
                                <div
                                  {...provided.dragHandleProps}
                                  className="mr-2 text-gray-300 hover:text-gray-500 cursor-move opacity-50 group-hover:opacity-100 transition-all"
                                  title="Glisser pour réorganiser"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                              )}

                              <div
                                className={`w-5 h-5 rounded border flex items-center justify-center mr-3 cursor-pointer transition-colors ${task.completed
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'border-gray-300 dark:border-gray-500 hover:border-blue-400'
                                  }`}
                                onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                              >
                                {task.completed && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>

                              <div className="flex-1 min-w-0">
                                {editingSubTaskId === task.id ? (
                                  <div className="flex flex-col gap-2 p-1 bg-white dark:bg-gray-800 rounded border border-blue-200 shadow-sm" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="text"
                                      value={editingTitle}
                                      onChange={(e) => setEditingTitle(e.target.value)}
                                      className="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEditedTask(task.id);
                                        if (e.key === 'Escape') cancelEditing();
                                      }}
                                    />
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={editingGroup}
                                        onChange={(e) => setEditingGroup(e.target.value)}
                                        placeholder="Groupe"
                                        className="flex-1 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        list="existing-groups"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveEditedTask(task.id);
                                        }}
                                      />
                                      <button onClick={() => saveEditedTask(task.id)} className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600" title="Valider">
                                        <Check className="w-3 h-3" />
                                      </button>
                                      <button onClick={cancelEditing} className="p-1.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500" title="Annuler">
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between group">
                                    <span
                                      className={`text-sm block truncate select-none flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'} ${isEditing ? 'cursor-text hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-1 rounded transition-all' : ''}`}
                                      onClick={(e) => {
                                        if (isEditing) {
                                          e.stopPropagation();
                                          startEditing(task);
                                        } else {
                                          toggleTask(task.id);
                                        }
                                      }}
                                      title={isEditing ? "Cliquez pour modifier le titre et le groupe" : "Cliquez pour cocher/décocher"}
                                    >
                                      {task.title}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {isEditing && editingSubTaskId !== task.id && (
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2 space-x-1">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); startEditing(task); }}
                                    className="p-1.5 text-gray-400 hover:text-blue-500 transition-all rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                    title="Modifier le titre et le groupe"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => deleteTask(task.id, e)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 transition-all rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </DragDropContext>
      </div>

      {/* Zone d'ajout global (uniquement mode édition) */}
      {isEditing && (
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => e.key === 'Enter' && addTask(e)}
              placeholder="Nouvelle sous-tâche..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Groupe"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask(e)}
                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 transition-all"
                list="existing-groups"
              />
              <datalist id="existing-groups">
                {groupNames.filter(g => g !== '').map(g => (
                  <option key={g} value={g} />
                ))}
              </datalist>

              <button
                type="button"
                onClick={addTask}
                disabled={!newTaskTitle.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 ml-1 font-medium">
            💡 Glissez les poignées :: pour réorganiser • Cliquez sur une tâche pour modifier
          </p>
        </div>
      )}

      {/* Modal de collage */}
      <Modal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        title="Créer plusieurs sous-tâches"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Voulez-vous créer <span className="font-bold text-blue-600">{pasteLines.length}</span> sous-tâches à partir du texte collé
            {newGroupName ? <span> dans le groupe <span className="font-bold">{newGroupName}</span></span> : ''} ?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsPasteModalOpen(false)}>Annuler</Button>
            <Button variant="primary" onClick={confirmPasteLines}>Créer les tâches</Button>
          </div>
        </div>
      </Modal>

      {subTasks.length === 0 && !isEditing && (
        <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500 italic bg-gray-50/50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
          Aucune sous-tâche pour le moment
        </div>
      )}
    </div>
  );
}
