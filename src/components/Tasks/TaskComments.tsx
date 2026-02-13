import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Heart, ThumbsUp, Laugh, MessageCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Comment, User, Project, CommentReaction } from '../../types';
import { commentService } from '../../services/collaboration/commentService';
import { notificationService } from '../../services/collaboration/notificationService';
import { activityService } from '../../services/collaboration/activityService';
import { useApp } from '../../context/AppContext';

// Composant pour afficher le contenu avec les mentions colorées
const CommentContent: React.FC<{ content: string; isReply?: boolean }> = ({ content, isReply = false }) => {
  const { state } = useApp();
  const accentColor = state.appSettings?.accentColor || '#3B82F6'; // Bleu par défaut

  // Fonction pour colorer les mentions
  const colorizeMentions = (text: string) => {
    // Regex améliorée pour capturer les mentions @nom ou @nom complet
    const mentionRegex = /@([a-zA-Z0-9À-ÿ][a-zA-Z0-9À-ÿ\s\-_']*[a-zA-Z0-9À-ÿ])/g;

    const elements: JSX.Element[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Ajouter le texte avant la mention
      if (match.index > lastIndex) {
        elements.push(
          <span key={lastIndex}>{text.substring(lastIndex, match.index)}</span>
        );
      }

      // Ajouter le @ en texte normal et le nom coloré
      elements.push(
        <span key={match.index} style={{ color: 'inherit' }}>@</span>
      );

      elements.push(
        <span
          key={`${match.index}-name`}
          style={{
            backgroundColor: accentColor + '20', // 20% d'opacité
            color: accentColor,
            padding: '2px 6px',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            display: 'inline-block',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          className="mention-highlight hover:opacity-80"
          title={`Mention: ${match[1]}`}
        >
          {match[1]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Ajouter le reste du texte après la dernière mention
    if (lastIndex < text.length) {
      elements.push(
        <span key={lastIndex}>{text.substring(lastIndex)}</span>
      );
    }

    return <>{elements}</>;
  };

  return (
    <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isReply
      ? 'text-gray-600 dark:text-gray-400 italic border-l-2 border-blue-200 dark:border-blue-800 pl-3 bg-blue-50/30 dark:bg-blue-900/20 rounded-r-lg'
      : 'text-gray-700 dark:text-gray-300'
      }`}>
      {colorizeMentions(content)}
    </p>
  );
};

// Composant pour les réactions avec emojis
const CommentReactions: React.FC<{
  commentId: string,
  reactions: CommentReaction[],
  onReactionAdd: (emoji: string) => void,
  onReactionRemove: (reactionId: string) => void
}> = ({ commentId, reactions, onReactionAdd, onReactionRemove }) => {
  const { state } = useApp();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const accentColor = state.appSettings?.accentColor || '#3B82F6';

  // Emojis populaires
  const popularEmojis = ['👍', '❤️', '😂', '🎉', '😮', '😢', '👏', '🔥', '💯', '🤔'];

  // Grouper les réactions par emoji
  const reactionsByEmoji = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, CommentReaction[]>);

  // Vérifier si l'utilisateur actuel a déjà réagi
  const currentUserReaction = reactions.find(r => r.userId === state.cloudUser?.uid);

  const handleReactionClick = (emoji: string) => {
    const existingReaction = reactions.find(r => r.userId === state.cloudUser?.uid && r.emoji === emoji);

    if (existingReaction) {
      // Retirer la réaction
      onReactionRemove(existingReaction.id);
    } else {
      // Ajouter la réaction
      onReactionAdd(emoji);
    }
    setShowEmojiPicker(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1 mt-2">
        {Object.entries(reactionsByEmoji).map(([emoji, emojiReactions]) => {
          const hasCurrentUserReaction = emojiReactions.some(r => r.userId === state.cloudUser?.uid);

          return (
            <button
              key={emoji}
              onClick={() => handleReactionClick(emoji)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${hasCurrentUserReaction
                ? 'text-white border-2'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-transparent'
                }`}
              style={hasCurrentUserReaction ? {
                borderColor: accentColor,
                backgroundColor: accentColor
              } : {}}
              title={`${emojiReactions.map(r => r.userId).join(', ')} ${emoji}`}
            >
              <span className="text-sm">{emoji}</span>
              <span className="text-xs">{emojiReactions.length}</span>
            </button>
          );
        })}

        {/* Bouton pour ajouter une réaction */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-transparent transition-all duration-200 text-xs"
          title="Ajouter une réaction"
        >
          <span>+</span>
        </button>
      </div>

      {/* Sélecteur d'emojis */}
      {showEmojiPicker && (
        <div className="absolute z-[100] bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="grid grid-cols-5 gap-2">
            {popularEmojis.map((emoji) => {
              const hasReaction = reactions.some(r => r.userId === state.cloudUser?.uid && r.emoji === emoji);

              return (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${hasReaction ? 'ring-2 ring-blue-500' : ''
                    }`}
                  title={emoji}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Composant pour les réponses aux commentaires
const CommentReply: React.FC<{
  comment: Comment,
  onReply: (content: string, parentId: string) => void
}> = ({ comment, onReply }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const { state } = useApp();
  const accentColor = state.appSettings?.accentColor || '#3B82F6';

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(replyContent, comment.id);
      setReplyContent('');
      setIsReplying(false);
    }
  };

  return (
    <div className="">
      {!isReplying ? (
        <button
          onClick={() => setIsReplying(true)}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors py-1 px-2 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg group"
          style={{ color: accentColor }}
        >
          <MessageCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          Répondre
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={`Répondre à ${comment.authorName}...`}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none focus:ring-2 focus:border-transparent"
            style={{ '--focus-ring-color': accentColor } as React.CSSProperties}
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsReplying(false);
                setReplyContent('');
              }}
              className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleReply}
              className="px-3 py-1 text-xs text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 4px 6px -1px ${accentColor}20`
              }}
            >
              Répondre
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
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

  const handleReactionAdd = async (commentId: string, emoji: string) => {
    if (!state.cloudUser) return;

    try {
      const reaction: CommentReaction = {
        id: Date.now().toString(),
        commentId,
        userId: state.cloudUser.uid,
        emoji,
        createdAt: new Date().toISOString()
      };

      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      const updatedReactions = [...(comment.reactions || []), reaction];

      // Mettre à jour localement pour une réactivité immédiate
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, reactions: updatedReactions } : c
      ));

      // Persister dans Firestore
      await commentService.updateCommentReactions(commentId, updatedReactions);

      // Envoyer une notification à l'auteur du commentaire (si ce n'est pas soi-même)
      if (comment.authorId !== state.cloudUser.uid) {
        await notificationService.sendNotification({
          userId: comment.authorId,
          title: 'Nouvelle réaction',
          message: `${state.cloudUser.displayName || 'Un utilisateur'} a réagi à votre commentaire avec ${emoji}`,
          type: 'reaction_added',
          link: `/projects/${projectId}/tasks/${taskId}`
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réaction:', error);
    }
  };

  const handleReactionRemove = async (commentId: string, reactionId: string) => {
    if (!state.cloudUser) return;

    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      const updatedReactions = (comment.reactions || []).filter(r => r.id !== reactionId);

      // Mettre à jour localement
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, reactions: updatedReactions } : c
      ));

      // Persister dans Firestore
      await commentService.updateCommentReactions(commentId, updatedReactions);
    } catch (error) {
      // Fail silently for production
    }
  };

  const handleReply = async (content: string, parentId: string) => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const currentUser = state.cloudUser || { uid: 'local-user', displayName: 'Utilisateur local' };

      const commentData: any = {
        taskId,
        projectId,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonyme',
        authorAvatar: (currentUser as any).photoURL || '',
        content: content.trim(),
        mentions: [],
        parentId,
        reactions: []
      };

      const commentId = await commentService.addComment(commentData);

      if (commentId) {
        // Mettre à jour localement (même si la subscription va le faire, ça assure une transition fluide)
        const finalComment = { ...commentData, id: commentId, createdAt: new Date().toISOString() };
        setComments(prev => [...prev, finalComment]);

        // Envoyer une notification à l'auteur du commentaire parent
        const parentComment = comments.find(c => c.id === parentId);
        if (parentComment && parentComment.authorId !== currentUser.uid) {
          await notificationService.sendNotification({
            userId: parentComment.authorId,
            title: 'Nouvelle réponse',
            message: `${currentUser.displayName || 'Un utilisateur'} a répondu à votre commentaire: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
            type: 'reply_added',
            link: `/projects/${projectId}/tasks/${taskId}`
          });
        }

        // Envoyer une activité
        await activityService.logActivity({
          projectId,
          type: 'reply_added', // Utiliser le bon type d'activité
          actorId: currentUser.uid,
          actorName: currentUser.displayName || 'Anonyme',
          targetId: taskId,
          targetName: project.tasks.find(t => t.id === taskId)?.title || 'Tâche',
          details: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        });
      }
    } catch (error) {
      // Fail silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const currentUser = state.cloudUser || { uid: 'local-user', displayName: 'Utilisateur local' };

      const commentData: any = {
        taskId,
        projectId,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonyme',
        authorAvatar: (currentUser as any).photoURL || '',
        content: newComment,
        mentions: [],
        reactions: []
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
        const mentionRegex = /@([^\s@]+(?:\s+[^\s@]+)*?)(?=\s|$)/g;
        const mentions = newComment.match(mentionRegex) || [];

        if (mentions.length > 0) {
          const usersToCheck = projectMembers.length > 0 ? projectMembers : state.users;

          for (const user of usersToCheck) {
            if (!user || user.id === currentUser.uid) continue;

            const isMentioned = mentions.some(mention => {
              const mentionText = mention.substring(1).trim().toLowerCase();
              const userName = (user.name || '').toLowerCase();
              const userEmail = (user.email || '').toLowerCase();

              return userName === mentionText ||
                userName.replace(/\s+/g, '') === mentionText.replace(/\s+/g, '') ||
                userEmail.split('@')[0] === mentionText ||
                userName.split(' ')[0] === mentionText;
            });

            if (isMentioned) {
              try {
                await notificationService.sendNotification({
                  userId: user.id,
                  title: 'Vous avez été mentionné',
                  message: `${currentUser.displayName || 'Un utilisateur'} vous a mentionné: "${newComment.substring(0, 50)}..."`,
                  type: 'mention',
                  link: `/projects/${projectId}/tasks/${taskId}`
                });
              } catch (error) {
                console.error(`Erreur notification mention pour ${user.name}:`, error);
              }
            }
          }
        }
      }
      setNewComment('');
    } catch (error) {
      // Fail silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm('Supprimer ce commentaire ?')) {
      try {
        await commentService.deleteComment(commentId);
      } catch (error) {
        // Fail silently in production
      }
    }
  };

  const toggleExpand = (commentId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  return (
    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
      <h3 className="text-lg font-semibold z-10 text-gray-900 dark:text-white mb-4">
        Commentaires ({comments.length})
      </h3>

      {/* Liste des commentaires */}
      <div className="space-y-6 mb-6 max-h-[550px] pr-2 custom-scrollbar pb-32">
        {comments
          .filter(c => !c.parentId) // Top-level comments
          .map((parentComment) => (
            <div key={parentComment.id} className="space-y-3">
              <div className="flex gap-3 group">
                <div className="flex-shrink-0">
                  {parentComment.authorAvatar ? (
                    <img src={parentComment.authorAvatar} alt={parentComment.authorName} className="w-9 h-9 rounded-full border-2 border-white dark:border-gray-700 shadow-sm" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border-2 border-white dark:border-gray-700 shadow-sm">
                      <UserIcon className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">{parentComment.authorName}</span>
                      <span className="text-[10px] text-gray-400">{new Date(parentComment.createdAt).toLocaleString()}</span>
                    </div>
                    <CommentContent content={parentComment.content} />

                    {/* Réactions au commentaire */}
                    {(parentComment.reactions && parentComment.reactions.length > 0) || true ? (
                      <CommentReactions
                        commentId={parentComment.id}
                        reactions={parentComment.reactions || []}
                        onReactionAdd={(emoji) => handleReactionAdd(parentComment.id, emoji)}
                        onReactionRemove={(reactionId) => handleReactionRemove(parentComment.id, reactionId)}
                      />
                    ) : null}
                  </div>

                  <div className="flex items-center gap-4 ml-2 mt-2">
                    {/* Réponse au commentaire */}
                    <CommentReply
                      comment={parentComment}
                      onReply={(content, parentId) => handleReply(content, parentId)}
                    />

                    {/* Bouton de suppression - Plus visible */}
                    {(state.cloudUser?.uid === parentComment.authorId || !state.cloudUser) && (
                      <button
                        onClick={() => handleDelete(parentComment.id)}
                        className="text-[11px] text-red-500 hover:text-red-700 font-medium transition-colors flex items-center gap-1.5 py-1 px-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Supprimer
                      </button>
                    )}

                    {/* Toggle pour les réponses */}
                    {comments.filter(reply => reply.parentId === parentComment.id).length > 0 && (
                      <button
                        onClick={() => toggleExpand(parentComment.id)}
                        className="text-[11px] text-gray-500 hover:text-blue-600 font-medium transition-colors flex items-center gap-1.5 py-1 px-2 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg ml-auto"
                      >
                        {expandedComments[parentComment.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {comments.filter(reply => reply.parentId === parentComment.id).length} réponse(s)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Réponses (1 seul niveau) */}
              {expandedComments[parentComment.id] && (
                <div className="ml-12 space-y-3 mt-2 border-l-2 border-gray-100 dark:border-gray-800 pl-4 animate-in slide-in-from-top-2 duration-200">
                  {comments
                    .filter(reply => reply.parentId === parentComment.id)
                    .map(reply => (
                      <div key={reply.id} className="flex gap-3 group">
                        <div className="flex-shrink-0">
                          {reply.authorAvatar ? (
                            <img src={reply.authorAvatar} alt={reply.authorName} className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center text-gray-500 dark:text-gray-400">
                              <UserIcon className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-gray-50/80 dark:bg-gray-800/30 p-3 rounded-xl rounded-tl-none border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold text-xs text-gray-900 dark:text-white">{reply.authorName}</span>
                              <span className="text-[9px] text-gray-400">{new Date(reply.createdAt).toLocaleString()}</span>
                            </div>
                            <CommentContent content={reply.content} isReply />

                            {/* Réactions aux réponses */}
                            {reply.reactions && reply.reactions.length > 0 && (
                              <CommentReactions
                                commentId={reply.id}
                                reactions={reply.reactions}
                                onReactionAdd={(emoji) => handleReactionAdd(reply.id, emoji)}
                                onReactionRemove={(reactionId) => handleReactionRemove(reply.id, reactionId)}
                              />
                            )}
                          </div>

                          {/* Bouton de suppression pour réponse */}
                          {(state.cloudUser?.uid === reply.authorId || !state.cloudUser) && (
                            <button
                              onClick={() => handleDelete(reply.id)}
                              className="mt-1 text-[10px] text-red-500 hover:text-red-600 font-medium transition-colors ml-2 flex items-center gap-1"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
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
              <div className="relative">
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
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:border-transparent text-sm min-h-[80px] resize-none transition-all duration-200"
                  style={{
                    '--focus-ring-color': state.appSettings?.accentColor || '#3B82F6'
                  } as React.CSSProperties}
                />

                {/* Indicateur visuel pour les mentions */}
                {newComment.includes('@') && (
                  <div className="absolute top-2 right-2 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: state.appSettings?.accentColor || '#3B82F6' }}></span>
                    <span>Mentions activées</span>
                  </div>
                )}
              </div>

              {/* Dropdown mentions */}
              {showMentions && (
                <div className="absolute bottom-full left-0 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 mb-2 overflow-hidden">
                  <div
                    className="p-3 border-b border-gray-100 dark:border-gray-700 text-xs font-medium text-gray-500 flex items-center gap-2"
                    style={{
                      backgroundColor: (state.appSettings?.accentColor || '#3B82F6') + '10',
                      color: state.appSettings?.accentColor || '#3B82F6'
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    Mentionner un membre du projet
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {projectMembers
                      .filter(u => u.name?.toLowerCase().includes(mentionSearch.toLowerCase()) || u.email?.toLowerCase().includes(mentionSearch.toLowerCase()))
                      .map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => insertMention(user)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm transition-colors duration-150 group"
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                            style={{ backgroundColor: state.appSettings?.accentColor || '#3B82F6' }}
                          >
                            {user.name?.[0] || user.email[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="truncate font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {user.name || user.email}
                            </span>
                            {user.name && user.email && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 truncate block">
                                {user.email}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    {projectMembers.filter(u => u.name?.toLowerCase().includes(mentionSearch.toLowerCase()) || u.email?.toLowerCase().includes(mentionSearch.toLowerCase())).length === 0 && (
                      <div className="p-4 text-center text-xs text-gray-500 italic">
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
              className="self-end p-3 text-white rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: state.appSettings?.accentColor || '#3B82F6',
                boxShadow: `0 10px 15px -3px ${(state.appSettings?.accentColor || '#3B82F6')}20`
              }}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
