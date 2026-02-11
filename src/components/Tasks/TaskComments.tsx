import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon } from 'lucide-react';
import { Comment, User, Project } from '../../types';
import { commentService } from '../../services/collaboration/commentService';
import { notificationService } from '../../services/collaboration/notificationService';
import { activityService } from '../../services/collaboration/activityService';
import { useApp } from '../../context/AppContext';

interface TaskCommentsProps {
  taskId: string;
  projectId: string;
  project: Project;
}

export function TaskComments({ taskId, projectId, project }: TaskCommentsProps) {
  const { state } = useApp();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const unsubscribe = commentService.subscribeToTaskComments(taskId, (fetchedComments) => {
      setComments(fetchedComments);
    });

    const loadProjectMembers = async () => {
      if (project.source === 'firebase' && project.members && project.members.length > 0) {
        try {
          const { firebaseService } = await import('../../services/collaboration/firebaseService');
          const membersData: User[] = [];
          for (const uid of project.members) {
            const profile = await firebaseService.getUserProfile(uid);
            if (profile) {
              membersData.push({
                id: profile.uid,
                name: profile.displayName || 'Utilisateur',
                email: profile.email || '',
                avatar: profile.photoURL || '',
                role: 'member',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          }
          setProjectMembers(membersData);
        } catch (e) {
          console.error("Erreur chargement membres pour mentions:", e);
        }
      } else {
        setProjectMembers(state.users);
      }
    };

    loadProjectMembers();

    return () => unsubscribe();
  }, [taskId, project, state.users]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const pos = e.target.selectionStart;
    setNewComment(value);
    setCursorPos(pos);

    // Détection simple de @ pour les mentions
    const lastAtIdx = value.lastIndexOf('@', pos - 1);
    if (lastAtIdx !== -1 && (lastAtIdx === 0 || value[lastAtIdx - 1] === ' ' || value[lastAtIdx - 1] === '\n')) {
      const search = value.substring(lastAtIdx + 1, pos);
      if (!search.includes(' ')) {
        setMentionSearch(search);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (user: User) => {
    const lastAtIdx = newComment.lastIndexOf('@', cursorPos - 1);
    const before = newComment.substring(0, lastAtIdx);
    const after = newComment.substring(cursorPos);
    const mentionText = `@${user.name || user.email} `;
    setNewComment(before + mentionText + after);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const currentUser = state.cloudUser || { uid: 'local-user', displayName: 'Utilisateur local' };

    // Notifier les membres du projet.

    const commentData = {
      taskId,
      projectId,
      authorId: currentUser.uid,
      authorName: currentUser.displayName || 'Anonyme',
      authorAvatar: (currentUser as any).photoURL || '',
      content: newComment,
      mentions: [], // On pourrait remplir ceci si on avait un système d'ID robuste
    };

    const commentId = await commentService.addComment(commentData);

    if (commentId) {
      // Logger l'activité
      await activityService.logActivity({
        projectId,
        type: 'comment_added',
        actorId: currentUser.uid,
        actorName: currentUser.displayName || 'Anonyme',
        targetId: taskId,
        targetName: project.tasks.find(t => t.id === taskId)?.title || 'Tâche',
        details: newComment.substring(0, 50) + (newComment.length > 50 ? '...' : '')
      });

      // Envoyer des notifications aux mentions (simulé)
      // Pour chaque membre du projet mentionné via @Nom
      project.members?.forEach(async (memberId) => {
        if (memberId === currentUser.uid) return;

        // On récupère le profil simplifié pour comparer le nom (ou on utilise state.users si local)
        // Pour faire simple, on notifie tout le monde sauf l'auteur si pas de système d'ID mention
        await notificationService.sendNotification({
          userId: memberId,
          title: `Nouveau commentaire sur ${project.name}`,
          message: `${currentUser.displayName || 'Anonyme'} a commenté : "${newComment.substring(0, 30)}..."`,
          type: 'mention', // On pourrait filtrer si vraiment mentionné
          link: `/projects/${projectId}?task=${taskId}`
        });
      });

      setNewComment('');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm('Supprimer ce commentaire ?')) {
      await commentService.deleteComment(commentId);
    }
  };

  return (
    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Commentaires ({comments.length})
      </h3>

      {/* Liste des commentaires */}
      <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 group">
            <div className="flex-shrink-0">
              {comment.authorAvatar ? (
                <img src={comment.authorAvatar} alt={comment.authorName} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{comment.authorName}</span>
                  <span className="text-[10px] text-gray-400">{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
              </div>
              {(state.cloudUser?.uid === comment.authorId || !state.cloudUser) && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="mt-1 text-[10px] text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-4 italic">Aucun commentaire pour le moment.</p>
        )}
      </div>

      {/* Zone d'ajout de commentaire */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleInputChange}
              placeholder="Ajouter un commentaire... (utilisez @ pour mentionner)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[80px] resize-none"
            />

            {/* Dropdown mentions */}
            {showMentions && (
              <div className="absolute bottom-full left-0 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 mb-2 overflow-hidden">
                <div className="p-2 border-b border-gray-100 dark:border-gray-700 text-xs font-medium text-gray-500">
                  Mentionner un membre du projet
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {projectMembers
                    .filter(u => u.name?.toLowerCase().includes(mentionSearch.toLowerCase()) || u.email?.toLowerCase().includes(mentionSearch.toLowerCase()))
                    .map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => insertMention(user)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm"
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs text-blue-600">
                          {user.name?.[0] || user.email[0]}
                        </div>
                        <span className="truncate">{user.name || user.email}</span>
                      </button>
                    ))}
                  {projectMembers.filter(u => u.name?.toLowerCase().includes(mentionSearch.toLowerCase()) || u.email?.toLowerCase().includes(mentionSearch.toLowerCase())).length === 0 && (
                    <div className="p-3 text-center text-xs text-gray-500 italic">
                      Aucun membre du projet trouvé
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            type="submit"
            onClick={(e) => handleSubmit(e as any)}
            disabled={!newComment.trim() || isSubmitting}
            className="self-end p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow-lg shadow-blue-500/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
