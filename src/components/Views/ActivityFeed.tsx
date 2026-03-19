import { useState, useEffect, useRef } from 'react';

// Emojis pour le picker de la zone de saisie
const INPUT_EMOJIS = [
  '😀','😂','😍','🥰','😎','🤔','😅','😭','😡','🥳',
  '👍','👎','❤️','🔥','✅','⚠️','🎉','💯','🙏','👀',
  '🚀','💡','📌','📎','🗓️','📊','✍️','💬','🔔','⭐'
];
import { Activity as ActivityIcon, CheckCircle2, MessageSquare, X, PlusCircle, UserPlus, Send, Loader2, AtSign, Trash2, Edit2, CheckCircle, Square, Smile, Reply, CornerDownRight } from 'lucide-react';
import { Activity, ActivityType, Project } from '../../types';
import { activityService } from '../../services/collaboration/activityService';
import { notificationService } from '../../services/collaboration/notificationService';
import { firebaseService } from '../../services/collaboration/firebaseService';
import { useApp } from '../../context/AppContext';
import { Button } from '../UI/Button';

interface ActivityFeedProps {
  projectId: string;
  project: Project;
  onClose?: () => void;
}

import { projectReadService } from '../../services/collaboration/projectReadService';

// Emojis disponibles pour les réactions
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

export function ActivityFeed({ projectId, project, onClose }: ActivityFeedProps) {
  const { state } = useApp();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [members, setMembers] = useState<{ uid: string, name: string, email?: string }[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  // Réactions emoji
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null);
  // Répondre à un message
  const [replyingTo, setReplyingTo] = useState<Activity | null>(null);
  // Picker emoji pour la zone de saisie
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Marquer comme lu à l'ouverture et lors de nouveaux messages
  useEffect(() => {
    if (projectId) {
      projectReadService.markAsRead(projectId);
    }
  }, [projectId, activities]);

  // Charger les membres du projet pour les mentions
  useEffect(() => {
    const fetchMembers = async () => {
      if (!project.members) return;
      const memberDetails = await Promise.all(
        project.members.map(async (uid) => {
          const profile = await firebaseService.getUserProfile(uid);
          return { uid, name: profile?.displayName || profile?.email || 'Membre', email: profile?.email || undefined };
        })
      );
      setMembers(memberDetails);
    };
    fetchMembers();
  }, [project.members]);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = activityService.subscribeToProjectActivities(projectId, (fetchedActivities) => {
      setActivities(fetchedActivities);
      setIsLoading(false);
    });

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [projectId]);

  // Auto-scroll vers le bas lors de nouveaux messages
  useEffect(() => {
    if (scrollRef.current) {
      const scroll = () => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      };
      scroll();
      setTimeout(scroll, 100);
      setTimeout(scroll, 300);
    }
  }, [activities, isLoading]);

  // Fermer les pickers emoji en cliquant ailleurs
  useEffect(() => {
    if (!showEmojiPickerFor && !showInputEmojiPicker) return;
    const handler = () => {
      setShowEmojiPickerFor(null);
      setShowInputEmojiPicker(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showEmojiPickerFor, showInputEmojiPicker]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const pos = e.target.selectionStart;
    setMessage(value);
    setCursorPosition(pos);

    const textBeforeCursor = value.slice(0, pos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtSymbol + 1);
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt.toLowerCase());
        setShowMentionSuggestions(true);
        return;
      }
    }
    setShowMentionSuggestions(false);
  };

  const insertMention = (memberName: string) => {
    const textBeforeAt = message.slice(0, message.lastIndexOf('@', cursorPosition - 1));
    const textAfterMention = message.slice(cursorPosition);
    const newMessage = `${textBeforeAt}@${memberName} ${textAfterMention}`;
    setMessage(newMessage);
    setShowMentionSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !state.cloudUser) return;

    // ✅ Vider IMMÉDIATEMENT le champ avant tout traitement async
    const messageToSend = message.trim();
    const replyContext = replyingTo;
    setMessage('');
    setReplyingTo(null);
    setIsSending(true);

    try {
      const mentionRegex = /@([a-zA-Z0-9À-ÿ]+(?:[\s\-_'][a-zA-Z0-9À-ÿ]+)*)/g;
      const foundMentions = messageToSend.match(mentionRegex) || [];
      const mentionsToNotify: any[] = [];

      if (foundMentions.length > 0) {
        const usersToCheck = members.length > 0 ? members : (state.users || []).map(u => ({ uid: u.id, name: u.name, email: u.email }));
        for (const user of usersToCheck) {
          if (!user || user.uid === state.cloudUser.uid) continue;
          const isMentioned = foundMentions.some(mention => {
            const mentionText = mention.substring(1).trim().toLowerCase();
            const userName = (user.name || '').toLowerCase();
            const userEmail = (user.email || '').toLowerCase();
            return userName === mentionText ||
                   userName.replace(/\s+/g, '') === mentionText.replace(/\s+/g, '') ||
                   userName.replace(/[\s\-_']/g, '') === mentionText.replace(/[\s\-_']/g, '') ||
                   userEmail.split('@')[0] === mentionText ||
                   userName.split(' ')[0] === mentionText ||
                   userName.includes(mentionText) ||
                   mentionText.includes(userName.split(' ')[0]);
          });
          if (isMentioned) mentionsToNotify.push(user);
        }
      }

      // Préparer les données de réponse si on répond à un message
      const activityData: any = {
        projectId,
        type: 'project_discussion',
        actorId: state.cloudUser.uid,
        actorName: state.cloudUser.displayName || state.cloudUser.email || 'Anonyme',
        actorAvatar: state.cloudUser.photoURL || undefined,
        details: messageToSend,
      };

      if (replyContext) {
        activityData.replyToId = replyContext.id;
        activityData.replyToName = replyContext.actorName;
        activityData.replyToText = (replyContext.details || '').substring(0, 60) + ((replyContext.details || '').length > 60 ? '…' : '');
      }

      await activityService.logActivity(activityData);

      // Notifications pour les mentions
      for (const mention of mentionsToNotify) {
        try {
          await notificationService.sendNotification({
            userId: mention.uid,
            title: `Mention dans ${project.name}`,
            message: `${state.cloudUser.displayName || 'Quelqu\'un'} vous a mentionné : "${messageToSend.substring(0, 50)}${messageToSend.length > 50 ? '...' : ''}"`,
            type: 'project_mention',
            projectId: projectId,
            projectName: project.name,
            link: `/projects/${projectId}`
          });
        } catch (error) {
          console.error("Erreur d'envoi de notification à", mention.uid, error);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envois du message:', error);
      // Remettre le message en cas d'erreur pour ne pas perdre la saisie
      setMessage(messageToSend);
      if (replyContext) setReplyingTo(replyContext);
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateMessage = async (id: string) => {
    if (!editingText.trim()) return;
    try {
      await activityService.updateActivity(id, editingText);
      setEditingId(null);
    } catch (error) {
      console.error('Erreur MAJ message:', error);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await activityService.deleteActivity(id);
    } catch (error) {
      console.error('Erreur suppression message:', error);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      await activityService.deleteMultipleActivities(selectedIds);
      setSelectedIds([]);
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Erreur suppression multiple:', error);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleToggleReaction = async (activity: Activity, emoji: string) => {
    if (!state.cloudUser || !activity.id) {
      console.error("[Reactions] Données manquantes:", { activityId: activity.id, userId: state.cloudUser?.uid });
      return;
    }
    
    try {
      console.log(`[Reactions] Click emoji ${emoji} sur activity_id: ${activity.id}`);
      await activityService.toggleReaction(activity.id, emoji, state.cloudUser.uid, projectId);
      console.log(`[Reactions] Succès toggle pour ${activity.id}`);
      setShowEmojiPickerFor(null);
    } catch (error: any) {
      console.error('[Reactions] ERREUR lors du toggle:', error);
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'task_completed': return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case 'project_discussion': return <MessageSquare className="w-3.5 h-3.5 text-blue-500" />;
      case 'task_created': return <PlusCircle className="w-3.5 h-3.5 text-purple-500" />;
      case 'member_added': return <UserPlus className="w-3.5 h-3.5 text-orange-500" />;
      default: return <ActivityIcon className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    const actor = <span className="font-semibold">{activity.actorName}</span>;
    const target = <span className="font-medium text-blue-600">{activity.targetName}</span>;
    switch (activity.type) {
      case 'task_completed': return <>{actor} a terminé la tâche {target}</>;
      case 'project_discussion': return <>{actor} a posté une note</>;
      case 'task_created': return <>{actor} a créé la tâche {target}</>;
      case 'member_added': return <>{actor} a ajouté un membre</>;
      case 'project_updated': return <>{actor} a mis à jour le projet</>;
      default: return <>{actor} a effectué une action</>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30 dark:bg-gray-900/10 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-inner">
      {/* Header compact */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-800 transition-colors">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: `${project.color}20`, color: project.color }}
          >
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{project.name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="flex w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Discussion active</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSelectionMode ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                {selectedIds.length} sélectionnés
              </span>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all disabled:opacity-30"
                title="Supprimer la sélection"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedIds([]);
                }}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setIsSelectionMode(true)}
                className="p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
                title="Sélection multiple"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
              <div className="flex -space-x-2">
                {members.slice(0, 3).map((m) => (
                  <div
                    key={m.uid}
                    className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] text-white font-bold shadow-sm"
                    title={m.name}
                  >
                    {m.name[0].toUpperCase()}
                  </div>
                ))}
                {members.length > 3 && (
                  <div className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[9px] font-bold text-gray-500">
                    +{members.length - 3}
                  </div>
                )}
              </div>

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Flux d'activité et messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800"
      >
        {activities.length === 0 ? (
          <div className="py-20 text-center">
            <ActivityIcon className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm italic">Commencez la discussion...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {[...activities].reverse().map((activity) => {
              const isDiscussion = activity.type === 'project_discussion';
              const isMe = activity.actorId === state.cloudUser?.uid;

              if (activity.type === 'reaction') return null;

              if (isDiscussion) {
                const isSelected = selectedIds.includes(activity.id);
                const isEditing = editingId === activity.id;
                
                // Calculer les réactions agrégées à partir du flux d'activités
                const reactions: Record<string, string[]> = {};
                activities.forEach(a => {
                  if (a.type === 'reaction' && a.targetId === activity.id && a.emoji) {
                    if (!reactions[a.emoji]) reactions[a.emoji] = [];
                    if (!reactions[a.emoji].includes(a.actorId)) {
                      reactions[a.emoji].push(a.actorId);
                    }
                  }
                });

                const hasReactions = Object.keys(reactions).length > 0;

                return (
                  <div
                    key={activity.id}
                    className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} ${isSelectionMode ? 'cursor-pointer' : ''}`}
                    onClick={() => isSelectionMode && toggleSelect(activity.id)}
                  >
                    <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {isSelectionMode && (
                        <div className={`mt-2 ${isSelected ? 'text-blue-500' : 'text-gray-300'}`}>
                          {isSelected ? <CheckCircle className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        </div>
                      )}

                      {!isMe && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs shadow-sm mb-1">
                          {activity.actorAvatar ? (
                            <img src={activity.actorAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : activity.actorName[0].toUpperCase()}
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <div className={`flex items-center gap-2 px-1 transition-all duration-200 ${isMe ? 'flex-row-reverse group-hover:translate-x-[-100px]' : 'group-hover:translate-x-[100px]'} opacity-100 group-hover:opacity-0`}>
                          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                            {activity.actorName}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Contexte de réponse */}
                        {activity.replyToId && activity.replyToText && (
                          <div className={`flex items-start gap-1 mb-0.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <CornerDownRight className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className={`text-[10px] text-gray-400 italic truncate max-w-[200px] border-l-2 border-gray-300 dark:border-gray-600 pl-1.5`}>
                              <span className="font-semibold not-italic text-gray-500">{activity.replyToName}: </span>
                              {activity.replyToText}
                            </div>
                          </div>
                        )}

                        <div className={`relative p-3 rounded-2xl text-sm shadow-sm transition-all group-hover:shadow-md ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700'
                        } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>

                          {isEditing ? (
                            <div className="space-y-2 min-w-[200px]">
                              <textarea
                                className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-blue-400 focus:outline-none text-xs"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                autoFocus
                              />
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                                  className="p-1 px-2 text-[10px] bg-white/20 hover:bg-white/30 rounded"
                                >
                                  Annuler
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleUpdateMessage(activity.id); }}
                                  className="p-1 px-2 text-[10px] bg-white text-blue-600 font-bold rounded"
                                >
                                  OK
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap leading-relaxed">{activity.details}</div>
                          )}

                          {/* Actions Hover — barre HORIZONTALE flottante au-dessus de la bulle */}
                          {!isSelectionMode && !isEditing && (
                            <div
                              className={`absolute -top-9 opacity-0 group-hover:opacity-100 transition-all duration-150 flex flex-row items-center gap-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-1.5 py-1 z-10 ${
                                isMe ? 'right-0' : 'left-0'
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Réagir */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowEmojiPickerFor(showEmojiPickerFor === activity.id ? null : activity.id);
                                }}
                                className="p-1 rounded-lg text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                                title="Réagir"
                              >
                                <Smile className="w-3.5 h-3.5" />
                              </button>
                              {/* Répondre */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReplyingTo(activity);
                                  setTimeout(() => inputRef.current?.focus(), 100);
                                }}
                                className="p-1 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                title="Répondre"
                              >
                                <Reply className="w-3.5 h-3.5" />
                              </button>
                              {isMe && (
                                <>
                                  {/* Séparateur */}
                                  <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingId(activity.id);
                                      setEditingText(activity.details || '');
                                    }}
                                    className="p-1 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                    title="Modifier"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteMessage(activity.id);
                                    }}
                                    className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Picker emoji (inline, hors bulle de message) */}
                        {showEmojiPickerFor === activity.id && (
                          <div
                            className={`flex gap-1 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 px-2 py-1.5 mt-1 z-50 animate-in fade-in zoom-in duration-150 ${isMe ? 'self-end' : 'self-start'}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {REACTION_EMOJIS.map(emoji => {
                              const hasReacted = (reactions[emoji] || []).includes(state.cloudUser?.uid || '');
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => handleToggleReaction(activity, emoji)}
                                  className={`text-base hover:scale-125 transition-transform rounded-full p-0.5 ${hasReacted ? 'bg-blue-100 dark:bg-blue-900/40 ring-1 ring-blue-400' : ''}`}
                                  title={emoji}
                                >
                                  {emoji}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Affichage des réactions */}
                        {hasReactions && (
                          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {Object.entries(reactions).map(([emoji, userIds]) => {
                              if (!userIds.length) return null;
                              const iMeReacted = userIds.includes(state.cloudUser?.uid || '');
                              return (
                                <button
                                  key={emoji}
                                  onClick={(e) => { e.stopPropagation(); handleToggleReaction(activity, emoji); }}
                                  className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full border transition-all hover:scale-105 ${
                                    iMeReacted
                                      ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                                      : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span className="font-semibold">{userIds.length}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Petit log d'activité
              return (
                <div key={activity.id} className="flex justify-center py-1">
                  <div className="flex items-center gap-2 bg-gray-100/50 dark:bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-200/50 dark:border-gray-700/50">
                    {getActivityIcon(activity.type)}
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {getActivityText(activity)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Zone de saisie */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 relative">
        {/* Suggestion de mentions */}
        {showMentionSuggestions && (
          <div className="absolute bottom-full left-4 mb-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[100] animate-in slide-in-from-bottom-2 duration-200">
            <div className="p-2 border-b border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Membres du projet</span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {members
                .filter(m => m.name.toLowerCase().includes(mentionQuery))
                .map(member => (
                  <button
                    key={member.uid}
                    onClick={() => insertMention(member.name)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-left transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-[10px] font-bold text-blue-600">
                      {member.name[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{member.name}</span>
                  </button>
                ))}
              {members.filter(m => m.name.toLowerCase().includes(mentionQuery)).length === 0 && (
                <div className="px-4 py-3 text-xs text-gray-500 italic">Aucun membre trouvé</div>
              )}
            </div>
          </div>
        )}

        {/* Bandeau de réponse */}
        {replyingTo && (
          <div className="flex items-start justify-between gap-2 mb-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 animate-in slide-in-from-bottom-1 duration-200">
            <div className="flex items-start gap-2 min-w-0">
              <CornerDownRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block">
                  Répondre à {replyingTo.actorName}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate block">
                  {(replyingTo.details || '').substring(0, 60)}{(replyingTo.details || '').length > 60 ? '…' : ''}
                </span>
              </div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="relative bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            placeholder={replyingTo ? `Répondre à ${replyingTo.actorName}...` : "Écrivez @nom pour mentionner..."}
            className="w-full bg-transparent border-none focus:ring-none focus:outline-none text-sm resize-none py-3 px-4 dark:text-gray-200 min-h-[44px] max-h-[120px]"
            rows={1}
            onBlur={() => {
              setTimeout(() => setShowMentionSuggestions(false), 200);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
              if (e.key === 'Escape' && replyingTo) {
                setReplyingTo(null);
              }
            }}
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-1">
              {/* Bouton mention */}
              <button
                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                onClick={() => setMessage(prev => prev + '@')}
                title="Mentionner quelqu'un"
              >
                <AtSign className="w-4 h-4" />
              </button>
              {/* Bouton emoji saisie */}
              <div className="relative">
                <button
                  className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                  onClick={(e) => { e.stopPropagation(); setShowInputEmojiPicker(v => !v); }}
                  title="Insérer un emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>
                {showInputEmojiPicker && (
                  <div
                    className="absolute bottom-full left-0 mb-2 w-[220px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-2 z-[200] animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">Emojis</p>
                    <div className="grid grid-cols-6 gap-0.5">
                      {INPUT_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setMessage(prev => prev + emoji);
                            setShowInputEmojiPicker(false);
                            inputRef.current?.focus();
                          }}
                          className="text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-125 transition-all"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !message.trim()}
              variant="gradient"
              size="sm"
              className="rounded-xl h-8 w-8 p-0 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
