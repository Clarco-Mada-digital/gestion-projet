import React, { useState, useEffect } from 'react';
import { Activity as ActivityIcon, CheckCircle2, MessageSquare, PlusCircle, UserPlus, RefreshCw, Trash2, Archive } from 'lucide-react';
import { Activity, ActivityType } from '../../types';
import { activityService } from '../../services/collaboration/activityService';

interface ActivityFeedProps {
  projectId: string;
}

export function ActivityFeed({ projectId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = activityService.subscribeToProjectActivities(projectId, (fetchedActivities) => {
      setActivities(fetchedActivities);
      setIsLoading(false);
    });

    // Si l'unsubscribe est vide (firebase non configuré), on arrête le loading
    if (unsubscribe.toString() === '() => { }' || unsubscribe.name === '') {
      // Un peu risqué car onSnapshot renvoie une fonction anonyme.
      // Mais activityService renvoie explicitement () => {} si non initialisé.
      // Une meilleure approche est de vérifier move the initialization check inside the component or service callback.
    }

    // Alternative plus sûre: Timeout de secours
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [projectId]);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'task_completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'comment_added': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'task_created': return <PlusCircle className="w-4 h-4 text-purple-500" />;
      case 'member_added': return <UserPlus className="w-4 h-4 text-orange-500" />;
      case 'project_updated': return <RefreshCw className="w-4 h-4 text-blue-400" />;
      case 'task_deleted': return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'project_archived': return <Archive className="w-4 h-4 text-gray-500" />;
      default: return <ActivityIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    const actor = <span className="font-semibold text-gray-900 dark:text-gray-100">{activity.actorName}</span>;
    const target = <span className="font-medium text-blue-600 dark:text-blue-400">{activity.targetName}</span>;

    switch (activity.type) {
      case 'task_completed': return <>{actor} a terminé la tâche {target}</>;
      case 'comment_added': return <>{actor} a commenté la tâche {target}</>;
      case 'task_created': return <>{actor} a créé la tâche {target}</>;
      case 'member_added': return <>{actor} a ajouté un membre au projet</>;
      case 'project_updated': return <>{actor} a mis à jour le projet</>;
      case 'task_deleted': return <>{actor} a supprimé la tâche {target}</>;
      case 'task_updated': return <>{actor} a mis à jour la tâche {target}</>;
      case 'project_created': return <>{actor} a créé le projet</>;
      case 'project_archived': return <>{actor} a archivé le projet</>;
      default: return <>{actor} a effectué une action</>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ActivityIcon className="w-5 h-5 text-blue-500 font-bold" />
          Fil d'activité
        </h3>
      </div>

      <div className="relative">
        {/* Ligne verticale de liaison */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-800 ml-[-1px]"></div>

        <div className="space-y-8">
          {activities.map((activity) => (
            <div key={activity.id} className="relative flex items-start gap-4">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-50 dark:border-gray-800 flex items-center justify-center shadow-sm">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 pt-1">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getActivityText(activity)}
                </div>
                {activity.details && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 italic">
                    {activity.details}
                  </div>
                )}
                <div className="mt-1 text-[10px] text-gray-400">
                  {new Date(activity.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="pl-12 py-10 text-center text-gray-500 text-sm italic">
              Aucune activité enregistrée pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
