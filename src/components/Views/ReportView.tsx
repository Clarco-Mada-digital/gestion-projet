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

interface TaskReport {
  projectId: string;
  projectName: string;
  completedTasks: number;
  totalTasks: number;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    completedAt?: string;
    priority: string;
    assignees: string[];
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

  // Générer le rapport
  const generateReport = () => {
    const { start, end } = getDateRange(dateRange);
    
    // Filtrer les tâches par période et par projet
    const projectsData = (state.projects || [])
      .filter(project => selectedProjectId === 'all' || project.id === selectedProjectId)
      .map(project => {
        const tasks = (project.tasks || []).filter(task => {
          const taskDate = task.completedAt ? new Date(task.completedAt) : null;
          return (
            task.status === 'done' &&
            taskDate &&
            taskDate >= start &&
            taskDate <= end
          );
        });
        
        const totalTasks = project.tasks?.length || 0;
        
        return {
          projectId: project.id,
          projectName: project.name,
          completedTasks: tasks.length,
          totalTasks,
          tasks: tasks.map(task => ({
            id: task.id,
            title: task.title,
            status: task.status,
            completedAt: task.completedAt,
            priority: task.priority,
            assignees: task.assignees
          }))
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
    if (!report || report.projects.length === 0) return;
    
    setIsGenerating(true);
    
    try {
      const project = state.projects[0]; // Utiliser le premier projet pour les paramètres IA
      const projectAiSettings = project?.aiSettings;
      const appAiSettings = state.appSettings?.aiSettings;
      
      // Créer un objet de paramètres IA complet
      const aiSettings = {
        ...appAiSettings,
        ...projectAiSettings,
        // S'assurer que les champs requis sont présents
        isConfigured: appAiSettings?.isConfigured || false,
        lastTested: appAiSettings?.lastTested || '',
        lastTestStatus: appAiSettings?.lastTestStatus || '',
        lastTestMessage: appAiSettings?.lastTestMessage || ''
      } as const;
      
      if (!aiSettings) {
        throw new Error('Paramètres IA non configurés');
      }
      
      // Préparer un résumé des tâches pour le prompt
      const tasksSummary = report.projects.flatMap(project => 
        project.tasks.map(task => ({
          project: project.projectName,
          title: task.title,
          completedAt: task.completedAt ? new Date(task.completedAt).toLocaleDateString('fr-FR') : 'Date inconnue',
          priority: task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse',
          notes: task.notes || ''
        }))
      );
      
      const currentUser = state.users[0]; // Utilisateur actuel
      const userInfo = [
        currentUser.name,
        currentUser.position,
        currentUser.department,
        currentUser.email,
        currentUser.phone
      ].filter(Boolean).join(' | ');
      
      const prompt = `Génère un rapport d'activité professionnel pour la période du ${report.startDate.toLocaleDateString('fr-FR')} au ${report.endDate.toLocaleDateString('fr-FR')}.

Tâches terminées (${tasksSummary.length} au total):
${tasksSummary.map((t, i) => `${i + 1}. [${t.priority}] ${t.title} (${t.project}) - Terminé le ${t.completedAt}${t.notes ? `\n   Notes: ${t.notes}` : ''}`).join('\n')}

Rédige un résumé professionnel des réalisations, en mettant en avant les points clés et les réalisations marquantes. 

Inclus une conclusion et des perspectives pour la période suivante.

Signature (à inclure à la fin):
${userInfo}`;
      
      // Utiliser la méthode générique de génération de texte
      const response = await AIService.generateText(prompt, aiSettings);
      setAiReport(response);
      setEditedReport(response); // Initialiser le rapport édité
      setIsEditing(false); // Sortir du mode édition si on régénère
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
  
  // Déclaration de la fonction manquante handleGenerateAIReport
  const handleGenerateAIReport = async () => {
    try {
      setIsGenerating(true);
      await generateAIReport();
    } catch (error) {
      console.error('Erreur lors de la génération du rapport IA:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Rapport d'Activité</h1>
        <div className="flex items-center gap-2">
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
            {state.projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          
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
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium">{project.projectName}</h3>
                  <div className="text-sm text-gray-500">
                    {project.completedTasks} tâche{project.completedTasks > 1 ? 's' : ''} sur {project.totalTasks} terminée{project.totalTasks > 1 ? 's' : ''}
                  </div>
                </div>
                
                {project.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {project.tasks.map(task => (
                      <div key={task.id} className="flex items-center p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium">{task.title}</div>
                          <div className="text-xs text-gray-500">
                            Terminé le {task.completedAt ? new Date(task.completedAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                          </div>
                        </div>
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
