import React, { useState, useRef, useEffect } from 'react';
import { Calendar, FileText, CheckCircle, X, ChevronDown, Send, Loader2, Edit, Save } from 'lucide-react';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { useApp } from '../../context/AppContext';
import { Task, AISettings, SubTask, ReportEntry } from '../../types';
import { AIService } from '../../services/aiService';
import { Input } from '../UI/Input';
import { Textarea } from '../UI/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../UI/dialog';
import { EmailService } from '../../services/emailService';
import { getBasePath } from '../../lib/pathUtils';

interface SubTaskReport {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
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
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error' | 'info' | null; message: string }>({ type: null, message: '' });
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: 'Delivery',
    message: 'Veuvez trouver ci-joint le rapport d\'activité demandé.'
  });
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [replyToThreadId, setReplyToThreadId] = useState<string | null>(null);

  const [report, setReport] = useState<{
    startDate: Date;
    endDate: Date;
    projects: any[];
    publicProjects?: any[];
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

  const handleOpenEmailDialog = (replyToSubject?: string, messageId?: string, threadId?: string, sentTo?: string[]) => {
    // Réinitialiser les IDs de réponse si ce n'est pas une réponse directe
    if (!replyToSubject) {
      setReplyToMessageId(null);
      setReplyToThreadId(null);
    }
    
    // Si un sujet est passé (bouton Répondre de l'historique), on l'utilise directement
    if (replyToSubject) {
      // Gérer les réponses multiples (Re:, Re2:, Re3:, etc.)
      const subjectWithReply = getNextReplyPrefix(replyToSubject);

      setEmailForm(prev => ({
        ...prev,
        to: sentTo && sentTo.length > 0 ? sentTo.join(', ') : prev.to,
        subject: subjectWithReply,
        message: aiReport || 'Voici une mise à jour de mon delivery.'
      }));
      if (messageId) {
        setReplyToMessageId(messageId);
      }
      if (threadId) {
        setReplyToThreadId(threadId);
      }
    } else if (report) {
      // Sinon on génère le sujet par défaut
      const formatDateShort = (date: Date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}.${m}.${y}`;
      };

      // Utiliser le sujet par défaut des paramètres avec remplacement des tokens
      const defaultSubjectTemplate = state.emailSettings?.defaultSubject || 'Delivery du %dd au %df';
      const period = defaultSubjectTemplate
        .replace('%dd', formatDateShort(report.startDate))
        .replace('%df', formatDateShort(report.endDate));

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
      projectIds: selectedProjectIds.length > 0 ? selectedProjectIds : state.projects.filter(p => p.status === 'active' && (state.appSettings.followedProjects?.includes(p.id) ?? true)).map(p => p.id),
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

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    const fileName = `Rapport_${formatDate(report.startDate)}_au_${formatDate(report.endDate)}.txt`;

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

    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setEmailStatus({ type: 'success', message: 'Rapport téléchargé (.txt) !' });
    setTimeout(() => setEmailStatus({ type: null, message: '' }), 3000);
  };

  const handleDownloadMarkdown = () => {
    const reportContent = editedReport || aiReport;
    if (!reportContent || !report) return;

    const formatDate = (date: Date) => {
      const d = date.getDate().toString().padStart(2, '0');
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const y = date.getFullYear();
      return `${d}-${m}-${y}`;
    };

    const fileName = `Rapport_${formatDate(report.startDate)}_au_${formatDate(report.endDate)}.md`;

    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setEmailStatus({ type: 'success', message: 'Rapport téléchargé (.md) !' });
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
          content: messageContent,
          publicProjects: report.publicProjects
        },
        state.users[0]
      );

      // Détecter le provider choisi dans les paramètres (priorité absolue au choix utilisateur)
      const chosenProvider = state.emailSettings.provider || 'emailjs';

      // Pour Gmail API : le sujet doit être préfixé par "Re: " pour être formellement
      // identifié comme réponse dans l'interface Web quand on se base uniquement sur threadId
      let emailSubject = emailForm.subject;
      if (replyToThreadId && !/^Re:\s*/i.test(emailSubject)) {
        emailSubject = `Re: ${emailSubject.replace(/^Re\d*:\s*/i, '').trim()}`;
      }

      const emailOptions: EmailOptions = {
        serviceId: state.emailSettings.serviceId,
        templateId: state.emailSettings.templateId,
        userId: state.emailSettings.userId,
        to: toEmails.join(', '),
        from: state.emailSettings?.fromEmail || 'noreply@gestion-projet.com',
        fromName: state.emailSettings?.fromName || 'Gestion de Projet',
        subject: emailSubject,
        html: emailContent,
        text: messageContent.replace(/<[^>]*>?/gm, ''),
        provider: chosenProvider,
        // On ne passe le token Google QUE si le client a explicitement choisi Gmail
        googleAccessToken: chosenProvider === 'google' ? state.googleAccessToken : undefined,
        threadId: replyToThreadId,
        inReplyTo: replyToMessageId, // On passe toujours notre custom ID (fallback pour Gmail, requis pour emailjs)
        templateParams: {
          to_emails: toEmails,
          to_name: toEmails[0].split('@')[0],
          from_name: state.emailSettings?.fromName || 'Gestion de Projet',
          from_email: state.emailSettings?.fromEmail || 'noreply@gestion-projet.com',
          subject: emailSubject,
          message: messageContent,
          content: emailContent,
          title: emailSubject,
          user_name: state.users[0]?.name || 'Utilisateur',
        }
      };

      const result = await EmailService.sendEmail(emailOptions, state.emailSettings);

      if (result.success) {
        setEmailStatus({ type: 'success', message: `Email envoyé avec succès à ${toEmails.length} destinataire(s) !` });

        // IMPORTANT : On sauvegarde TOUJOURS le threadId réel retourné par Gmail.
        // C'est lui qui permet à Gmail de regrouper les emails dans le même fil.
        // result.messageId = notre Message-ID RFC 2822 généré (pour les futures In-Reply-To)
        // result.threadId = le threadId réel de Gmail (pour les futures requêtes API)
        const savedMessageId = result.messageId; // Notre Message-ID RFC 2822
        const savedThreadId = result.threadId;   // Le threadId réel de Gmail

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
            projectIds: selectedProjectIds.length > 0 ? selectedProjectIds : state.projects.filter(p => p.status === 'active' && (state.appSettings.followedProjects?.includes(p.id) ?? true)).map(p => p.id),
            type: (aiReport ? 'ai' : 'standard') as 'ai' | 'standard',
            metadata: {
              emailSent: true,
              lastSentTo: toEmails,
              emailSubject: emailForm.subject,
              messageId: savedMessageId ?? undefined,   // Message-ID RFC 2822 de cet envoi
              threadId: savedThreadId ?? undefined,     // threadId Gmail réel
              inReplyTo: replyToMessageId ?? undefined  // Message-ID auquel on a répondu
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
          setReplyToThreadId(null);
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
        const isFollowed = (state.appSettings.followedProjects?.includes(project.id) ?? true);
        return isSelected && isActive && isFollowed;
      })
      .map(project => {
        const allTasks = project.tasks || [];

        const completedMainTasks = allTasks
          .filter(task => task.status !== 'non-suivi')
          .filter((task): task is Task & { completedAt: string } => {
            if (task.status !== 'done' || !task.completedAt) return false;
            const taskCompletedDate = new Date(task.completedAt);
            return isDateInRange(taskCompletedDate, start, end);
          });

        const allCompletedSubTasks = allTasks
          .filter(task => task.status !== 'non-suivi')
          .flatMap(task => {
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

        const tasksWithCompletedSubTasks = allTasks
          .filter(task => task.status !== 'non-suivi')
          .map(task => {
            const subTasks = task.subTasks || [];
            const completedSubTasks = subTasks.filter((subTask): subTask is SubTask & { completedAt: string } => {
              if (!subTask.completed || !subTask.completedAt) return false;
              return isDateInRange(new Date(subTask.completedAt), start, end);
            });

            if (completedSubTasks.length > 0) {
              // Si la tâche principale est déjà terminée (dans completedMainTasks),
              // on ne l'ajoute pas ici pour éviter les doublons
              const alreadyIncluded = completedMainTasks.some(mt => mt.id === task.id);
              if (alreadyIncluded) return null;

              return {
                ...task,
                completedSubTasks: includeSubTasks ? completedSubTasks : [] // Liste vide si désactivé, mais tâche conservée
              };
            }
            return null;
          })
          .filter((task): task is Task & { completedSubTasks: (SubTask & { completedAt: string })[] } => task !== null);

        const upcomingTasks = allTasks
          .filter(task => task.status !== 'done' && task.status !== 'non-suivi')
          .sort((a, b) => {
            if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
            if (a.status !== 'in-progress' && b.status === 'in-progress') return 1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          })
          .slice(0, 5);

        const totalTasksCount = allTasks.filter(task => task.status !== 'non-suivi').length;
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
          isPublic: project.isPublic,
          source: project.source,
          completedTasks: totalCompletedTasks,
          completedSubTasks: totalCompletedSubTasks,
          totalTasks: totalTasksCount,
          tasks: reportTasks,
          upcomingTasks: upcomingTasks.map(task => ({
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            subTasks: task.subTasks
          }))
        };
      });

    const publicProjects = projectsData.filter(p => p.isPublic);

    setReport({
      startDate: start,
      endDate: end,
      projects: projectsData,
      publicProjects
    });
  };

  const generateAIReport = async (): Promise<void> => {
    if (!report || report.projects.length === 0) return;

    setIsGenerating(true);

    try {
      const project = state.projects[0];

      // Validation des données nécessaires
      if (!project) {
        throw new Error('Aucun projet trouvé dans les données.');
      }

      const projectAiSettings = project?.aiSettings;

      // Configuration pour les rapports IA (utilise les clés et modèles globaux)
      const finalAISettings: AISettings = {
        provider: projectAiSettings?.provider || state.appSettings.aiSettings?.provider || 'openrouter',
        openaiApiKey: projectAiSettings?.openaiApiKey || state.appSettings.aiSettings?.openaiApiKey || null,
        openrouterApiKey: projectAiSettings?.openrouterApiKey || state.appSettings.aiSettings?.openrouterApiKey || null,
        openaiModel: projectAiSettings?.openaiModel || state.appSettings.aiSettings?.openaiModel || 'gpt-3.5-turbo',
        openrouterModel: projectAiSettings?.openrouterModel || state.appSettings.aiSettings?.openrouterModel || 'meta-llama/llama-3.1-8b-instruct:free',
        maxTokens: 2500, // Augmenté pour éviter les rapports tronqués par la réflexion
        temperature: 0.1, // Minimum de créativité pour éviter les monologues
        isConfigured: true,
        lastTested: null,
        lastTestStatus: null,
        lastTestMessage: null
      };

      console.log('Configuration IA utilisée pour le rapport:', {
        provider: finalAISettings.provider,
        model: finalAISettings.provider === 'openai' ? finalAISettings.openaiModel : finalAISettings.openrouterModel,
        isDefault: !projectAiSettings
      });

      // Préparer les données réelles pour l'IA
      if (!report || !report.projects || report.projects.length === 0) {
        throw new Error('Aucune donnée de rapport disponible');
      }

      // Construire le contexte avec les données réelles
      let contexteRealData = `PÉRIODE DU RAPPORT: du ${report.startDate.toLocaleDateString('fr-FR')} au ${report.endDate.toLocaleDateString('fr-FR')}\n\n`;

      report.projects.forEach((prjData: any) => {
        contexteRealData += `PROJET: ${prjData.projectName}\n`;

        // Tâches actives (non terminées)
        const activeTasks = (prjData.tasks || []).filter((task: any) => task.status !== 'done' && task.status !== 'non-suivi');
        if (activeTasks.length > 0) {
          contexteRealData += `TÂCHES EN COURS:\n`;
          activeTasks.forEach((task: any) => {
            const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR') : '';
            const dateStr = dueDate ? ` (échéance le ${dueDate})` : '';
            contexteRealData += `- ${task.title}${dateStr}\n`;

            // Inclure les sous-tâches si présentes
            if (task.subTasks && task.subTasks.length > 0) {
              task.subTasks.forEach((st: any) => {
                const stStatus = st.completed ? '[x]' : '[ ]';
                contexteRealData += `  ${stStatus} ${st.title}\n`;
              });
            }
          });
        }

        // Tâches effectuées
        const performedTasks = (prjData.tasks || []).filter((task: any) => task.status === 'done');
        if (performedTasks.length > 0) {
          contexteRealData += `TÂCHES EFFECTUÉES:\n`;
          performedTasks.forEach((task: any) => {
            const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString('fr-FR') : '';
            const dateStr = completedDate ? ` (terminée le ${completedDate})` : '';
            contexteRealData += `- ${task.title}${dateStr}\n`;

            // Inclure les sous-tâches si présentes
            if (task.subTasks && task.subTasks.length > 0) {
              task.subTasks.forEach((st: any) => {
                const stStatus = st.completed ? '[x]' : '[ ]';
                contexteRealData += `  ${stStatus} ${st.title}\n`;
              });
            }
          });
        }

        // Tâches suivantes
        const upcoming = prjData.upcomingTasks || [];
        if (upcoming.length > 0) {
          contexteRealData += `TÂCHES SUIVANTES:\n`;
          upcoming.forEach((task: any) => {
            const statusLabel = task.status === 'in-progress' ? 'En cours' : 'À faire';
            const dueDateStr = task.dueDate ? ` (Échéance : ${new Date(task.dueDate).toLocaleDateString('fr-FR')})` : '';
            contexteRealData += `- ${task.title} [${statusLabel}]${dueDateStr}\n`;

            // Inclure les sous-tâches actives si présentes
            if (task.subTasks && task.subTasks.length > 0) {
              task.subTasks.forEach((st: any) => {
                const stStatus = st.completed ? '[x]' : '[ ]';
                contexteRealData += `  ${stStatus} ${st.title}\n`;
              });
            }
          });
        }
        contexteRealData += '\n';
      });

      const prompt = `Tu es un assistant professionnel. Ton rôle est de rédiger un rapport d'activité complet et bien structuré prêt à être envoyé par email. Ne fais AUCUNE phrase d'introduction ou de conclusion de ton côté (comme "Voici le rapport" ou "J'espère que ça vous plaît"). Commence directement par le contenu du rapport.

PÉRIODE DU RAPPORT : du ${report.startDate.toLocaleDateString('fr-FR')} au ${report.endDate.toLocaleDateString('fr-FR')}

Voici les DONNÉES BRUTES à utiliser :
${contexteRealData}

INSTRUCTIONS STRICTES :
1. Commence DIRECTEMENT le texte par "Bonjour," suivi d'une phrase d'introduction ("Veuillez trouver ci-dessous le bilan...").
2. Utilise le format Markdown avec les titres exacts suivants :
   # BILAN D'ACTIVITÉ OPÉRATIONNELLE
   ## RÉSUMÉ EXÉCUTIF (un bref résumé factuel de l'avancement)
   ## RÉALISATIONS MAJEURES (liste les projets et tâches terminées/en cours de manière textuelle)
   ## PROCHAINES ÉTAPES (liste les prochaines actions prévues)
3. Termine le rapport EXACTEMENT par "Je reste à votre disposition pour toute information complémentaire."
4. Ne mets ni balises HTML, ni balises inventées comme REPORT_START. Juste le texte brut avec le markdown.`;

      const aiResponse = await AIService.generateAiText(finalAISettings, prompt);

      // Nettoyage robuste
      let finalAiResponse = aiResponse.trim();

      // Enlever tout blabla pré-généré au début s'il y en a quand même
      finalAiResponse = finalAiResponse
        .replace(/^(Voici|D'après|Analysons|L'analyse|Bien sûr|Certainement|Oui|Voici le).*?\n/gi, '')
        .replace(/^\*.*?\*\n/, '') // enlever un potentiel "*Voici le rapport demandé :*"
        .trim();

      console.log('Réponse IA nettoyée:', finalAiResponse);

      // Si l'IA échoue, générer un rapport formaté basé sur les données réelles
      if (!finalAiResponse || finalAiResponse.length < 50 || finalAiResponse.includes('Erreur') || finalAiResponse.includes('error') || finalAiResponse.includes('Failed')) {
        console.warn('L\'IA a échoué, génération d\'un rapport à partir des données locales');

        let fallbackReport = `Bonjour,\n\nVeuillez trouver ci-dessous le bilan d'activité opérationnelle du ${report.startDate.toLocaleDateString('fr-FR')} au ${report.endDate.toLocaleDateString('fr-FR')}.\n\n`;
        fallbackReport += `# BILAN D'ACTIVITÉ OPÉRATIONNELLE\n\n`;
        fallbackReport += `## RÉSUMÉ EXÉCUTIF\nProgression régulière sur l'ensemble des projets avec réalisation des jalons prévus.\n\n`;

        report.projects.forEach((prj: any) => {
          fallbackReport += `### Projet : ${prj.projectName}\n`;
          fallbackReport += `#### Tâches effectuées\n`;
          prj.tasks.forEach((t: any) => {
            fallbackReport += `- [x] ${t.title}\n`;
            if (t.subTasks) {
              t.subTasks.forEach((st: any) => {
                fallbackReport += `  - [x] ${st.title}\n`;
              });
            }
          });

          if (prj.upcomingTasks && prj.upcomingTasks.length > 0) {
            fallbackReport += `\n#### Tâches suivantes\n`;
            prj.upcomingTasks.forEach((t: any) => {
              fallbackReport += `- [ ] ${t.title}\n`;
            });
          }
          fallbackReport += `\n`;
        });

        fallbackReport += `Je reste à votre disposition pour toute information complémentaire.\n`;
        finalAiResponse = fallbackReport.trim();
      }

      const currentUser = state.users[0];
      
      // Identifier les projets publics pour ajouter leurs liens
      const publicProjects = report.projects.filter((p: any) => p.isPublic);
      let publicLinksSection = '';
      
      if (publicProjects.length > 0) {
        publicLinksSection = `\n\n## LIENS DE CONSULTATION PUBLIQUE\n\n`;
        publicProjects.forEach((prj: any) => {
          const publicUrl = `${window.location.origin}${getBasePath()}/v?id=${prj.projectId}`;
          publicLinksSection += `- ${prj.projectName} : ${publicUrl}\n`;
        });
      }

      const signature = `\n\n---\nCordialement,\n\n${currentUser?.name || 'Responsable de Projet'}${currentUser?.position ? `, ${currentUser.position}` : ''}${currentUser?.department ? ` - ${currentUser.department}` : ''}`;

      const finalReportText = finalAiResponse + publicLinksSection + signature;
      setAiReport(finalReportText);
      setEditedReport(finalReportText);
      setIsEditing(false);
      return;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport IA:', error);

      let errorMessage = 'Désolé, une erreur technique a empêché la génération du rapport.';

      if (error instanceof Error) {
        // Afficher les détails de l'erreur pour le débogage
        console.error('Détails de l\'erreur:', error.message);
        console.error('Stack trace:', error.stack);

        // Message plus spécifique selon le type d'erreur
        if (error.message.includes('fetch')) {
          errorMessage = 'Erreur de connexion au service IA. Veuillez vérifier votre connexion internet.';
        } else if (error.message.includes('API')) {
          errorMessage = 'Erreur de l\'API IA. Veuillez vérifier votre configuration ou réessayer plus tard.';
        } else if (error.message.includes('clé') || error.message.includes('key')) {
          errorMessage = 'Problème avec la clé API. Veuillez vérifier votre configuration IA.';
        } else {
          errorMessage = `Erreur: ${error.message}`;
        }
      }

      errorMessage += '\n\nVeuillez vérifier votre connexion et votre configuration IA.';
      setAiReport(errorMessage);
      setEditedReport(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [dateRange, selectedProjectIds, state.projects, includeSubTasks]);

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

  const handleLoadReport = (reportEntry: ReportEntry) => {
    setSelectedReportId(reportEntry.id);
    setAiReport(reportEntry.content);
    setEditedReport(reportEntry.content);
    
    // Identifier les projets qui étaient dans ce rapport et sont encore publics
    const relevantProjects = (state.projects || []).filter(p => (reportEntry.projectIds || []).includes(p.id));
    const publicPrjsData = relevantProjects.filter(p => p.isPublic).map(p => ({
      projectId: p.id,
      projectName: p.name,
      isPublic: true
    }));

    setReport({
      startDate: new Date(reportEntry.period.start),
      endDate: new Date(reportEntry.period.end),
      projects: relevantProjects.map(p => ({ 
        projectId: p.id, 
        projectName: p.name,
        tasks: [],
        upcomingTasks: [],
        completedTasks: 0,
        completedSubTasks: 0,
        totalTasks: 0,
        isPublic: p.isPublic,
        source: p.source
      })),
      publicProjects: publicPrjsData
    });
    
    setSelectedProjectIds(reportEntry.projectIds || []);
    setActiveTab('generator');
  };

  return (
    <div className="space-y-2">
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
                    {state.projects.filter(p => p.status === 'active' && (state.appSettings.followedProjects?.includes(p.id) ?? true)).map(project => (
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
                {includeSubTasks ? <CheckCircle className="ml-2 h-4 w-4" /> : <X className="ml-2 h-4 w-4" />}
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
                    {project.tasks.filter((task: any) => task.status !== 'non-suivi').length > 0 ? (
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">Tâches effectuées</div>
                        {project.tasks.filter((task: any) => task.status !== 'non-suivi').map((task: any) => (
                          <div key={task.id} className={`p-3 border rounded-md transition-colors ${task.isMainTask ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-800'} hover:bg-gray-50 dark:hover:bg-gray-700`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  {task.status === 'done' ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
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
                                      <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
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

                    {project.upcomingTasks && project.upcomingTasks.filter((task: any) => task.status !== 'non-suivi').length > 0 && (
                      <div className="mt-6 space-y-3">
                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Tâches suivantes</div>
                        {project.upcomingTasks.filter((task: any) => task.status !== 'non-suivi').map((task: any) => (
                          <div key={task.id} className="p-3 border border-dashed rounded-md bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                    <span className="text-gray-400 text-[10px]">{task.status === 'in-progress' ? '→' : '○'}</span>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                    {task.title}
                                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${task.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                      {task.status === 'in-progress' ? 'En cours' : 'À faire'}
                                    </span>
                                  </div>
                                  {task.dueDate && (
                                    <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center mt-0.5 ml-0.5">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      Échéance : {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap opacity-70 ${task.priority === 'high' ? 'bg-red-100 text-red-800' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
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
              <div className="flex items-center justify-between flex-wrap mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Résumé du Rapport d'Activité</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {!isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleEditReport} disabled={isSendingEmail}><Edit className="w-4 h-4 mr-2" />Modifier</Button>
                      <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(aiReport)} disabled={isSendingEmail}><FileText className="w-4 h-4 mr-2" />Copier</Button>
                      <Button variant="outline" size="sm" onClick={handleSaveToHistory} disabled={isSendingEmail} className="text-blue-600 border-blue-200 hover:bg-blue-50"><Save className="w-4 h-4 mr-2" />Enregistrer</Button>
                      <Button variant="outline" size="sm" onClick={handleDownloadReport} disabled={isSendingEmail}><FileText className="w-4 h-4 mr-2" />Texte (.txt)</Button>
                      <Button variant="outline" size="sm" onClick={handleDownloadMarkdown} disabled={isSendingEmail}><FileText className="w-4 h-4 mr-2" />Markdown (.md)</Button>
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
                            checked={!replyToMessageId}
                            onChange={() => {
                              setReplyToMessageId(null);
                              setReplyToThreadId(null);
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
                            checked={!!replyToMessageId}
                            onChange={() => {
                              // Prendre le sujet du dernier rapport envoyé avec un messageId
                              const lastSentReport = [...state.reports].reverse().find(r => r.metadata?.messageId);
                              if (lastSentReport) {
                                setEmailForm(prev => ({ 
                                  ...prev, 
                                  subject: lastSentReport.title,
                                  to: lastSentReport.metadata?.lastSentTo && lastSentReport.metadata.lastSentTo.length > 0 
                                      ? lastSentReport.metadata.lastSentTo.join(', ') 
                                      : prev.to
                                }));
                                setReplyToMessageId(lastSentReport.metadata?.messageId || null);
                                setReplyToThreadId(lastSentReport.metadata?.threadId || null);
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
                              setReplyToThreadId(matched.metadata.threadId || null);
                              
                              // Mettre à jour les destinataires aussi si le sujet change
                              if (matched?.metadata?.lastSentTo && matched.metadata.lastSentTo.length > 0) {
                                setEmailForm(prev => ({ ...prev, subject: subj, to: matched.metadata!.lastSentTo!.join(', ') }));
                              } else {
                                setEmailForm(prev => ({ ...prev, subject: subj }));
                              }
                            } else {
                              setReplyToMessageId(null);
                              setReplyToThreadId(null);
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
                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />{new Date(reportEntry.generatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        <span>Période : {new Date(reportEntry.period.start).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} - {new Date(reportEntry.period.end).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                      </div>
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 italic">{reportEntry.content.substring(0, 150)}...</div>
                      {reportEntry.metadata?.emailSent && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded"><CheckCircle className="w-3 h-3 mr-1" />Envoyé par email</div>
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] text-blue-600" onClick={(e: any) => { e.stopPropagation(); handleLoadReport(reportEntry); setTimeout(() => handleOpenEmailDialog(reportEntry.metadata.emailSubject, reportEntry.metadata.messageId, reportEntry.metadata.threadId, reportEntry.metadata.lastSentTo), 100); }}>
                            <Send className="w-3 h-3 mr-1" />Répondre (Fil)
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={(e: any) => handleDeleteReport(reportEntry.id, e)}><X className="w-4 h-4" /></Button>
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
