import React, { useState, useCallback, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, X as XIcon, Edit2, Eye, Image as ImageIcon, Video, Music, Link as LinkIcon } from 'lucide-react';
import { Task, Project, SubTask, Attachment, User } from '../../types';
import { useApp } from '../../context/AppContext';
import { SubTasksList } from './SubTasksList';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MDEditorClient from '../UI/MDEditorClient';
import { CompactAttachments } from '../UI/CompactAttachments';
import { cloudinaryService } from '../../services/collaboration/cloudinaryService';
import { localAttachmentService } from '../../services/localAttachmentService';
import { TaskComments } from './TaskComments';

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

// Fonction de validation des données de la tâche
const validateTaskData = (task: Task): Task => {
  const dueDate = task.dueDate || new Date().toISOString().split('T')[0];

  const validatedTask: Task = {
    ...task,
    title: task.title || '',
    description: task.description || '',
    startDate: task.startDate || new Date().toISOString().split('T')[0],
    dueDate: dueDate,
    priority: task.priority || 'medium',
    estimatedHours: typeof task.estimatedHours === 'number' ? task.estimatedHours : 0,
    tags: Array.isArray(task.tags) ? task.tags : [],
    assignees: Array.isArray(task.assignees) ? task.assignees : [],
    subTasks: Array.isArray(task.subTasks) ? task.subTasks : [],
    status: task.status || 'todo',
    projectId: task.projectId || '',
    id: task.id || '',
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || new Date().toISOString()
  };

  return validatedTask;
};

interface EditTaskFormProps {
  task: Task;
  onClose: () => void;
  project: Project;
  canEdit?: boolean;
}

export function EditTaskForm({ task, onClose, project, canEdit: canEditProp }: EditTaskFormProps) {
  const { state, dispatch } = useApp();
  const currentUserRole = project.memberRoles?.[state.cloudUser?.uid || ''] || 'member';
  // Ensure canEdit logic correctly identifies viewers as unable to edit
  const canEdit = canEditProp !== undefined ? canEditProp : (
    (!project.source || project.source === 'local') ||
    project.ownerId === state.cloudUser?.uid ||
    ['admin', 'member'].includes(currentUserRole)
  );

  // State initial avec validation
  const [editedTask, setEditedTask] = useState<Task>(() => {
    const dueDate = task.dueDate || new Date().toISOString().split('T')[0];

    return validateTaskData({
      ...task,
      tags: [...(task.tags || [])],
      assignees: [...(task.assignees || [])],
      startDate: task.startDate || new Date().toISOString().split('T')[0],
      dueDate: dueDate,
      priority: task.priority || 'medium',
      estimatedHours: task.estimatedHours || 0,
      subTasks: [...(task.subTasks || [])],
      completedAt: task.completedAt,
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: task.updatedAt || new Date().toISOString()
    });
  });

  // Gérer les changements des sous-tâches
  const handleSubTasksChange = useCallback((newSubTasks: SubTask[]) => {
    // Mise à jour de l'état local
    setEditedTask(prev => {
      const updated = {
        ...prev,
        subTasks: newSubTasks,
        updatedAt: new Date().toISOString()
      };

      // Sauvegarde immédiate (Ajax-like) pour ne pas perdre les données
      // On utilise un timeout pour éviter de bloquer le rendu et s'assurer que c'est traité hors du cycle de rendu immédiat
      setTimeout(() => {
        dispatch({
          type: 'UPDATE_TASK',
          payload: updated
        });
      }, 0);

      return updated;
    });
  }, [dispatch]);

  // Mode édition/visualisation
  const [isEditing, setIsEditing] = useState(false);

  // Gérer l'ajout d'un tag
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = (e?: React.FormEvent) => {
    // Si c'est un événement de formulaire, on empêche le comportement par défaut
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const tagToAdd = newTag.trim();
    if (tagToAdd && !editedTask.tags.includes(tagToAdd)) {
      const updatedTags = [...editedTask.tags, tagToAdd];
      setEditedTask(prev => ({
        ...prev,
        tags: updatedTags,
        updatedAt: new Date().toISOString()
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    const updatedTags = editedTask.tags.filter(t => t !== tag);
    setEditedTask(prev => ({
      ...prev,
      tags: updatedTags,
      updatedAt: new Date().toISOString()
    }));
  };

  // Gérer l'ajout d'un assigné
  const [isAddingAssignee, setIsAddingAssignee] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');

  const handleAddAssignee = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (!editedTask.assignees.includes(userId)) {
      const updatedAssignees = [...editedTask.assignees, userId];
      setEditedTask(prev => ({
        ...prev,
        assignees: updatedAssignees,
        updatedAt: new Date().toISOString()
      }));
    }
    setAssigneeSearch('');
    setIsAddingAssignee(false);
  };

  const handleRemoveAssignee = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    const updatedAssignees = editedTask.assignees.filter(id => id !== userId);
    setEditedTask(prev => ({
      ...prev,
      assignees: updatedAssignees,
      updatedAt: new Date().toISOString()
    }));
  };

  // Gérer la soumission du formulaire avec validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Valider les données
      const validatedTask = validateTaskData(editedTask);

      // Vérifier que les données sont valides
      if (!validatedTask.title || !validatedTask.projectId) {
        throw new Error('Le titre et le projet sont requis');
      }

      // Vérifier que les dates sont valides
      const startDate = new Date(validatedTask.startDate);
      const dueDate = new Date(validatedTask.dueDate);

      if (isNaN(startDate.getTime()) || isNaN(dueDate.getTime())) {
        throw new Error('Les dates doivent être valides');
      }

      // Vérifier que la date de début est inférieure ou égale à la date d'échéance
      if (startDate > dueDate) {
        throw new Error('La date de début doit être antérieure ou égale à la date d\'échéance');
      }

      // Préparer les données mises à jour
      const updatedTask: Task = {
        ...validatedTask,
        updatedAt: new Date().toISOString(),
        completedAt: validatedTask.status === 'done' && task.status !== 'done'
          ? new Date().toISOString()
          : validatedTask.completedAt ?? undefined
      };

      // Mettre à jour la tâche
      dispatch({
        type: 'UPDATE_TASK',
        payload: updatedTask
      });

      // Passer en mode visualisation au lieu de fermer
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la modification de la tâche:', error);
      alert('Une erreur est survenue lors de la modification de la tâche. Veuillez vérifier les données.');
    }
  };

  // Gestion des utilisateurs assignables (Membres du projet uniquement pour Cloud)
  const [assignableUsers, setAssignableUsers] = useState<User[]>(state.users);

  useEffect(() => {
    const loadProjectMembers = async () => {
      // Si c'est un projet Firebase avec des membres définis
      if (project.source === 'firebase' && project.members && project.members.length > 0) {
        try {
          const { firebaseService } = await import('../../services/collaboration/firebaseService');
          const membersData: User[] = [];

          for (const uid of project.members) {
            // Pour l'utilisateur connecté, on peut peut-être prendre ses données "locales" si disponibles
            // Sinon on fetch
            const profile = await firebaseService.getUserProfile(uid);
            if (profile) {
              // Conversion en objet User complet pour l'UI
              membersData.push({
                id: profile.uid,
                name: profile.displayName || 'Utilisateur',
                email: profile.email || '',
                avatar: profile.photoURL || '',
                role: 'member',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
                // Autres champs optionnels laissés vides
              });
            } else if (uid === state.cloudUser?.uid && state.cloudUser) {
              // Fallback pour l'utilisateur courant s'il n'est pas trouvé (peu probable)
              membersData.push({
                id: uid,
                name: state.cloudUser.displayName || 'Moi',
                email: state.cloudUser.email || '',
                avatar: state.cloudUser.photoURL || '',
                role: 'admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          }
          setAssignableUsers(membersData);
        } catch (e) {
          console.error("Erreur chargement membres:", e);
          // Fallback sur tous les users si erreur
          // Ou ne rien faire
        }
      } else {
        // Projet local : on utilise tous les utilisateurs locaux
        setAssignableUsers(state.users);
      }
    };

    loadProjectMembers();
  }, [project, state.users, state.cloudUser]);
  // Filtrer les utilisateurs disponibles pour l'assignation (variable for future use if needed, commenting out to clear lint)
  // const availableUsers = state.users.filter(
  //   (user: User) => !editedTask.assignees.includes(user.id)
  // );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {project.name}
          </h2>
          <div className="flex items-center space-x-2">
            {canEdit && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={isEditing ? "Passer en mode lecture" : "Passer en mode édition"}
              >
                {isEditing ? <Eye className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Titre</label>
            {isEditing ? (
              <input
                type="text"
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition duration-200"
                placeholder="Titre de la tâche"
                required
              />
            ) : (
              <div className="text-xl font-semibold text-gray-900 dark:text-white py-2">
                {editedTask.title}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
            {isEditing ? (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => document.getElementById('desc-media-upload-image')?.click()}
                    className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex items-center gap-1.5 text-xs font-medium transition-colors"
                    title="Insérer une image"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById('desc-media-upload-video')?.click()}
                    className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex items-center gap-1.5 text-xs font-medium transition-colors"
                    title="Insérer une vidéo (MP4, WebM...)"
                  >
                    <Video className="w-4 h-4" />
                    <span className="hidden sm:inline">Vidéo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById('desc-media-upload-audio')?.click()}
                    className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex items-center gap-1.5 text-xs font-medium transition-colors"
                    title="Insérer un audio (MP3, WAV...)"
                  >
                    <Music className="w-4 h-4" />
                    <span className="hidden sm:inline">Audio</span>
                  </button>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt("Entrez l'URL de la vidéo YouTube, Vimeo ou autre lien :");
                      if (url) {
                        let markdown = '';
                        if (url.includes('youtube') || url.includes('youtu.be')) markdown = `\n[📺 YouTube: Vidéo](${url})\n`;
                        else markdown = `\n[🔗 Lien](${url})\n`;

                        setEditedTask(prev => ({
                          ...prev,
                          description: (prev.description || '') + markdown
                        }));
                      }
                    }}
                    className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex items-center gap-1.5 text-xs font-medium transition-colors"
                    title="Insérer un lien (YouTube...)"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Lien / YouTube</span>
                  </button>

                  {/* Inputs cachés pour l'upload */}
                  <input
                    type="file"
                    id="desc-media-upload-image"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        try {
                          let url = '';
                          if (project.source === 'firebase') {
                            const uploaded = await cloudinaryService.uploadFile(file, { uploadedBy: 'user', projectId: project.id });
                            url = uploaded.url;
                          } else {
                            url = await localAttachmentService.convertFileToBase64(file);
                          }
                          setEditedTask(prev => ({ ...prev, description: (prev.description || '') + `\n![${file.name}](${url})\n` }));
                        } catch (err) { alert('Erreur upload image'); }
                        e.target.value = '';
                      }
                    }}
                  />
                  <input
                    type="file"
                    id="desc-media-upload-video"
                    className="hidden"
                    accept="video/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        try {
                          let url = '';
                          if (project.source === 'firebase') {
                            const uploaded = await cloudinaryService.uploadFile(file, { uploadedBy: 'user', projectId: project.id });
                            url = uploaded.url;
                          } else {
                            const validation = localAttachmentService.validateFile(file);
                            if (!validation.isValid) throw new Error(validation.error);
                            url = await localAttachmentService.convertFileToBase64(file);
                          }
                          setEditedTask(prev => ({ ...prev, description: (prev.description || '') + `\n[🎥 Vidéo: ${file.name}](${url})\n` }));
                        } catch (err) { alert('Erreur upload vidéo'); }
                        e.target.value = '';
                      }
                    }}
                  />
                  <input
                    type="file"
                    id="desc-media-upload-audio"
                    className="hidden"
                    accept="audio/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        try {
                          let url = '';
                          if (project.source === 'firebase') {
                            const uploaded = await cloudinaryService.uploadFile(file, { uploadedBy: 'user', projectId: project.id });
                            url = uploaded.url;
                          } else {
                            const validation = localAttachmentService.validateFile(file);
                            if (!validation.isValid) throw new Error(validation.error);
                            url = await localAttachmentService.convertFileToBase64(file);
                          }
                          setEditedTask(prev => ({ ...prev, description: (prev.description || '') + `\n[🎵 Audio: ${file.name}](${url})\n` }));
                        } catch (err) { alert('Erreur upload audio'); }
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
                <MDEditorClient
                  value={editedTask.description || ''}
                  onChange={(value: string | undefined) => setEditedTask({ ...editedTask, description: value || '' })}
                  height={200}
                  preview="edit"
                  className="w-full"
                  textareaProps={{
                    placeholder: "## Description en Markdown\n\nVous pouvez utiliser :\n- **Gras**\n- *Italique*\n- `Code inline`\n- [Liens](url)\n- Listes à puces\n\n### Exemple :\n\n**Tâche importante** à compléter avant la date limite.\n\n- [ ] Sous-tâche 1\n- [ ] Sous-tâche 2\n\n```javascript\n// Code exemple\n\n```"
                  }}
                />
              </div>
            ) : (
              <div className="markdown-body bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg text-gray-700 dark:text-gray-300 min-h-[100px]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    strong: ({ children }) => <strong style={{ fontWeight: 'bold', color: 'inherit' }}>{children}</strong>,
                    em: ({ children }) => <em style={{ fontStyle: 'italic', color: 'inherit' }}>{children}</em>,
                    code: ({ className, children }) => {
                      const isInline = !className?.includes('language-');
                      return isInline
                        ? <code style={{ backgroundColor: '#f3f4f6', padding: '0.2em 0.4em', borderRadius: '3px', fontSize: '0.85em', fontFamily: 'monospace' }}>{children}</code>
                        : <code style={{ backgroundColor: '#f3f4f6', padding: '1em', borderRadius: '6px', display: 'block', overflowX: 'auto', fontFamily: 'monospace' }}>{children}</code>;
                    },
                    p: ({ children }) => <p style={{ marginBottom: '1em' }}>{children}</p>,
                    ul: ({ children }) => <ul style={{ marginBottom: '1em', paddingLeft: '1.5em' }}>{children}</ul>,
                    ol: ({ children }) => <ol style={{ marginBottom: '1em', paddingLeft: '1.5em' }}>{children}</ol>,
                    li: ({ children }) => <li style={{ marginBottom: '0.25em' }}>{children}</li>,
                    h1: ({ children }) => <h1 style={{ fontSize: '1.5em', fontWeight: 'bold', marginTop: '1.5em', marginBottom: '0.5em', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5em' }}>{children}</h1>,
                    h2: ({ children }) => <h2 style={{ fontSize: '1.25em', fontWeight: 'bold', marginTop: '1.5em', marginBottom: '0.5em', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.3em' }}>{children}</h2>,
                    h3: ({ children }) => <h3 style={{ fontSize: '1.1em', fontWeight: 'bold', marginTop: '1.5em', marginBottom: '0.5em' }}>{children}</h3>,
                    img: (props) => (
                      <img
                        {...props}
                        style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '0.5em', marginBottom: '0.5em', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        alt={props.alt || ''}
                      />
                    ),
                    a: ({ href, children }) => {
                      if (!href) return <span>{children}</span>;

                      // Helper to check for video
                      const isVideo = href.match(/\.(mp4|mov|webm)$/i);
                      const isYouTube = href.includes('youtube.com') || href.includes('youtu.be');
                      const isAudio = href.match(/\.(mp3|wav|ogg)$/i);

                      if (isVideo) {
                        return (
                          <div style={{ marginTop: '0.5em', marginBottom: '0.5em' }}>
                            <video src={href} controls style={{ maxWidth: '100%', borderRadius: '8px' }} />
                          </div>
                        );
                      }

                      if (isYouTube) {
                        let videoId = '';
                        if (href.includes('youtu.be')) {
                          videoId = href.split('/').pop() || '';
                        } else if (href.includes('v=')) {
                          videoId = new URLSearchParams(href.split('?')[1]).get('v') || '';
                        }

                        if (videoId) {
                          return (
                            <div style={{ marginTop: '0.5em', marginBottom: '0.5em', position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px' }}>
                              <iframe
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title="YouTube video"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          );
                        }
                      }

                      if (isAudio) {
                        return (
                          <div style={{ marginTop: '0.5em', marginBottom: '0.5em', padding: '0.5em', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                            <audio src={href} controls style={{ width: '100%' }} />
                          </div>
                        );
                      }

                      return (
                        <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                          {children}
                        </a>
                      );
                    }
                  }}
                >
                  {cleanMarkdown(editedTask.description) || "*Aucune description*"}
                </ReactMarkdown>
              </div>
            )}
          </div>

          <CompactAttachments
            attachments={editedTask.attachments || []}
            isEditing={isEditing}
            onAddFiles={async (files) => {
              const filesArray = Array.from(files);
              const isCloudProject = project.source === 'firebase';

              for (const file of filesArray) {
                try {
                  let attachment: Attachment;

                  if (isCloudProject) {
                    // Upload vers Cloudinary pour les projets cloud
                    const uploadedFile = await cloudinaryService.uploadFile(file, {
                      taskId: editedTask.id,
                      projectId: editedTask.projectId,
                      uploadedBy: state.cloudUser?.displayName || 'Utilisateur'
                    });

                    attachment = {
                      id: uploadedFile.publicId || (file.name + '-' + Date.now()),
                      name: uploadedFile.name,
                      type: cloudinaryService.categorizeFile(uploadedFile.type, uploadedFile.name),
                      url: uploadedFile.url,
                      size: uploadedFile.size,
                      uploadedAt: uploadedFile.uploadedAt,
                      uploadedBy: uploadedFile.uploadedBy
                    };
                  } else {
                    // Stockage local (Base64) pour les projets locaux
                    const validation = localAttachmentService.validateFile(file);
                    if (!validation.isValid) {
                      alert(validation.error);
                      continue;
                    }
                    const base64Url = await localAttachmentService.convertFileToBase64(file);
                    attachment = localAttachmentService.createLocalAttachment(file, base64Url);
                  }

                  setEditedTask(prev => ({
                    ...prev,
                    attachments: [...(prev.attachments || []), attachment]
                  }));
                } catch (error) {
                  console.error("Erreur lors de l'ajout d'une pièce jointe:", error);
                  const message = error instanceof Error ? error.message : 'Erreur inconnue';
                  alert(`Erreur lors de l'ajout du fichier ${file.name} : ${message}`);
                }
              }
            }}

            onAddLink={(url, name) => {
              let type: 'video' | 'link' | 'image' | 'audio' | 'document' | 'other' = 'link';
              let attachmentName = name || url;

              // Détection simple du type
              if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
                type = 'video';
                attachmentName = name || 'Vidéo YouTube';
              } else if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                type = 'image';
                attachmentName = name || 'Image Externe';
              } else if (url.match(/\.(mp3|wav|ogg)$/i)) {
                type = 'audio';
                attachmentName = name || 'Audio Externe';
              }

              const attachment: Attachment = {
                id: `link-${Date.now()}`,
                name: attachmentName,
                type: type,
                url: url,
                size: 0,
                uploadedAt: new Date().toISOString(),
                uploadedBy: state.cloudUser?.displayName || 'Utilisateur'
              };

              setEditedTask(prev => ({
                ...prev,
                attachments: [...(prev.attachments || []), attachment]
              }));
            }}
            onInsertToDescription={(url, name, type) => {
              let markdownToInsert = '';

              if (type === 'image') {
                markdownToInsert = `\n![${name}](${url})\n`;
              } else if (type === 'video') {
                // Pour les vidéos, on insère un lien qui sera transformé par notre renderer custom
                // Si c'est un fichier vidéo direct
                if (url.match(/\.(mp4|mov|webm)$/i)) {
                  markdownToInsert = `\n[🎥 Vidéo: ${name}](${url})\n`;
                } else {
                  // YouTube ou autre
                  markdownToInsert = `\n[📺 Vidéo: ${name}](${url})\n`;
                }
              } else if (type === 'audio') {
                markdownToInsert = `\n[🎵 Audio: ${name}](${url})\n`;
              } else {
                markdownToInsert = `\n[📎 ${name}](${url})\n`;
              }

              setEditedTask(prev => ({
                ...prev,
                description: (prev.description || '') + markdownToInsert
              }));
            }}
            onRemoveAttachment={(attachmentId) => {
              const attachment = editedTask.attachments?.find(a => a.id === attachmentId);
              const isCloudProject = project.source === 'firebase';

              if (isCloudProject && attachment && !attachment.url.startsWith('data:')) {
                // Log vers la corbeille Firestore pour suivi
                cloudinaryService.logToTrash(
                  attachment.url,
                  attachment.id, // Le publicId est stocké dans id
                  attachment.type,
                  "removed_from_task"
                );
              }

              setEditedTask(prev => ({
                ...prev,
                attachments: prev.attachments?.filter(a => a.id !== attachmentId) || []
              }));
            }}
          />

          {/* Priorité et Statut sur la même ligne */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priorité */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Priorité</label>
              {isEditing ? (
                <select
                  value={editedTask.priority}
                  onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition duration-200"
                >
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                </select>
              ) : (
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${editedTask.priority === 'high' ? 'bg-orange-500' :
                    editedTask.priority === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                  {editedTask.priority === 'high' ? 'Haute' :
                    editedTask.priority === 'medium' ? 'Moyenne' : 'Faible'}
                </div>
              )}
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Statut</label>
              {isEditing ? (
                <select
                  value={editedTask.status}
                  onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition duration-200"
                >
                  <option value="todo">À faire</option>
                  <option value="in-progress">En cours</option>
                  <option value="done">Terminé</option>
                  <option value="blocked">Bloqué</option>
                </select>
              ) : (
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${editedTask.status === 'done' ? 'bg-green-500' :
                    editedTask.status === 'in-progress' ? 'bg-blue-500' :
                      editedTask.status === 'blocked' ? 'bg-red-500' :
                        'bg-gray-500'
                    }`} />
                  {editedTask.status === 'todo' ? 'À faire' :
                    editedTask.status === 'in-progress' ? 'En cours' :
                      editedTask.status === 'done' ? 'Terminé' : 'Bloqué'}
                </div>
              )}
            </div>
          </div>

          {/* Sous-tâches */}
          <div>
            <label className="block text-sm font-medium mb-1 text-black dark:text-white">Sous-tâches</label>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <SubTasksList
                subTasks={editedTask.subTasks || []}
                onSubTasksChange={handleSubTasksChange}
                project={project}
                task={editedTask}
                isEditing={isEditing}
                canEdit={canEdit}
              />
            </div>
          </div>

          {/* Dates et estimation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date de début */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Date de début</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedTask.startDate ? editedTask.startDate.split('T')[0] : ''}
                    onChange={(e) => setEditedTask({ ...editedTask, startDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition duration-200"
                  />
                ) : (
                  <div className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {editedTask.startDate ? new Date(editedTask.startDate).toLocaleDateString() : '-'}
                  </div>
                )}
              </div>
            </div>

            {/* Date d'échéance */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Date d'échéance</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedTask.dueDate ? editedTask.dueDate.split('T')[0] : ''}
                    min={editedTask.startDate || undefined}
                    onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition duration-200"
                  />
                ) : (
                  <div className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {editedTask.dueDate ? new Date(editedTask.dueDate).toLocaleDateString() : '-'}
                  </div>
                )}
              </div>
            </div>

            {/* Heures estimées - seulement si la tâche est sur une seule journée */}
            {isEditing ? (
              editedTask.startDate === editedTask.dueDate && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Heures estimées</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={editedTask.estimatedHours || ''}
                      onChange={(e) => setEditedTask({ ...editedTask, estimatedHours: parseInt(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition duration-200"
                      placeholder="0"
                    />
                  </div>
                </div>
              )
            ) : (
              editedTask.startDate === editedTask.dueDate && (editedTask.estimatedHours || 0) > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Heures estimées</label>
                  <div className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {editedTask.estimatedHours || 0} h
                  </div>
                </div>
              )
            )}
          </div>

          {/* Assignés */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1">Assigné à</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Afficher tous les utilisateurs assignés */}
              {assignableUsers
                .filter(user => editedTask.assignees.includes(user.id))
                .map(user => (
                  <div
                    key={user.id}
                    className="flex items-center rounded-full px-3 py-1.5 text-sm font-medium cursor-pointer bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/70 transition-colors duration-200"
                    onClick={(e) => handleRemoveAssignee(e, user.id)}
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-xs font-medium text-blue-800 dark:text-blue-200 mr-2 shrink-0 overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="whitespace-nowrap">{user.name || user.email}</span>
                    <XIcon className="w-3.5 h-3.5 ml-1.5 opacity-70 hover:opacity-100" />
                  </div>
                ))}

              {/* Menu déroulant pour ajouter un assigné */}
              {isEditing && canEdit && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAddingAssignee(!isAddingAssignee);
                    }}
                    className="flex items-center px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Ajouter un membre
                  </button>

                  {isAddingAssignee && (
                    <div
                      className="absolute z-10 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Rechercher un membre..."
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={assigneeSearch}
                            onChange={(e) => setAssigneeSearch(e.target.value)}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {assignableUsers
                          .filter(user =>
                            !editedTask.assignees.includes(user.id) &&
                            (assigneeSearch === '' ||
                              user.name?.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
                              user.email?.toLowerCase().includes(assigneeSearch.toLowerCase()))
                          )
                          .map(user => (
                            <div
                              key={user.id}
                              onClick={(e) => handleAddAssignee(e, user.id)}
                              className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-sm font-medium text-blue-800 dark:text-blue-200 mr-3 overflow-hidden">
                                {user.avatar ? (
                                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                  user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{user.name || 'Utilisateur sans nom'}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                              </div>
                            </div>
                          ))}
                        {assignableUsers.filter(user =>
                          !editedTask.assignees.includes(user.id) &&
                          (assigneeSearch === '' ||
                            user.name?.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
                            user.email?.toLowerCase().includes(assigneeSearch.toLowerCase()))
                        ).length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                              Aucun membre trouvé
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex flex-wrap gap-2">
              {isAddingTag ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag(e)}
                    className="flex-1 px-3 py-1.5 rounded-l-full border border-r-0 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                    placeholder="Nouveau tag"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleAddTag(e)}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-r-full hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTag(false);
                      setNewTag('');
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : !isAddingTag && canEdit && (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className="flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un tag
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {editedTask.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors duration-200"
                    aria-label={`Supprimer le tag ${tag}`}
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <TaskComments
            taskId={editedTask.id}
            projectId={editedTask.projectId}
            project={project}
            canComment={canEdit}
          />

          {/* Pied de page fixe */}
          <div className="sticky bottom-0 left-0 right-0 border rounded-lg border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-800 p-4 shadow-lg">
            <div className="flex justify-between space-x-3 max-w-4xl mx-auto w-full">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-700 transition-colors duration-200"
              >
                {isEditing ? 'Annuler' : 'Fermer'}
              </button>
              {isEditing && (
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
                >
                  Enregistrer les modifications
                </button>
              )}
            </div>
          </div>
        </form>
      </div >
    </div >
  );
}
