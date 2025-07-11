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
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  
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

  // Gestion de la sélection/désélection d'un contact
  const toggleContactSelection = (contactId: string) => {
    const newSelection = new Set(selectedContacts);
    if (newSelection.has(contactId)) {
      newSelection.delete(contactId);
    } else {
      newSelection.add(contactId);
    }
    setSelectedContacts(newSelection);
  };

  // Ajouter les contacts sélectionnés au champ email
  const addSelectedContacts = () => {
    if (selectedContacts.size === 0) return;
    
    const selectedEmails = Array.from(selectedContacts)
      .map(id => state.appSettings.contacts?.find(c => c.id === id)?.email)
      .filter(Boolean) as string[];
    
    // Ajouter les nouveaux emails à la liste existante
    const currentEmails = emailForm.to ? emailForm.to.split(',').map(e => e.trim()) : [];
    const allEmails = [...new Set([...currentEmails, ...selectedEmails])];
    
    setEmailForm(prev => ({
      ...prev,
      to: allEmails.join(', ')
    }));
    
    // Fermer la boîte de dialogue et réinitialiser la sélection
    setIsContactDialogOpen(false);
    setSelectedContacts(new Set());
  };
  
  // Fonction pour ajouter un email manuellement
  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        subject: period,
        message: aiReport || 'Veuvez trouver ci-dessous le rapport d\'activité demandé.'
      }));
    }
    setEmailDialogOpen(true);
    // Réinitialiser la sélection des contacts
    setSelectedContacts(new Set());
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
      
      // Préparer la liste des destinataires
      const toEmails = emailForm.to
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);
      
      if (toEmails.length === 0) {
        throw new Error('Veuillez spécifier au moins un destinataire');
      }
      
      // Générer le contenu HTML du rapport
      const emailContent = EmailService.generateReportEmail(
        {
          ...report,
          title: emailForm.subject,
          content: messageContent
        },
        state.users[0] // Utiliser l'utilisateur actuel pour la signature
      );
      
      // Créer un objet d'options d'email étendu avec les paramètres du template
      const emailOptions: any = {
        to: toEmails, // Envoyer à tous les destinataires
        subject: emailForm.subject,
        html: emailContent,
        // Ajouter les paramètres du template
        templateParams: {
          to_email: toEmails[0], // Premier email pour la compatibilité
          to_emails: toEmails,   // Tous les emails pour référence
          to_name: toEmails[0].split('@')[0], // Utiliser la partie avant @ du premier email comme nom
          from_name: state.emailSettings?.fromName || 'Gestion de Projet',
          from_email: state.emailSettings?.fromEmail || 'noreply@gestion-projet.com',
          subject: emailForm.subject,
          message: messageContent, // Version texte du message
          content: emailContent,   // Version HTML du message
          title: emailForm.subject,
          user_name: state.users[0]?.name || 'Utilisateur'
        }
      };
      
      // Ajouter la version texte pour la compatibilité
      emailOptions.text = `Bonjour,\n\nVeuvez trouver ci-joint le rapport d'activité demandé.\n\n${messageContent.replace(/<[^>]*>?/gm, '')}\n\nCordialement,\n${generateSignature()}`;
      
      // Envoyer l'email
      const result = await EmailService.sendEmail(emailOptions, state.emailSettings);
      
      if (result.success) {
        setEmailStatus({ type: 'success', message: `Email envoyé avec succès à ${toEmails.length} destinataire(s) !` });
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


    
    const { start, end } = getDateRange(dateRange);

    
    // Filtrer les tâches par période, par projet et par statut (uniquement actif)
    const projectsData = (state.projects || [])
      .filter(project => {
        const isSelected = selectedProjectId === 'all' || project.id === selectedProjectId;
        const isActive = project.status === 'active';

        return isSelected && isActive;
      })
      .map(project => {

        // Toutes les tâches du projet
        const allTasks = project.tasks || [];       
        
        
        // Tâches principales complétées dans la période
        const completedMainTasks = allTasks.filter((task): task is Task & { completedAt: string } => {
          if (task.status !== 'done' || !task.completedAt) return false;
          const taskCompletedDate = new Date(task.completedAt);
          const inRange = isDateInRange(taskCompletedDate, start, end);

          return inRange;
        });
        
        // Sous-tâches complétées dans la période (toutes tâches confondues)
        const allCompletedSubTasks = allTasks.flatMap(task => {
          const subTasks = task.subTasks || [];

          
          return subTasks
            .filter((subTask): subTask is SubTask & { completedAt: string } => {
              const isCompleted = !!subTask.completed && !!subTask.completedAt;

              return isCompleted;
            })
            .map(subTask => {
              const subTaskCompletedDate = new Date(subTask.completedAt);
              const inRange = isDateInRange(subTaskCompletedDate, start, end);

              
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

                  return inRange;
                });
                
                if (completedSubTasks.length > 0) {

                  return {
                    ...task,
                    completedSubTasks
                  };
                }
                return null;
              })
              .filter((task): task is Task & { completedSubTasks: (SubTask & { completedAt: string })[] } => task !== null)
          : [];
          

        
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

    
    if (!report || report.projects.length === 0) {
      console.warn('Aucun rapport ou projet disponible pour générer le rapport IA');
      return;
    }
    
    setIsGenerating(true);
    
    try {      
      // Interface pour le résumé des tâches
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

      // Récupérer les paramètres IA
      const project = state.projects[0];
      const projectAiSettings = project?.aiSettings;
      const appAiSettings = state.appSettings?.aiSettings;
      
      // Fusionner les paramètres IA (les paramètres du projet écrasent ceux de l'application)
      const aiSettings = {
        ...appAiSettings,
        ...projectAiSettings,
        isConfigured: appAiSettings?.isConfigured || false,
      } as const;
      
      // Vérifier la configuration de l'IA
      if (!aiSettings || !aiSettings.isConfigured) {
        throw new Error('Veuillez configurer les paramètres IA avant de générer un rapport.');
      }
      
      // Vérifier la présence de la clé API
      const apiKey = aiSettings.provider === 'openai' 
        ? aiSettings.openaiApiKey 
        : aiSettings.openrouterApiKey;
        
      if (!apiKey) {
        throw new Error(`Clé API ${aiSettings.provider} manquante. Veuillez vérifier vos paramètres.`);
      }
      
      // Préparer un résumé structuré des tâches pour l'IA
      const tasksSummary = report.projects.flatMap(project => {
        return project.tasks.flatMap(task => {
          const priorityText = task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse';
          const completedAt = task.completedAt ? new Date(task.completedAt).toLocaleDateString('fr-FR') : 'Date inconnue';
          const notes = 'notes' in task ? (task.notes || '') : '';
          const taskEntries = [];
          
          // Vérifier si la tâche est active dans la période
          const taskStartDate = task.startDate ? new Date(task.startDate) : null;
          const taskEndDate = task.endDate ? new Date(task.endDate) : null;
          const isTaskActiveInPeriod = 
            (!taskStartDate || taskStartDate <= report.endDate) && 
            (!taskEndDate || taskEndDate >= report.startDate);
          
          const isTaskCompleted = task.status === 'done' && task.completedAt;
          
          // Ajouter la tâche principale si pertinente
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
          
          // Ajouter les sous-tâches si nécessaire
          if (includeSubTasks && task.subTasks?.length > 0) {
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
      
      // Préparer le prompt pour l'IA
      const prompt = `
      Tu es un assistant qui aide à générer des rapports professionnels pour la gestion de projet.
      
      Voici les tâches à analyser pour la période du ${report.startDate.toLocaleDateString('fr-FR')} au ${report.endDate.toLocaleDateString('fr-FR')} :
      
      ${JSON.stringify(tasksSummary, null, 2)}
      
      Analyse ces tâches et génère un rapport professionnel qui inclut :
      1. Un résumé exécutif des réalisations
      2. Une analyse des tâches terminées par projet
      3. Les points forts et les défis rencontrés
      4. Des recommandations pour la période suivante
      
      Le rapport doit être en français, clair et structuré avec des titres et sous-titres.`;
      

      
      // Appeler le service IA
      const aiResponse = await AIService.generateAiText(aiSettings, prompt);
      
      if (!aiResponse) {
        throw new Error('Aucune réponse reçue du service IA');
      }
      

      
      // Formater la réponse de l'IA
      const reportContent = `
      ===========================================
        RAPPORT D'ACTIVITÉ - ANALYSE PAR IA
      ===========================================
      
      Période : Du ${report.startDate.toLocaleDateString('fr-FR')} au ${report.endDate.toLocaleDateString('fr-FR')}
      Généré le : ${new Date().toLocaleString('fr-FR')}
      
      ${aiResponse}
      
      ===========================================
        DONNÉES BRUTES POUR RÉFÉRENCE
      ===========================================
      
      Nombre total de tâches analysées : ${tasksSummary.length}
      Nombre de projets concernés : ${report.projects.length}
      `;
      
      // Vérifier s'il y a des tâches à inclure
      if (tasksSummary.length === 0) {
        const noTasksMessage = `Période du rapport : du ${report.startDate.toLocaleDateString('fr-FR')} au ${report.endDate.toLocaleDateString('fr-FR')}

Aucune tâche ou sous-tâche terminée n'a été trouvée pour cette période.`;
        setAiReport(noTasksMessage);
        setEditedReport(noTasksMessage);
        return;
      }

      try {
        // Préparer le contenu du rapport avec l'IA
        const aiResponse = await AIService.generateAiText(aiSettings, `
          Tu es un assistant qui aide à générer des rapports professionnels pour la gestion de projet.
          
          Voici les tâches à analyser pour la période du ${report.startDate.toLocaleDateString('fr-FR')} au ${report.endDate.toLocaleDateString('fr-FR')} :
          
          ${JSON.stringify(tasksSummary, null, 2)}
          
          Analyse ces tâches et génère un rapport professionnel qui inclut :
          1. Un résumé exécutif des réalisations
          2. Une analyse des tâches terminées par projet
          3. Les points forts et les défis rencontrés
          4. Des recommandations pour la période suivante
          
          Le rapport doit être en français, clair et structuré avec des titres et sous-titres.
        `);

        if (!aiResponse) {
          throw new Error('Aucune réponse reçue du service IA');
        }

        // Récupérer les informations utilisateur pour la signature
        const currentUser = state.users[0];
        const userInfo = [
          currentUser?.name || 'Utilisateur',
          currentUser?.position,
          currentUser?.department,
          currentUser?.email
        ].filter(Boolean).join(' | ');

        // Construire le contenu final du rapport
        const reportContent = `
        ===========================================
          RAPPORT D'ACTIVITÉ - ANALYSE PAR IA
        ===========================================
        
        Période : Du ${report.startDate.toLocaleDateString('fr-FR')} au ${report.endDate.toLocaleDateString('fr-FR')}
        Généré le : ${new Date().toLocaleString('fr-FR')}
        
        ${aiResponse}
        
        ===========================================
          DONNÉES BRUTES POUR RÉFÉRENCE
        ===========================================
        
        Nombre total de tâches analysées : ${tasksSummary.length}
        Nombre de projets concernés : ${report.projects.length}
        `;

        // Ajouter la signature
        const signature = `
        ${'='.repeat(60)}
        SIGNATURE
        ${'='.repeat(60)}
        
        Ce rapport a été généré automatiquement avec l'assistance d'une IA.
        
        Avec nos meilleures salutations,
        ${userInfo}
        
        © ${new Date().getFullYear()} - Tous droits réservés`;

        // Mettre à jour l'état avec le rapport généré
        setAiReport(reportContent + signature);
        setEditedReport(reportContent + signature);
        setIsEditing(false);
      } catch (error) {
        console.error('Erreur lors de la génération du rapport IA :', error);
        const errorMessage = `Erreur lors de la génération du rapport IA : ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
        setAiReport(errorMessage);
        setEditedReport(errorMessage);
      }
      // La génération du rapport est maintenant gérée par l'IA
      // Les tâches et sous-tâches sont incluses dans l'analyse IA
      setIsEditing(false); // Sortir du mode édition
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
  
  // Gestion de la génération du rapport IA avec gestion d'erreur améliorée et feedback utilisateur
  const handleGenerateAIReport = async () => {

    
    if (!report || report.projects.length === 0) {
      const errorMsg = 'Aucune donnée de rapport disponible. Veuillez d\'abord générer un rapport standard.';
      console.error(errorMsg);
      // Utiliser une notification plus élégante qu'une alerte
      setEmailStatus({
        type: 'error',
        message: errorMsg
      });
      setTimeout(() => setEmailStatus({ type: null, message: '' }), 5000);
      return;
    }
    
    try {
      setIsGenerating(true);

      
      // Ajouter un indicateur visuel de chargement
      setAiReport('Génération du rapport en cours... Veuillez patienter.');
      
      // Générer le rapport
      await generateAIReport();
      
      // Afficher un message de succès
      setEmailStatus({
        type: 'success',
        message: 'Le rapport a été généré avec succès !'
      });
      

      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Erreur lors de la génération du rapport IA:', error);
      
      // Message d'erreur plus détaillé
      const userFriendlyError = `DÉTAIL DE L'ERREUR\n${'='.repeat(60)}\n\n` +
        `Impossible de générer le rapport IA.\n\n` +
        `Raison : ${errorMsg}\n\n` +
        `Vérifiez que :\n` +
        `1. Votre connexion Internet est active\n` +
        `2. Votre clé API est valide et configurée dans les paramètres\n` +
        `3. Votre quota d'API n'est pas dépassé\n\n` +
        `Si le problème persiste, contactez le support technique.`;
      
      // Mettre à jour l'état avec le message d'erreur formaté
      setAiReport(userFriendlyError);
      setEditedReport(userFriendlyError);
      
      // Afficher une notification d'erreur
      setEmailStatus({
        type: 'error',
        message: 'Erreur lors de la génération du rapport'
      });
      
    } finally {

      // Laisser un court délai pour que l'utilisateur puisse voir le message de statut
      setTimeout(() => {
        setIsGenerating(false);
        setEmailStatus({ type: null, message: '' });
      }, 5000);
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
              <div className="flex items-center justify-between">
                <label htmlFor="to" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Destinataire(s)
                </label>
                <button
                  type="button"
                  onClick={() => setIsContactDialogOpen(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Choisir depuis les contacts
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  id="to"
                  name="to"
                  type="email"
                  value={emailForm.to}
                  onChange={handleEmailInput}
                  placeholder="email@exemple.com"
                  className='flex-1 dark:bg-gray-700 dark:text-white'
                  required
                />
              </div>
              <p className="text-xs text-gray-500">Séparez les adresses par des virgules pour plusieurs destinataires.</p>
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

      {/* Boîte de dialogue de sélection des contacts */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Sélectionner des contacts</DialogTitle>
            <DialogDescription>
              Cochez les contacts à ajouter comme destinataires
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-2 py-4">
            {state.appSettings?.contacts?.length > 0 ? (
              state.appSettings.contacts.map((contact) => (
                <label 
                  key={contact.id}
                  className={`flex items-start p-3 rounded-lg border ${
                    selectedContacts.has(contact.id)
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedContacts.has(contact.id)}
                    onChange={() => toggleContactSelection(contact.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {contact.name}
                      {contact.position && (
                        <span className="text-xs text-gray-500 ml-2">({contact.position})</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {contact.email}
                    </div>
                  </div>
                </label>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucun contact enregistré. Veuillez ajouter des contacts dans les paramètres.
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsContactDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={addSelectedContacts}
              disabled={selectedContacts.size === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Ajouter les contacts sélectionnés
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>      
    </div>
  );
}

