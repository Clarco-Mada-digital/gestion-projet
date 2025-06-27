import { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle2, Send, Loader2, Edit, X, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import AIService from '../../services/aiService';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { Input } from '../UI/Input';
import { Textarea } from '../UI/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../UI/dialog';
import { EmailService } from '../../services/emailService';
import type { Task, SubTask, Project } from '../../types';

interface SubTaskReport {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

interface TaskReport {
  projectId: string;
  projectName: string;
  completedTasks: number;
  completedSubTasks: number;
  totalTasks: number;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    completedAt?: string | null;
    priority: string;
    assignees: string[];
    subTasks?: SubTaskReport[];
    isMainTask?: boolean;
    isParentOfSubTasks?: boolean;
  }>;
}

interface EmailFormData {
  to: string;
  subject: string;
  message: string;
}

export function ReportView() {
  const { state } = useApp();
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month'>('week');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [emailForm, setEmailForm] = useState<EmailFormData>({
    to: '',
    subject: 'Rapport d\'activité',
    message: 'Veuvez trouver ci-joint le rapport d\'activité demandé.'
  });
  
  const [report, setReport] = useState<{
    startDate: Date;
    endDate: Date;
    projects: TaskReport[];
  } | null>(null);
  const [aiReport, setAiReport] = useState<string>('');
  const [editedReport, setEditedReport] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [includeSubTasks, setIncludeSubTasks] = useState<boolean>(true);
  // Référence pour le textarea d'édition
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Récupérer le profil utilisateur actuel (non utilisé pour le moment)
  // const currentUser = state.users[0];
  
  // Fonction utilitaire pour obtenir toutes les tâches de tous les projets
  const getAllTasks = (): Array<{
    id: string;
    title: string;
    status: string;
    completedAt?: string;
    priority: string;
    assignees: string[];
    notes: string;
  }> => {
    return (state.projects || []).flatMap(project => project.tasks || []);
  };

  // Fonction utilitaire pour vérifier si une propriété existe sur un objet
  const hasProperty = <T extends object>(obj: T, key: PropertyKey): key is keyof T => {
    return key in obj;
  };
  
  // Déclaration des fonctions de gestion du rapport
  const generateSignature = (): string => {
    const user = state.users[0];
    if (!user) return '';
    
    const signatureParts = [
      user.name,
      user.position,
      user.department,
      user.email,
      user.phone
    ].filter(Boolean);
    
    return signatureParts.join(' | ');
  };
  
  const handleEditReport = () => {
    setEditedReport(aiReport);
    setIsEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };
  
  const handleSaveReport = () => {
    setAiReport(editedReport);
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setEditedReport(aiReport);
    setIsEditing(false);
  };

  // Gestion des changements du formulaire d'email
  const handleEmailFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmailForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Ouvrir la boîte de dialogue d'envoi d'email
  const handleOpenEmailDialog = () => {
    // Pré-remplir le sujet avec la période du rapport
    if (report) {
      const period = `Rapport d'activité du ${report.startDate.toLocaleDateString('fr-FR')} au ${report.endDate.toLocaleDateString('fr-FR')}`;
      setEmailForm(prev => ({
        ...prev,
        subject: period
      }));
    }
    setEmailDialogOpen(true);
  };
  
  // Envoyer l'email
  const handleSendEmail = async () => {
    if (!report || !state.emailSettings) return;
    
    setIsSendingEmail(true);
    setEmailStatus({ type: null, message: '' });
    
    try {
      // Utiliser le rapport édité s'il est disponible, sinon le rapport AI
      const reportContent = editedReport || aiReport;
      
      // Si le message est vide, utiliser le rapport généré
      const messageContent = emailForm.message.trim() || reportContent;
      
      // Générer le contenu HTML du rapport
      const emailContent = EmailService.generateReportEmail(
        {
          ...report,
          title: emailForm.subject,
          content: messageContent
        },
        state.users[0] // Utiliser l'utilisateur actuel pour la signature
      );
      
      // Créer un objet d'options d'email étendu
      const emailOptions: any = {
        to: emailForm.to,
        subject: emailForm.subject,
        html: emailContent
      };
      
      // Ajouter la version texte uniquement si elle est supportée
      if (typeof EmailService.sendEmail === 'function') {
        emailOptions.text = `Bonjour,\n\nVeuvez trouver ci-joint le rapport d'activité demandé.\n\n${messageContent}\n\nCordialement,\n${generateSignature()}`;
      }
      
      // Envoyer l'email
      const result = await EmailService.sendEmail(emailOptions, state.emailSettings);
      
      if (result.success) {
        setEmailStatus({ type: 'success', message: 'Email envoyé avec succès !' });
        // Fermer la boîte de dialogue après 2 secondes
        setTimeout(() => {
          setEmailDialogOpen(false);
          setEmailStatus({ type: null, message: '' });
        }, 2000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      setEmailStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'email'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Fonction pour obtenir la plage de dates
  const getDateRange = (range: 'day' | 'week' | 'month') => {
    const now = new Date();
    const start = new Date(now);
    
    switch (range) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        return { start, end: new Date(now) };
      case 'week':
        start.setDate(now.getDate() - now.getDay()); // Dimanche dernier
        start.setHours(0, 0, 0, 0);
        return { start, end: new Date(now) };
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        return { start, end: new Date(now) };
      default:
        return { start, end: new Date(now) };
    }
  };

  // Vérifier si une date est dans la période sélectionnée
  const isDateInRange = (date: Date, start: Date, end: Date) => {
    return date >= start && date <= end;
  };

  // Générer le rapport
  const generateReport = () => {
    console.log('Génération du rapport...');
    console.log('État complet des projets:', JSON.stringify(state.projects, null, 2));
    
    const { start, end } = getDateRange(dateRange);
    console.log(`Période du rapport: ${start.toISOString()} à ${end.toISOString()}`);
    
    // Filtrer les tâches par période, par projet et par statut (uniquement actif)
    const projectsData = (state.projects || [])
      .filter(project => {
        const isSelected = selectedProjectId === 'all' || project.id === selectedProjectId;
        const isActive = project.status === 'active';
        console.log(`Projet: ${project.name} (${project.id}), Sélectionné: ${isSelected}, Statut: ${project.status}`);
        return isSelected && isActive;
      })
      .map(project => {
        console.log(`Traitement du projet: ${project.name} (${project.id})`);
        // Toutes les tâches du projet
        const allTasks = project.tasks || [];
        console.log(`Nombre total de tâches dans le projet: ${allTasks.length}`);
        
        // Afficher la structure complète des tâches et sous-tâches
        allTasks.forEach((task, index) => {
          console.log(`Tâche #${index + 1}:`, {
            id: task.id,
            title: task.title,
            status: task.status,
            completedAt: task.completedAt,
            subTasks: task.subTasks ? task.subTasks.map(st => ({
              id: st.id,
              title: st.title,
              completed: st.completed,
              completedAt: st.completedAt
            })) : 'Aucune sous-tâche'
          });
        });
        
        // Tâches principales complétées dans la période
        const completedMainTasks = allTasks.filter((task): task is Task & { completedAt: string } => {
          if (task.status !== 'done' || !task.completedAt) return false;
          const taskCompletedDate = new Date(task.completedAt);
          const inRange = isDateInRange(taskCompletedDate, start, end);
          console.log(`Tâche: ${task.title}, Statut: ${task.status}, Complétée: ${task.completedAt}, Dans la période: ${inRange}`);
          return inRange;
        });
        
        // Sous-tâches complétées dans la période (toutes tâches confondues)
        const allCompletedSubTasks = allTasks.flatMap(task => {
          const subTasks = task.subTasks || [];
          console.log(`Tâche: ${task.title}, Nombre de sous-tâches: ${subTasks.length}`);
          
          return subTasks
            .filter((subTask): subTask is SubTask & { completedAt: string } => {
              const isCompleted = !!subTask.completed && !!subTask.completedAt;
              console.log(`Sous-tâche: ${subTask.title}, Complétée: ${isCompleted}, Date: ${subTask.completedAt}`);
              return isCompleted;
            })
            .map(subTask => {
              const subTaskCompletedDate = new Date(subTask.completedAt);
              const inRange = isDateInRange(subTaskCompletedDate, start, end);
              console.log(`Sous-tâche: ${subTask.title}, Date: ${subTask.completedAt}, Dans la période: ${inRange}`);
              
              return {
                ...subTask,
                parentTaskId: task.id,
                parentTaskTitle: task.title,
                _inRange: inRange
              };
            });
        }).filter(subTask => subTask._inRange);
        
        // Tâches avec sous-tâches complétées dans la période
        const tasksWithCompletedSubTasks = includeSubTasks 
          ? allTasks
              .map(task => {
                const subTasks = task.subTasks || [];
                const completedSubTasks = subTasks.filter((subTask): subTask is SubTask & { completedAt: string } => {
                  if (!subTask.completed || !subTask.completedAt) return false;
                  const inRange = isDateInRange(new Date(subTask.completedAt), start, end);
                  console.log(`Vérification sous-tâche: ${subTask.title}, Complétée: ${subTask.completed}, Date: ${subTask.completedAt}, Dans la période: ${inRange}`);
                  return inRange;
                });
                
                if (completedSubTasks.length > 0) {
                  console.log(`Tâche "${task.title}" a ${completedSubTasks.length} sous-tâches complétées dans la période`);
                  return {
                    ...task,
                    completedSubTasks
                  };
                }
                return null;
              })
              .filter((task): task is Task & { completedSubTasks: (SubTask & { completedAt: string })[] } => task !== null)
          : [];
          
        console.log(`Tâches avec sous-tâches complétées: ${tasksWithCompletedSubTasks.length}`);
        
        const totalTasks = allTasks.length;
        const totalCompletedTasks = completedMainTasks.length;
        const totalCompletedSubTasks = allCompletedSubTasks.length;
        
        // Créer un type pour les tâches du rapport
        type ReportTask = {
          id: string;
          title: string;
          status: string;
          completedAt: string | null;
          priority: string;
          assignees: string[];
          isMainTask?: boolean;
          isParentOfSubTasks?: boolean;
          subTasks?: Array<{
            id: string;
            title: string;
            completed: boolean;
            completedAt?: string;
          }>;
        };
        
        // Préparer les tâches pour le rapport
        const reportTasks: ReportTask[] = [
          // Tâches principales complétées dans la période
          ...completedMainTasks.map(task => ({
            id: task.id,
            title: task.title,
            status: task.status,
            completedAt: task.completedAt || null,
            priority: task.priority,
            assignees: task.assignees,
            isMainTask: true
          })),
          // Sous-tâches complétées dans la période (groupées par tâche parente)
          ...tasksWithCompletedSubTasks.map(task => ({
            id: `parent-${task.id}`,
            title: task.title,
            status: 'in-progress',
            completedAt: null,
            priority: task.priority,
            assignees: task.assignees,
            isParentOfSubTasks: true,
            subTasks: task.completedSubTasks.map(subTask => ({
              id: subTask.id,
              title: subTask.title,
              completed: true,
              completedAt: subTask.completedAt
            }))
          }))
        ];
        
        return {
          projectId: project.id,
          projectName: project.name,
          completedTasks: totalCompletedTasks,
          completedSubTasks: totalCompletedSubTasks,
          totalTasks,
          tasks: reportTasks
        };
      });
    
    setReport({
      startDate: start,
      endDate: end,
      projects: projectsData
    });
  };

  // Générer le rapport avec IA
  const generateAIReport = async (): Promise<void> => {
    console.log('Début de la génération du rapport IA');
    
    if (!report || report.projects.length === 0) {
      console.warn('Aucun rapport ou projet disponible pour générer le rapport IA');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      console.log('Préparation des données pour le rapport IA', { 
        nbProjets: report.projects.length,
        plageDates: `${report.startDate.toLocaleDateString('fr-FR')} - ${report.endDate.toLocaleDateString('fr-FR')}`
      });
      // Déclarer explicitement le type de mainTasks
      interface TaskSummary {
        project: string;
        title: string;
        completedAt: string;
        priority: string;
        notes: string;
        isSubTask: boolean;
        parentTaskTitle?: string;
        parentTaskCompleted?: boolean;
      }
      const project = state.projects[0]; // Utiliser le premier projet pour les paramètres IA
      const projectAiSettings = project?.aiSettings;
      const appAiSettings = state.appSettings?.aiSettings;
      
      // Créer un objet de paramètres IA complet
      console.log('Configuration IA trouvée :', { 
        appAiSettings: !!appAiSettings, 
        projectAiSettings: !!projectAiSettings 
      });
      
      const aiSettings = {
        ...appAiSettings,
        ...projectAiSettings,
        // S'assurer que les champs requis sont présents
        isConfigured: appAiSettings?.isConfigured || false,
        lastTested: appAiSettings?.lastTested || '',
        lastTestStatus: appAiSettings?.lastTestStatus || '',
        lastTestMessage: appAiSettings?.lastTestMessage || ''
      } as const;
      
      console.log('Configuration IA fusionnée :', {
        provider: aiSettings.provider,
        isConfigured: aiSettings.isConfigured,
        hasApiKey: !!(aiSettings.provider === 'openai' ? aiSettings.openaiApiKey : aiSettings.openrouterApiKey)
      });
      
      if (!aiSettings || !aiSettings.isConfigured) {
        const errorMsg = 'Paramètres IA non configurés ou non valides';
        console.error(errorMsg, aiSettings);
        throw new Error(errorMsg);
      }
      
      // Préparer un résumé des tâches pour le prompt
      const tasksSummary = report.projects.flatMap(project => {
        // Récupérer toutes les tâches du projet, y compris leurs sous-tâches
        return project.tasks.flatMap(task => {
          const priorityText = task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse';
          const completedAt = task.completedAt ? new Date(task.completedAt).toLocaleDateString('fr-FR') : 'Date inconnue';
          const notes = 'notes' in task ? (task.notes || '') : '';
          const taskEntries = [];
          
          // Vérifier si la tâche est active dans la période sélectionnée
          const taskStartDate = task.startDate ? new Date(task.startDate) : null;
          const taskEndDate = task.endDate ? new Date(task.endDate) : null;
          const isTaskActiveInPeriod = 
            (!taskStartDate || taskStartDate <= report.endDate) && 
            (!taskEndDate || taskEndDate >= report.startDate);
          
          // Vérifier si la tâche est marquée comme terminée
          const isTaskCompleted = task.status === 'done' && task.completedAt;
          
          // Ajouter la tâche principale si elle est complétée OU si elle est active et a des sous-tâches complétées
          if (isTaskCompleted || (isTaskActiveInPeriod && task.subTasks && task.subTasks.some(st => st.completed))) {
            taskEntries.push({
              project: project.projectName,
              title: task.title,
              completedAt: isTaskCompleted ? completedAt : 'En cours',
              priority: priorityText,
              notes,
              isSubTask: false,
              hasSubTasks: task.subTasks && task.subTasks.length > 0,
              isActive: isTaskActiveInPeriod
            });
          }
          
          // Ajouter les sous-tâches si elles existent et si l'option est activée
          if (includeSubTasks && task.subTasks && task.subTasks.length > 0) {
            task.subTasks.forEach(subTask => {
              if (subTask.completed && subTask.completedAt) {
                const subTaskCompletedAt = new Date(subTask.completedAt);
                if (isDateInRange(subTaskCompletedAt, report.startDate, report.endDate)) {
                  taskEntries.push({
                    project: project.projectName,
                    parentTaskTitle: task.title,
                    title: subTask.title,
                    completedAt: subTaskCompletedAt.toLocaleDateString('fr-FR'),
                    priority: priorityText,
                    notes: subTask.notes || '',
                    isSubTask: true,
                    parentTaskCompleted: isTaskCompleted,
                    parentTaskActive: isTaskActiveInPeriod
                  });
                }
              }
            });
          }
          
          return taskEntries;
        });
      });
      
      const currentUser = state.users[0]; // Utilisateur actuel
      const userInfo = [
        currentUser.name,
        currentUser.position,
        currentUser.department,
        currentUser.email,
        currentUser.phone
      ].filter(Boolean).join(' | ');
      
      // Vérifier s'il y a des tâches à inclure dans le rapport
      if (tasksSummary.length === 0) {
        return `Période du rapport : du ${report.startDate.toLocaleDateString('fr-FR')} au ${report.endDate.toLocaleDateString('fr-FR')}

Aucune tâche ou sous-tâche terminée n'a été trouvée pour cette période.`;
      }

      // Créer un rapport structuré basé uniquement sur les données réelles
      let reportContent = `Rapport d'activité - Période du ${report.startDate.toLocaleDateString('fr-FR')} au ${report.endDate.toLocaleDateString('fr-FR')}\n\n`;
      
      // Grouper les tâches par projet
      const tasksByProject: Record<string, TaskSummary[]> = {};
      tasksSummary.forEach(task => {
        if (!tasksByProject[task.project]) {
          tasksByProject[task.project] = [];
        }
        tasksByProject[task.project].push(task);
      });

      // Ajouter les tâches groupées par projet
      Object.entries(tasksByProject).forEach(([projectName, projectTasks]) => {
        reportContent += `## Projet : ${projectName}\n\n`;
        
        // Séparer les tâches principales des sous-tâches
        const mainTasks = projectTasks.filter(t => !t.isSubTask);
        const subTasks = projectTasks.filter(t => t.isSubTask);
        
        // Ajouter les tâches principales
        if (mainTasks.length > 0) {
          reportContent += '### Tâches principales terminées :\n';
          mainTasks.forEach((task, index) => {
            reportContent += `${index + 1}. ${task.title} (${task.priority}) - Terminé le ${task.completedAt}`;
            if (task.notes) reportContent += `\n   Notes: ${task.notes}`;
            reportContent += '\n';
          });
          reportContent += '\n';
        }
        
        // Ajouter les sous-tâches groupées par tâche parente
        if (subTasks.length > 0) {
          const subTasksByParent: Record<string, TaskSummary[]> = {};
          subTasks.forEach(subTask => {
            if (!subTasksByParent[subTask.parentTaskTitle]) {
              subTasksByParent[subTask.parentTaskTitle] = [];
            }
            subTasksByParent[subTask.parentTaskTitle].push(subTask);
          });
          
          reportContent += '### Sous-tâches terminées :\n';
          Object.entries(subTasksByParent).forEach(([parentTask, subTaskList]) => {
            reportContent += `- ${parentTask} :\n`;
            subTaskList.forEach((subTask, idx) => {
              reportContent += `  ${idx + 1}. ${subTask.title} (${subTask.priority}) - Terminé le ${subTask.completedAt}`;
              if (subTask.notes) reportContent += `\n     Notes: ${subTask.notes}`;
              reportContent += '\n';
            });
          });
          reportContent += '\n';
        }
      });
      
      // Ajouter le résumé des statistiques
      const totalTasks = tasksSummary.length;
      const totalSubTasks = tasksSummary.filter(t => t.isSubTask).length;
      const totalMainTasks = totalTasks - totalSubTasks;
      
      reportContent += `\n### Récapitulatif :\n`;
      reportContent += `- Tâches principales terminées : ${totalMainTasks}\n`;
      reportContent += `- Sous-tâches terminées : ${totalSubTasks}\n`;
      reportContent += `- Total des éléments terminés : ${totalTasks}\n\n`;
      
      // Ajouter la signature
      reportContent += `\nSignature :\n${userInfo}`;
      
      // Mettre à jour l'état avec le rapport généré
      setAiReport(reportContent);
      setEditedReport(reportContent);
      setIsEditing(false); // Sortir du mode édition si on régénère
      return;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport IA:', error);
      const errorMessage = 'Une erreur est survenue lors de la génération du rapport IA.';
      setAiReport(errorMessage);
      setEditedReport(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Effet pour générer le rapport quand la période ou le projet change
  useEffect(() => {
    generateReport();
  }, [dateRange, selectedProjectId, state.projects]);
  
  // Suppression des déclarations en double - les fonctions sont déjà définies plus haut dans le composant
  
  // Vérification de l'existence des propriétés optionnelles dans les tâches
  const safeGetTaskNotes = (task: any): string => {
    return hasProperty(task, 'notes') ? task.notes : '';
  };
  
  // Gestion de la génération du rapport IA avec gestion d'erreur améliorée
  const handleGenerateAIReport = async () => {
    console.log('Bouton Générer avec IA cliqué');
    
    if (!report || report.projects.length === 0) {
      const errorMsg = 'Aucune donnée de rapport disponible. Veuillez d\'abord générer un rapport standard.';
      console.error(errorMsg);
      alert(errorMsg);
      return;
    }
    
    try {
      setIsGenerating(true);
      console.log('Lancement de la génération du rapport IA...');
      
      await generateAIReport();
      console.log('Génération du rapport IA terminée avec succès');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Erreur lors de la génération du rapport IA:', error);
      
      // Afficher un message d'erreur à l'utilisateur
      const userFriendlyError = `Impossible de générer le rapport IA: ${errorMsg}.\n\nVeuillez vérifier votre configuration IA dans les paramètres.`;
      alert(userFriendlyError);
      
      // Mettre à jour l'état avec le message d'erreur
      setAiReport(userFriendlyError);
      setEditedReport(userFriendlyError);
      
    } finally {
      console.log('Nettoyage après génération du rapport IA');
      setIsGenerating(false);
    }
  };

  // Fonction pour basculer l'affichage des sous-tâches
  const toggleIncludeSubTasks = () => {
    setIncludeSubTasks(!includeSubTasks);
    // Régénérer le rapport avec le nouvel état
    generateReport();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Rapport d'Activité</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as 'day' | 'week' | 'month')}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="day">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
          
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">Tous les projets</option>
            {state.projects
              .filter(project => project.status === 'active')
              .map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
          </select>
          
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md p-1 border border-gray-300 dark:border-gray-600">
            <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Sous-tâches :
            </span>
            <Button
              variant={includeSubTasks ? 'primary' : 'ghost'}
              size="sm"
              onClick={toggleIncludeSubTasks}
              className={`transition-all duration-200 whitespace-nowrap ${
                includeSubTasks 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={includeSubTasks ? 'Masquer les sous-tâches' : 'Afficher les sous-tâches'}
            >
              {includeSubTasks ? 'Activées' : 'Désactivées'}
              {includeSubTasks ? (
                <CheckCircle2 className="ml-2 h-4 w-4" />
              ) : (
                <X className="ml-2 h-4 w-4" />
              )}
            </Button>
          </div>
            
          <Button 
            onClick={handleGenerateAIReport} 
            disabled={isGenerating || !report?.projects?.length}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              'Générer avec IA'
            )}
          </Button>
        </div>
      </div>
      
      {/* Affichage du rapport généré */}
      {report && report.projects.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Rapport du {report.startDate.toLocaleDateString('fr-FR')} au {report.endDate.toLocaleDateString('fr-FR')}
            </h2>
          </div>
          
          <div className="space-y-6">
            {report.projects.map(project => (
              <div key={project.projectId} className="border rounded-lg p-4">
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">{project.projectName}</h3>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">{project.completedTasks}</span> tâche{project.completedTasks > 1 ? 's' : ''} principale{project.completedTasks > 1 ? 's' : ''}
                      </div>
                      {project.completedSubTasks > 0 && (
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          <span className="font-medium">{project.completedSubTasks}</span> sous-tâche{project.completedSubTasks > 1 ? 's' : ''}
                        </div>
                      )}
                      <div className="text-sm text-gray-400">
                        sur {project.totalTasks} tâche{project.totalTasks > 1 ? 's' : ''} totale{project.totalTasks > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  
                  {/* Barre de progression */}
                  {project.totalTasks > 0 && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (project.completedTasks / project.totalTasks) * 100)}%`
                        }}
                      ></div>
                    </div>
                  )}
                </div>
                
                {project.tasks.length > 0 ? (
                  <div className="space-y-3">
                    {project.tasks.map(task => (
                      <div key={task.id} className={`p-3 border rounded-md transition-colors ${task.isMainTask ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-800'} hover:bg-gray-50 dark:hover:bg-gray-700`}>
                        {/* En-tête de la tâche */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-start flex-1">
                            <div className="flex-shrink-0 mr-3 mt-0.5">
                              {task.isMainTask ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                                  <span className="text-blue-500 text-xs">{task.subTasks?.length || 0}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium flex items-center">
                                {task.title}
                                {task.isMainTask && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded-full">
                                    Tâche principale
                                  </span>
                                )}
                              </div>
                              {task.completedAt && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Terminé le {new Date(task.completedAt).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Badge de priorité */}
                          {task.priority && (
                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                              task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                              {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                            </span>
                          )}
                        </div>
                        
                        {/* Liste des sous-tâches */}
                        {task.isParentOfSubTasks && task.subTasks && task.subTasks.length > 0 && (
                          <div className="mt-3 pl-8 space-y-2">
                            <div className="text-xs font-medium text-gray-500 mb-1">
                              Sous-tâches complétées :
                            </div>
                            <ul>
                              {task.subTasks.map((subTask: SubTaskReport) => (
                                <li key={subTask.id} className="flex items-center">
                                  <CheckCircle2 className="h-3 w-3 text-green-500 mr-2" />
                                  <span className="text-sm">{subTask.title}</span>
                                  {subTask.completedAt && (
                                    <span className="text-xs text-gray-500 ml-2">
                                      ({new Date(subTask.completedAt).toLocaleDateString('fr-FR')})
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Aucune tâche terminée pour cette période.</p>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleGenerateAIReport} 
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Génération IA en cours...
                </>
              ) : (
                'Générer un résumé avec IA'
              )}
            </Button>
          </div>
        </Card>
      )}
      
      {/* Section du rapport IA */}
      {(aiReport || isEditing) && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Rapport Généré par IA</h2>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditReport}
                    disabled={isSendingEmail}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigator.clipboard.writeText(aiReport)}
                    disabled={isSendingEmail}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Copier
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.print()}
                    disabled={isSendingEmail}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleOpenEmailDialog}
                    disabled={isSendingEmail}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSendingEmail ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Envoyer par email
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancelEdit}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleSaveReport}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <div className="prose dark:prose-invert max-w-none">
            {isEditing ? (
              <Textarea
                ref={textareaRef}
                value={editedReport}
                onChange={(e) => setEditedReport(e.target.value)}
                rows={40}                
                className="min-h-[300px] font-mono dark:bg-gray-700 text-sm"
              />
            ) : (
              <div className="whitespace-pre-wrap font-sans">
                {aiReport}
                {aiReport && !aiReport.includes(generateSignature()) && (
                  <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {generateSignature()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
      
      {/* Boîte de dialogue d'envoi d'email */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Envoyer le rapport par email</DialogTitle>
            <DialogDescription>
              Remplissez les champs ci-dessous pour envoyer ce rapport par email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="to" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Destinataire(s)
              </label>
              <Input
                id="to"
                name="to"
                type="email"
                value={emailForm.to}
                onChange={handleEmailFormChange}
                placeholder="email@exemple.com"
                className='dark:bg-gray-700 dark:text-white'
                required
              />
              <p className="text-xs text-gray-500 mt-1">Séparez les adresses par des virgules pour plusieurs destinataires.</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Objet
              </label>
              <Input
                id="subject"
                name="subject"
                value={emailForm.subject}
                onChange={handleEmailFormChange}
                className='dark:bg-gray-700 dark:text-white'
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={emailForm.message}
                onChange={handleEmailFormChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            
            {emailStatus.type && (
              <div className={`p-3 rounded-md ${emailStatus.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'}`}>
                {emailStatus.message}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEmailDialogOpen(false)}
              disabled={isSendingEmail}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={isSendingEmail || !emailForm.to || !emailForm.subject}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer l'email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
