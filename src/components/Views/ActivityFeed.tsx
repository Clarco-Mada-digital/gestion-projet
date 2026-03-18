import { useState, useEffect, useRef } from 'react';
import { Activity as ActivityIcon, CheckCircle2, MessageSquare, X, PlusCircle, UserPlus, Send, Loader2, AtSign, Trash2, Edit2, CheckCircle, Square } from 'lucide-react';
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

export function ActivityFeed({ projectId, project, onClose }: ActivityFeedProps) {
  const { state } = useApp();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [members, setMembers] = useState<{ uid: string, name: string }[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
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
          return { uid, name: profile?.displayName || profile?.email || 'Membre' };
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
      // Délai supplémentaire pour le rendu complexe ou ouverture de Drawer
      setTimeout(scroll, 100);
      setTimeout(scroll, 300);
    }
  }, [activities, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const pos = e.target.selectionStart;
    setMessage(value);
    setCursorPosition(pos);

    // Détecter si on est en train de taper une mention
    const textBeforeCursor = value.slice(0, pos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtSymbol + 1);
      // On s'arrête si on rencontre un espace après le @
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

    // Remettre le focus
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !state.cloudUser) return;

    setIsSending(true);
    try {
      // Détecter les mentions @Nom
      const mentions = members.filter(m => message.includes(`@${m.name}`));

      await activityService.logActivity({
        projectId,
        type: 'project_discussion',
        actorId: state.cloudUser.uid,
        actorName: state.cloudUser.displayName || state.cloudUser.email || 'Anonyme',
        actorAvatar: state.cloudUser.photoURL || undefined,
        details: message.trim()
      });

      // Envoyer des notifications aux personnes mentionnées
      for (const mention of mentions) {
        if (mention.uid !== state.cloudUser.uid) {
          await notificationService.sendNotification({
            userId: mention.uid,
            title: 'Nouvelle mention',
            message: `${state.cloudUser.displayName || 'Quelqu\'un'} vous a mentionné dans "${project.name}"`,
            type: 'mention',
            projectId: projectId,
            projectName: project.name,
            link: `/projects/${projectId}`
          });
        }
      }

      setMessage('');
    } catch (error) {
      console.error('Erreur lors de l\'envois du message:', error);
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

                   if (isDiscussion) {
                const isSelected = selectedIds.includes(activity.id);
                const isEditing = editingId === activity.id;

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
                        <div className="flex items-center gap-2 px-1">
                           <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                            {activity.actorName}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

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

                          {/* Actions Hover (Seulement pour mes messages et hors mode sélection) */}
                          {isMe && !isSelectionMode && !isEditing && (
                            <div className="absolute top-1/2 -left-12 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                               <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingId(activity.id);
                                  setEditingText(activity.details || '');
                                }}
                                className="p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 text-gray-400 hover:text-blue-500 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                               <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMessage(activity.id);
                                }}
                                className="p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
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

        <div className="relative bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            placeholder="Écrivez @nom pour mentionner..."
            className="w-full bg-transparent border-none focus:ring-none focus:outline-none text-sm resize-none py-3 px-4 dark:text-gray-200 min-h-[44px] max-h-[120px]"
            rows={1}
            onBlur={() => {
              // Petit délai pour permettre le clic sur une suggestion
              setTimeout(() => setShowMentionSuggestions(false), 200);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-1">
              <button
                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                onClick={() => setMessage(prev => prev + '@')}
                title="Mentionner quelqu'un"
              >
                <AtSign className="w-4 h-4" />
              </button>
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
