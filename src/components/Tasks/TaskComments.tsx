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
  canComment?: boolean;
}

export function TaskComments({ taskId, projectId, project, canComment = true }: TaskCommentsProps) {
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

      // Envoyer des notifications aux mentions
      // Extraire les mentions du commentaire avec une regex plus robuste
      // Capture @ suivi de n'importe quels caractères sauf espaces et ponctuation de fin
      const mentionRegex = /@([^\s@]+(?:\s+[^\s@]+)*?)(?=\s|$)/g;
      const mentions = newComment.match(mentionRegex) || [];

      if (mentions.length > 0) {
        console.log('Mentions détectées:', mentions);
        
        // Déterminer la liste des utilisateurs à vérifier
        const usersToCheck = project.source === 'firebase' && project.members && project.members.length > 0
          ? project.members.map(memberId => state.users.find(u => u.id === memberId)).filter(Boolean)
          : state.users;

        console.log('Utilisateurs à vérifier:', usersToCheck.map(u => ({ id: u?.id, name: u?.name, email: u?.email })));

        // Pour chaque utilisateur potentiellement mentionné
        for (const user of usersToCheck) {
          if (!user || user.id === currentUser.uid) continue;

          // Vérifier si cet utilisateur est mentionné
          const isMentioned = mentions.some(mention => {
            const mentionText = mention.substring(1).trim().toLowerCase(); // Enlever @ et trim
            const userName = (user.name || '').toLowerCase();
            const userEmail = (user.email || '').toLowerCase();
            
            // Correspondance exacte avec le nom
            if (userName === mentionText) return true;
            
            // Correspondance avec le nom sans espaces (pour les noms composés)
            const userNameNoSpaces = userName.replace(/\s+/g, '').toLowerCase();
            const mentionNoSpaces = mentionText.replace(/\s+/g, '').toLowerCase();
            if (userNameNoSpaces === mentionNoSpaces) return true;
            
            // Correspondance avec l'email (partie avant @)
            const emailLocal = userEmail.split('@')[0];
            if (emailLocal === mentionText) return true;
            
            // Correspondance partielle (premier mot du nom)
            const firstName = userName.split(' ')[0];
            if (firstName === mentionText) return true;
            
            return false;
          });

          console.log(`Utilisateur ${user.name} (${user.email}) mentionné:`, isMentioned);

          if (isMentioned) {
            try {
              // Envoyer la notification à l'utilisateur mentionné
              await notificationService.sendNotification({
                userId: user.id,
                title: 'Vous avez été mentionné',
                message: `${currentUser.displayName || 'Un utilisateur'} vous a mentionné dans un commentaire: "${newComment.substring(0, 50)}${newComment.length > 50 ? '...' : ''}"`,
                type: 'mention',
                link: `/projects/${project.id}/tasks/${taskId}`
              });
              console.log(`Notification envoyée à ${user.name}`);
            } catch (error) {
              console.error(`Erreur lors de l'envoi de la notification à ${user.name}:`, error);
            }
          }
        }
      }

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
      {canComment && (
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
      )}
    </div>
  );
}
