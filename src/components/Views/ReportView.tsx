import { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle2, Send, Loader2, Edit, X, Save, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import AIService from '../../services/aiService';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { Input } from '../UI/Input';
import { Textarea } from '../UI/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../UI/dialog';
import { EmailService } from '../../services/emailService';
import type { Task, SubTask } from '../../types';

interface SubTaskReport extends SubTask {
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
    startDate?: string;
    endDate?: string;
    notes?: string;
  }>;
}

interface EmailFormData {
  to: string;
  subject: string;
  message: string;
}

export function ReportView() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month'>('week');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [isProjectFilterOpen, setIsProjectFilterOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [emailForm, setEmailForm] = useState<EmailFormData>({
    to: '',
    subject: 'Delivery',
    message: 'Veuvez trouver ci-joint le rapport d\'activité demandé.'
  });
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);

  const [report, setReport] = useState<{
    startDate: Date;
    endDate: Date;
    projects: TaskReport[];
  } | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<string>('');
  const [editedReport, setEditedReport] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [includeSubTasks, setIncludeSubTasks] = useState<boolean>(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleEmailFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmailForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelection = new Set(selectedContacts);
    if (newSelection.has(contactId)) {
      newSelection.delete(contactId);
    } else {
      newSelection.add(contactId);
    }
    setSelectedContacts(newSelection);
  };

  const addSelectedContacts = () => {
    if (selectedContacts.size === 0) return;

    const selectedEmails = Array.from(selectedContacts)
      .map(id => state.appSettings.contacts?.find(c => c.id === id)?.email)
      .filter(Boolean) as string[];

    const currentEmails = emailForm.to ? emailForm.to.split(',').map(e => e.trim()) : [];
    const allEmails = [...new Set([...currentEmails, ...selectedEmails])];

    setEmailForm(prev => ({
      ...prev,
      to: allEmails.join(', ')
    }));

    setIsContactDialogOpen(false);
    setSelectedContacts(new Set());
  };

  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmailForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getNextReplyPrefix = (subject: string): string => {
    // Vérifier si le sujet a déjà un préfixe Re
    const rePattern = /^Re(\d*):\s*/;
    const match = subject.match(rePattern);
    
    if (match) {
      // Si déjà un préfixe Re, incrémenter le numéro
      const currentNumber = match[1] ? parseInt(match[1]) : 1;
      const nextNumber = currentNumber + 1;
      return subject.replace(rePattern, `Re${nextNumber}: `);
    } else {
      // Si pas de préfixe Re, ajouter Re:
      return `Re: ${subject}`;
    }
  };

  const handleOpenEmailDialog = (replyToSubject?: string, messageId?: string) => {
    // Si un sujet est passé (bouton Répondre de l'historique), on l'utilise directement
    if (replyToSubject) {
      // Gérer les réponses multiples (Re:, Re2:, Re3:, etc.)
      const subjectWithReply = getNextReplyPrefix(replyToSubject);
      
      setEmailForm(prev => ({
        ...prev,
        subject: subjectWithReply,
        message: aiReport || 'Voici une mise à jour de mon delivery.'
      }));
      if (messageId) {
        setReplyToMessageId(messageId);
      }
    } else if (report) {
      // Sinon on génère le sujet par défaut
      const formatDateShort = (date: Date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}.${m}.${y}`;
      };
      const period = `Delivery du ${formatDateShort(report.startDate)} au ${formatDateShort(report.endDate)}`;
      setEmailForm(prev => ({
        ...prev,
        subject: period,
        message: aiReport || 'Veuvez trouver ci-dessous le rapport d\'activité demandé.'
      }));
    }
    setEmailDialogOpen(true);
    setSelectedContacts(new Set());
  };

  // Sauvegarder manuellement dans l'historique sans envoyer d'email
  const handleSaveToHistory = () => {
    if (!report) return;

    const reportContent = editedReport || aiReport;
    const newReportEntry = {
      id: selectedReportId || `report-${Date.now()}`,
      title: emailForm.subject,
      content: reportContent,
      generatedAt: new Date().toISOString(),
      period: {
        start: report.startDate.toISOString(),
        end: report.endDate.toISOString()
      },
      projectIds: selectedProjectIds.length > 0 ? selectedProjectIds : state.projects.map(p => p.id),
      type: (aiReport ? 'ai' : 'standard') as 'ai' | 'standard',
      metadata: {
        emailSent: false,
      }
    };

    if (selectedReportId) {
      dispatch({ type: 'UPDATE_REPORT', payload: newReportEntry });
    } else {
      dispatch({ type: 'ADD_REPORT', payload: newReportEntry });
      setSelectedReportId(newReportEntry.id);
    }

    setEmailStatus({ type: 'success', message: 'Rapport enregistré dans l\'historique !' });
    setTimeout(() => setEmailStatus({ type: null, message: '' }), 3000);
  };

  const handleDownloadReport = () => {
    const reportContent = editedReport || aiReport;
    if (!reportContent || !report) return;

    // Créer le contenu du fichier
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    const fileName = `Rapport_${formatDate(report.startDate)}_au_${formatDate(report.endDate)}.txt`;
    
    // Créer le contenu complet du rapport
    const fullContent = `RAPPORT D'ACTIVITÉ
Période: ${formatDate(report.startDate)} au ${formatDate(report.endDate)}
Généré le: ${new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}

${'='.repeat(80)}

${reportContent}

${'='.repeat(80)}

Ce rapport a été généré automatiquement depuis l'application de gestion de projets.
`;

    // Créer un blob et télécharger
    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setEmailStatus({ type: 'success', message: 'Rapport téléchargé avec succès !' });
    setTimeout(() => setEmailStatus({ type: null, message: '' }), 3000);
  };

  const handleSendEmail = async () => {
    if (!report || !state.emailSettings) return;

    setIsSendingEmail(true);
    setEmailStatus({ type: null, message: '' });

    try {
      const reportContent = editedReport || aiReport;
      const messageContent = emailForm.message.trim() || reportContent;

      const toEmails = emailForm.to
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      if (toEmails.length === 0) {
        throw new Error('Veuillez spécifier au moins un destinataire');
      }

      const emailContent = EmailService.generateReportEmail(
        {
          ...report,
          title: emailForm.subject,
          content: messageContent
        },
        state.users[0]
      );

      const emailOptions: any = {
        serviceId: state.emailSettings.serviceId,
        templateId: state.emailSettings.templateId,
        userId: state.emailSettings.userId,
        to: toEmails.join(', '),
        from: state.emailSettings?.fromEmail || 'noreply@gestion-projet.com',
        fromName: state.emailSettings?.fromName || 'Gestion de Projet',
        subject: emailForm.subject,
        html: emailContent,
        text: messageContent.replace(/<[^>]*>?/gm, ''),
        templateParams: {
          to_emails: toEmails,
          to_name: toEmails[0].split('@')[0],
          from_name: state.emailSettings?.fromName || 'Gestion de Projet',
          from_email: state.emailSettings?.fromEmail || 'noreply@gestion-projet.com',
          subject: emailForm.subject,
          message: messageContent,
          content: emailContent,
          title: emailForm.subject,
          user_name: state.users[0]?.name || 'Utilisateur',
          // Note: EmailJS ne supporte pas le threading natif avec In-Reply-To et References
          // On utilise plutôt le préfixe "Re:" dans le sujet pour indiquer une réponse
        }
      };

      const result = await EmailService.sendEmail(emailOptions, state.emailSettings);

      if (result.success) {
        setEmailStatus({ type: 'success', message: `Email envoyé avec succès à ${toEmails.length} destinataire(s) !` });

        // Récupérer l'ID du message généré par EmailJS si disponible
        // Note: EmailJS v4 renvoie { status, text } mais l'ID du message est parfois dans text ou renvoyé différemment selon le service
        const sentMessageId = (result as any).messageId || (result as any).message_id || replyToMessageId;

        const contentForHistory = editedReport || aiReport;
        if (report) {
          const newReportEntry = {
            id: selectedReportId || `report-${Date.now()}`,
            title: emailForm.subject,
            content: contentForHistory,
            generatedAt: new Date().toISOString(),
            period: {
              start: report.startDate.toISOString(),
              end: report.endDate.toISOString()
            },
            projectIds: selectedProjectIds.length > 0 ? selectedProjectIds : state.projects.map(p => p.id),
            type: (aiReport ? 'ai' : 'standard') as 'ai' | 'standard',
            metadata: {
              emailSent: true,
              lastSentTo: toEmails,
              emailSubject: emailForm.subject,
              messageId: sentMessageId
            }
          };

          if (selectedReportId) {
            dispatch({ type: 'UPDATE_REPORT', payload: newReportEntry });
          } else {
            dispatch({ type: 'ADD_REPORT', payload: newReportEntry });
            setSelectedReportId(newReportEntry.id);
          }
        }

        setTimeout(() => {
          setEmailDialogOpen(false);
          setEmailStatus({ type: null, message: '' });
          setReplyToMessageId(null);
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

  const getDateRange = (range: 'day' | 'week' | 'month') => {
    const now = new Date();
    const start = new Date(now);

    switch (range) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        return { start, end: new Date(now) };
      case 'week':
        start.setDate(now.getDate() - now.getDay());
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

  const isDateInRange = (date: Date, start: Date, end: Date) => {
    return date >= start && date <= end;
  };

  const generateReport = () => {
    const { start, end } = getDateRange(dateRange);

    // Réinitialiser selectedReportId pour créer un nouveau rapport au lieu de modifier l'existant
    setSelectedReportId(null);

    const projectsData = (state.projects || [])
      .filter(project => {
        const isSelected = selectedProjectIds.length === 0 || selectedProjectIds.includes(project.id);
        const isActive = project.status === 'active';
        return isSelected && isActive;
      })
      .map(project => {
        const allTasks = project.tasks || [];

        const completedMainTasks = allTasks.filter((task): task is Task & { completedAt: string } => {
          if (task.status !== 'done' || !task.completedAt) return false;
          const taskCompletedDate = new Date(task.completedAt);
          return isDateInRange(taskCompletedDate, start, end);
        });

        const allCompletedSubTasks = allTasks.flatMap(task => {
          const subTasks = task.subTasks || [];
          return subTasks
            .filter((subTask): subTask is SubTask & { completedAt: string } => {
              return !!subTask.completed && !!subTask.completedAt;
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

        const tasksWithCompletedSubTasks = includeSubTasks
          ? allTasks
            .map(task => {
              const subTasks = task.subTasks || [];
              const completedSubTasks = subTasks.filter((subTask): subTask is SubTask & { completedAt: string } => {
                if (!subTask.completed || !subTask.completedAt) return false;
                return isDateInRange(new Date(subTask.completedAt), start, end);
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

        const reportTasks = [
          ...completedMainTasks.map(task => ({
            id: task.id,
            title: task.title,
            status: task.status,
            completedAt: task.completedAt || null,
            priority: task.priority,
            assignees: task.assignees,
            startDate: task.startDate,
            endDate: task.endDate,
            notes: task.notes,
            isMainTask: true
          })),
          ...tasksWithCompletedSubTasks.map(task => ({
            id: `parent-${task.id}`,
            title: task.title,
            status: 'in-progress',
            completedAt: null,
            priority: task.priority,
            assignees: task.assignees,
            startDate: task.startDate,
            endDate: task.endDate,
            notes: task.notes,
            isParentOfSubTasks: true,
            subTasks: task.completedSubTasks.map(subTask => ({
              id: subTask.id,
              title: subTask.title,
              completed: true,
              completedAt: subTask.completedAt,
              createdAt: subTask.createdAt,
              updatedAt: subTask.updatedAt
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

  const generateAIReport = async (): Promise<void> => {
    if (!report || report.projects.length === 0) return;

    setIsGenerating(true);

    try {
      const project = state.projects[0];
      const projectAiSettings = project?.aiSettings;
      const appAiSettings = state.appSettings?.aiSettings;

      const aiSettings = {
        ...appAiSettings,
        ...projectAiSettings,
        isConfigured: appAiSettings?.isConfigured || false,
      } as const;

      if (!aiSettings || !aiSettings.isConfigured) {
        throw new Error('Veuillez configurer les paramètres IA avant de générer un rapport.');
      }

      const apiKey = aiSettings.provider === 'openai'
        ? aiSettings.openaiApiKey
        : aiSettings.openrouterApiKey;

      if (!apiKey) {
        throw new Error(`Clé API ${aiSettings.provider} manquante. Veuillez vérifier vos paramètres.`);
      }

      const tasksSummary = report.projects.flatMap(project => {
        return project.tasks.flatMap(task => {
          const priorityText = task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse';
          const completedAt = task.completedAt ? new Date(task.completedAt).toLocaleDateString('fr-FR') : 'Date inconnue';
          const notes = task.notes || '';
          const taskEntries = [];

          const taskStartDate = task.startDate ? new Date(task.startDate) : null;
          const taskEndDate = task.endDate ? new Date(task.endDate) : null;
          const isTaskActiveInPeriod =
            (!taskStartDate || taskStartDate <= report.endDate) &&
            (!taskEndDate || taskEndDate >= report.startDate);

          const isTaskCompleted = task.status === 'done' && task.completedAt;

          if (isTaskCompleted || (isTaskActiveInPeriod && task.subTasks && task.subTasks.some(st => st.completed))) {
            taskEntries.push({
              project: project.projectName,
              title: task.title,
              completedAt: isTaskCompleted ? completedAt : 'En cours',
              priority: priorityText,
              notes,
              isSubTask: false,
              hasSubTasks: !!(task.subTasks && task.subTasks.length > 0),
              isActive: isTaskActiveInPeriod
            });
          }

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

      if (tasksSummary.length === 0) {
        const noTasksMessage = `Période du rapport : du ${report.startDate.toLocaleDateString('fr-FR')} au ${report.endDate.toLocaleDateString('fr-FR')}\n\nAucune activité enregistrée sur cette période.`;
        setAiReport(noTasksMessage);
        setEditedReport(noTasksMessage);
        return;
      }

      const prompt = `
      Tu es un Expert en Gestion de Projet et Communication d'Entreprise.
      Ta mission est de transformer une liste brute de tâches en un RAPPORT D'ACTIVITÉ PRESTIGIEUX et PROFESSIONNEL.
      
      Période du rapport : du ${report.startDate.toLocaleDateString('fr-FR')} au ${report.endDate.toLocaleDateString('fr-FR')}
      Données sources : ${JSON.stringify(tasksSummary, null, 2)}
      
      CONSIGNES STRICTES :
      1. STYLE : Ton très professionnel, exécutif, factuel et élégant. Pas de fioritures inutiles, mais un langage soutenu (ex: utilisez "concrétisation", "jalon", "optimisation", "perspective").
      2. STRUCTURE DU RAPPORT :
         - TITRE : Grand titre professionnel (ex: BILAN D'ACTIVITÉ OPÉRATIONNELLE).
         - RÉSUMÉ EXÉCUTIF : Un paragraphe de 3-4 lignes synthétisant l'avancement global.
         - RÉALISATIONS MAJEURES : Listez les succès clés par projet en utilisant des puces élégantes (•).
         - ANALYSE DE PERFORMANCE : Commentez la dynamique de travail (priorités respectées, réactivité).
         - PERSPECTIVES : Proposez 3 objectifs stratégiques pour la semaine suivante basés sur les données.
      3. INTERDICTION : Ne mentionne JAMAIS que tu es une IA. N'utilise pas d'indications comme "Voici votre rapport" ou "Généré par". Le texte doit sembler avoir été écrit par un directeur de projet.
      4. FORMATTAGE : Utilise des titres en majuscules et des espacements clairs. Utilise le Markdown pour la structure si nécessaire.
      
      Langue : Français exclusivement.`;

      const aiResponse = await AIService.generateAiText(aiSettings, prompt);

      if (!aiResponse) {
        throw new Error('Aucune réponse reçue du service IA');
      }

      const currentUser = state.users[0];
      const userName = currentUser?.name || 'Responsable de Projet';
      const userDept = currentUser?.department ? ` ${currentUser?.department?.trim()}` : '';

      const finalReport = `${aiResponse.trim()}\n\n---\nCordialement,\n\n${userName}${userDept}`;

      setAiReport(finalReport);
      setEditedReport(finalReport);
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la génération du rapport IA:', error);
      const errorMessage = 'Désolé, une erreur technique a empêché la génération du rapport. Veuillez vérifier votre connexion et votre configuration IA.';
      setAiReport(errorMessage);
      setEditedReport(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [dateRange, selectedProjectIds, state.projects]);

  const handleGenerateAIReport = async () => {
    if (!report || report.projects.length === 0) {
      const errorMsg = 'Aucune donnée de rapport disponible. Veuillez d\'abord générer un rapport standard.';
      setEmailStatus({ type: 'error', message: errorMsg });
      setTimeout(() => setEmailStatus({ type: null, message: '' }), 5000);
      return;
    }

    try {
      setIsGenerating(true);
      setAiReport('Génération du rapport en cours... Veuillez patienter.');
      await generateAIReport();
      setEmailStatus({ type: 'success', message: 'Le rapport a été généré avec succès !' });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      const userFriendlyError = `DÉTAIL DE L'ERREUR\n${'='.repeat(60)}\n\nImpossible de générer le rapport IA.\n\nRaison : ${errorMsg}`;
      setAiReport(userFriendlyError);
      setEditedReport(userFriendlyError);
      setEmailStatus({ type: 'error', message: 'Erreur lors de la génération du rapport' });
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setEmailStatus({ type: null, message: '' });
      }, 5000);
    }
  };

  const toggleIncludeSubTasks = () => {
    setIncludeSubTasks(!includeSubTasks);
    generateReport();
  };

  const handleDeleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport de l\'historique ?')) {
      dispatch({ type: 'DELETE_REPORT', payload: id });
      if (selectedReportId === id) {
        setSelectedReportId(null);
        setAiReport('');
        setEditedReport('');
      }
    }
  };

  const handleLoadReport = (reportEntry: any) => {
    setSelectedReportId(reportEntry.id);
    setAiReport(reportEntry.content);
    setEditedReport(reportEntry.content);
    setReport({
      startDate: new Date(reportEntry.period.start),
      endDate: new Date(reportEntry.period.end),
      projects: []
    });
    setActiveTab('generator');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rapports & Delivery</h1>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mt-2 w-fit">
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'generator' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Générateur
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'history' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Historique ({state.reports?.length || 0})
            </button>
          </div>
        </div>

        {activeTab === 'generator' && (
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

            <div className="relative">
              <button
                onClick={() => setIsProjectFilterOpen(!isProjectFilterOpen)}
                className={`flex items-center justify-between min-w-[200px] px-3 py-2 border rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 ${selectedProjectIds.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white'}`}
              >
                <span className="text-sm">
                  {selectedProjectIds.length === 0 ? 'Tous les projets' : `${selectedProjectIds.length} projet${selectedProjectIds.length > 1 ? 's' : ''}`}
                </span>
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isProjectFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProjectFilterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProjectFilterOpen(false)} />
                  <div className="absolute z-50 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2 max-h-80 overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => setSelectedProjectIds([])}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors mb-1 ${selectedProjectIds.length === 0 ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                      Tous les projets
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                    {state.projects.filter(p => p.status === 'active').map(project => (
                      <label key={project.id} className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedProjectIds.includes(project.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedProjectIds([...selectedProjectIds, project.id]);
                            else setSelectedProjectIds(selectedProjectIds.filter(id => id !== project.id));
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{project.name}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md p-1 border border-gray-300 dark:border-gray-600">
              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">Sous-tâches :</span>
              <Button
                variant={includeSubTasks ? 'primary' : 'ghost'}
                size="sm"
                onClick={toggleIncludeSubTasks}
                className={`transition-all duration-200 whitespace-nowrap ${includeSubTasks ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                {includeSubTasks ? 'Activées' : 'Désactivées'}
                {includeSubTasks ? <CheckCircle2 className="ml-2 h-4 w-4" /> : <X className="ml-2 h-4 w-4" />}
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
        )}
      </div>

      {activeTab === 'generator' && (
        <div className="space-y-6">
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
                      {project.totalTasks > 0 && (
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${Math.min(100, (project.completedTasks / project.totalTasks) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {project.tasks.length > 0 ? (
                      <div className="space-y-3">
                        {project.tasks.map(task => (
                          <div key={task.id} className={`p-3 border rounded-md transition-colors ${task.isMainTask ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-800'} hover:bg-gray-50 dark:hover:bg-gray-700`}>
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
                                    {task.isMainTask && <span className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded-full">Tâche principale</span>}
                                  </div>
                                  {task.completedAt && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Terminé le {new Date(task.completedAt).toLocaleString('fr-FR')}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                                {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                              </span>
                            </div>
                            {task.isParentOfSubTasks && task.subTasks && task.subTasks.length > 0 && (
                              <div className="mt-3 pl-8 space-y-2">
                                <div className="text-xs font-medium text-gray-500 mb-1">Sous-tâches complétées :</div>
                                <ul>
                                  {task.subTasks.map((subTask: SubTaskReport) => (
                                    <li key={subTask.id} className="flex items-center">
                                      <CheckCircle2 className="h-3 w-3 text-green-500 mr-2" />
                                      <span className="text-sm">{subTask.title}</span>
                                      {subTask.completedAt && <span className="text-xs text-gray-500 ml-2">({new Date(subTask.completedAt).toLocaleDateString('fr-FR')})</span>}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
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
                <Button onClick={handleGenerateAIReport} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Génération IA en cours...</> : 'Générer un résumé avec IA'}
                </Button>
              </div>
            </Card>
          )}

          {(aiReport || isEditing) && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Résumé du Rapport d'Activité</h2>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleEditReport} disabled={isSendingEmail}><Edit className="w-4 h-4 mr-2" />Modifier</Button>
                      <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(aiReport)} disabled={isSendingEmail}><FileText className="w-4 h-4 mr-2" />Copier</Button>
                      <Button variant="outline" size="sm" onClick={handleSaveToHistory} disabled={isSendingEmail} className="text-blue-600 border-blue-200 hover:bg-blue-50"><Save className="w-4 h-4 mr-2" />Enregistrer</Button>
                      <Button variant="outline" size="sm" onClick={handleDownloadReport} disabled={isSendingEmail}><FileText className="w-4 h-4 mr-2" />Télécharger</Button>
                      <Button variant="primary" size="sm" onClick={() => handleOpenEmailDialog()} disabled={isSendingEmail} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isSendingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}Envoyer par email
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={handleCancelEdit} className="text-red-600 border-red-300 hover:bg-red-50"><X className="w-4 h-4 mr-2" />Annuler</Button>
                      <Button variant="primary" size="sm" onClick={handleSaveReport} className="bg-green-600 hover:bg-green-700 text-white"><Save className="w-4 h-4 mr-2" />Enregistrer</Button>
                    </>
                  )}
                </div>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                {isEditing ? (
                  <Textarea ref={textareaRef} value={editedReport} onChange={(e) => setEditedReport(e.target.value)} rows={20} className="min-h-[300px] font-mono dark:bg-gray-700 text-sm" />
                ) : (
                  <div className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200 leading-relaxed">{aiReport}</div>
                )}
              </div>
            </Card>
          )}

          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Envoyer le rapport par email</DialogTitle>
                <DialogDescription>Remplissez les champs ci-dessous pour envoyer ce rapport par email.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="to" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Destinataire(s)</label>
                    <button type="button" onClick={() => setIsContactDialogOpen(true)} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Choisir depuis les contacts</button>
                  </div>
                  <Input id="to" name="to" type="email" value={emailForm.to} onChange={handleEmailInput} placeholder="email@exemple.com" className='dark:bg-gray-700 dark:text-white' required />
                  <p className="text-xs text-gray-500">Séparez les adresses par des virgules.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Objet de l'email</label>

                  {state.reports && state.reports.length > 0 && (
                    <div className="flex flex-col gap-2 mb-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                      <span className="text-xs font-medium text-gray-500">Choisir un type d'envoi :</span>
                      <div className="flex gap-4">
                        <label className="flex items-center text-sm cursor-pointer">
                          <input
                            type="radio"
                            name="deliveryType"
                            checked={!state.reports.some(r => r.title === emailForm.subject)}
                            onChange={() => {
                              // Re-générer le sujet par défaut
                              const formatDateShort = (date: Date) => {
                                const d = date.getDate().toString().padStart(2, '0');
                                const m = (date.getMonth() + 1).toString().padStart(2, '0');
                                const y = date.getFullYear();
                                return `${d}.${m}.${y}`;
                              };
                              if (report) {
                                setEmailForm(prev => ({ ...prev, subject: `Delivery du ${formatDateShort(report.startDate)} au ${formatDateShort(report.endDate)}` }));
                              }
                            }}
                            className="mr-2"
                          />
                          Nouveau fil
                        </label>
                        <label className="flex items-center text-sm cursor-pointer">
                          <input
                            type="radio"
                            name="deliveryType"
                            checked={state.reports.some(r => r.title === emailForm.subject)}
                            onChange={() => {
                              // Prendre le sujet du dernier rapport
                              if (state.reports.length > 0) {
                                const lastReport = state.reports[0];
                                setEmailForm(prev => ({ ...prev, subject: lastReport.title }));
                                if (lastReport.metadata?.messageId) {
                                  setReplyToMessageId(lastReport.metadata.messageId);
                                }
                              }
                            }}
                            className="mr-2"
                          />
                          Réponse au précédent
                        </label>
                      </div>

                      {state.reports.some(r => r.title === emailForm.subject) && (
                        <select
                          value={emailForm.subject}
                          onChange={(e) => {
                            const subj = e.target.value;
                            setEmailForm(prev => ({ ...prev, subject: subj }));
                            const matched = state.reports.find(r => r.title === subj);
                            if (matched?.metadata?.messageId) {
                              setReplyToMessageId(matched.metadata.messageId);
                            } else {
                              setReplyToMessageId(null);
                            }
                          }}
                          className="mt-2 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
                        >
                          {[...new Set(state.reports.map(r => r.title))].map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  <Input id="subject" name="subject" value={emailForm.subject} onChange={handleEmailFormChange} className='dark:bg-gray-700 dark:text-white' required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                  <textarea id="message" name="message" rows={4} value={emailForm.message} onChange={handleEmailFormChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white" required />
                </div>
                {emailStatus.type && (
                  <div className={`p-3 rounded-md ${emailStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{emailStatus.message}</div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEmailDialogOpen(false)} disabled={isSendingEmail}>Annuler</Button>
                <Button onClick={handleSendEmail} disabled={isSendingEmail || !emailForm.to || !emailForm.subject} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isSendingEmail ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Envoi...</> : <><Send className="w-4 h-4 mr-2" />Envoyer</>}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader><DialogTitle>Sélectionner des contacts</DialogTitle></DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto space-y-2 py-4">
                {state.appSettings?.contacts?.map((contact: any) => (
                  <label key={contact.id} className="flex items-start p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <input type="checkbox" checked={selectedContacts.has(contact.id)} onChange={() => toggleContactSelection(contact.id)} className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600" />
                    <div className="ml-3">
                      <div className="font-medium text-gray-900 dark:text-white">{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.email}</div>
                    </div>
                  </label>
                ))}
              </div>
              <DialogFooter><Button onClick={addSelectedContacts}>Ajouter</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {state.reports && state.reports.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {state.reports.map((reportEntry: any) => (
                <Card key={reportEntry.id} className="p-5 hover:border-blue-300 transition-all cursor-pointer group" onClick={() => handleLoadReport(reportEntry)}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{reportEntry.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${reportEntry.type === 'ai' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{reportEntry.type === 'ai' ? 'IA' : 'Standard'}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 gap-4">
                        <span className="flex items-center"><CalendarIcon className="w-3 h-3 mr-1" />{new Date(reportEntry.generatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        <span>Période : {new Date(reportEntry.period.start).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} - {new Date(reportEntry.period.end).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                      </div>
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 italic">{reportEntry.content.substring(0, 150)}...</div>
                      {reportEntry.metadata?.emailSent && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3 mr-1" />Envoyé par email</div>
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] text-blue-600" onClick={(e) => { e.stopPropagation(); handleLoadReport(reportEntry); setTimeout(() => handleOpenEmailDialog(reportEntry.metadata.emailSubject, reportEntry.metadata.messageId), 100); }}>
                            <Send className="w-3 h-3 mr-1" />Répondre (Fil)
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={(e) => handleDeleteReport(reportEntry.id, e)}><X className="w-4 h-4" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucun rapport enregistré</h3>
              <p className="text-gray-500 dark:text-gray-400">Générez un rapport et envoyez-le par email pour qu'il apparaisse ici.</p>
              <Button variant="primary" className="mt-6 bg-blue-600 hover:bg-blue-700" onClick={() => setActiveTab('generator')}>Générer un rapport</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
