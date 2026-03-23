import React, { useState, useRef } from 'react';
import {
  Lightbulb,
  Target,
  Rocket,
  Layout,
  Cpu,
  DollarSign,
  AlertCircle,
  Download,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  Sparkles,
  ShieldCheck,
  Zap,
  History,
  Plus,
  Trash2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/aiService';
import { Button } from '../UI/Button';
import { message } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface VisionData {
  projectName: string;
  description: string;
  objectives: string;
  targetAudience: string;
  features: string;
  constraints: string;
  logo?: string; // Base64 or URL
}

interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  content?: string;
}

export function VisionView() {
  const { state, dispatch } = useApp();
  const [step, setStep] = useState(state.visionDossiers?.length > 0 ? 0 : 1); // 0 pour Historique si existe, sinon nouveau projet
  const [formData, setFormData] = useState<VisionData>({
    projectName: '',
    description: '',
    objectives: '',
    targetAudience: '',
    features: '',
    constraints: ''
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([
    { id: 'strategy', label: 'Analyse Stratégique & Vision', status: 'pending' },
    { id: 'branding', label: 'Charte Graphique & Identité', status: 'pending' },
    { id: 'tech', label: 'Architecture & Stack Technique', status: 'pending' },
    { id: 'planning', label: 'Planning & Budget Prévisionnel', status: 'pending' },
    { id: 'roadmap', label: 'Roadmap Détaillée & Prochaines Étapes', status: 'pending' }
  ]);
  const [finalDocument, setFinalDocument] = useState<string>('');
  const [summaryData, setSummaryData] = useState({
    complexity: 'Moyenne',
    techStack: 'Next.js / Firebase',
    duration: '3 - 5 mois',
    budget: '15k€ - 30k€'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setFormData(prev => ({ ...prev, logo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateStepStatus = (id: string, status: GenerationStep['status'], content?: string) => {
    setGenerationSteps(prev => prev.map(s =>
      s.id === id ? { ...s, status, content: content || s.content } : s
    ));
  };

  const generateFullDocument = async () => {
    if (!formData.description) return;

    setStep(3);

    let fullContent = `# Dossier de Vision de Projet : ${formData.projectName || 'Nouveau Projet'}\n\n`;
    fullContent += `> **NOTE BETA** : Ce document est une proposition générée par IA. Il ne remplace pas l'expertise d'une agence de développement ou d'un consultant professionnel. Utilisez-le comme guide pour vos discussions avec des experts.\n\n`;

    try {
      // Étape 1 : Stratégie
      updateStepStatus('strategy', 'loading');
      const strategyPrompt = `Analyse stratégique pour le projet "${formData.projectName}". 
      Description: ${formData.description}
      Objectifs: ${formData.objectives}
      Cible: ${formData.targetAudience}
      Structure la réponse avec : Vision globale, Analyse du besoin, Facteurs clés de succès.`;

      const strategyResult = await AIService.generateAiText(state.appSettings.aiSettings, strategyPrompt, true);
      updateStepStatus('strategy', 'completed', strategyResult);
      fullContent += `## 1. Vision & Stratégie\n${strategyResult}\n\n`;

      // Étape 2 : Branding (Charte Graphique)
      updateStepStatus('branding', 'loading');
      const brandingPrompt = `Propose une charte graphique et une identité visuelle pour le projet "${formData.projectName}". 
      Description: ${formData.description}
      Donne : Palette de couleurs (avec codes HEX), Typographies (Titres et Corps), Univers visuel (ambiance, style d'icônes).`;

      const brandingResult = await AIService.generateAiText(state.appSettings.aiSettings, brandingPrompt, true);
      updateStepStatus('branding', 'completed', brandingResult);
      fullContent += `## 2. Charte Graphique & Identité\n${brandingResult}\n\n`;

      // Étape 3 : Technique
      updateStepStatus('tech', 'loading');
      const techPrompt = `Recommandation technique pour le projet "${formData.projectName}". 
      Fonctionnalités: ${formData.features}
      Contraintes: ${formData.constraints}
      Recommande une Stack Technique (Frontend, Backend, BDD, Hébergement) et explique pourquoi ce sont les meilleurs choix.`;

      const techResult = await AIService.generateAiText(state.appSettings.aiSettings, techPrompt, true);
      updateStepStatus('tech', 'completed', techResult);
      fullContent += `## 3. Architecture & Stack Technique\n${techResult}\n\n`;

      // Étape 4 : Planning & Budget
      updateStepStatus('planning', 'loading');
      const planningPrompt = `Estimation de temps et de budget pour le projet "${formData.projectName}". 
      Fonctionnalités: ${formData.features}
      Donne : Estimation du temps de développement global, Découpage par phases majeures, Fourchette de budget approximative (Min - Max) basée sur les tarifs du marché.`;

      const planningResult = await AIService.generateAiText(state.appSettings.aiSettings, planningPrompt, true);
      updateStepStatus('planning', 'completed', planningResult);
      fullContent += `## 4. Planning & Budget Prévisionnel\n${planningResult}\n\n`;

      // Étape 5 : Roadmap
      updateStepStatus('roadmap', 'loading');
      const roadmapPrompt = `Roadmap détaillée et prochaines étapes pour le projet "${formData.projectName}". 
      Comment passer de l'idée à la réalité ? Détaille les étapes : MVP (Minimum Viable Product), Phase de test, Lancement.`;

      const roadmapResult = await AIService.generateAiText(state.appSettings.aiSettings, roadmapPrompt, true);
      updateStepStatus('roadmap', 'completed', roadmapResult);
      fullContent += `## 5. Roadmap & Prochaines Étapes\n${roadmapResult}\n\n`;

      // Nouvelle étape : Génération de la synthèse cohérente
      const finalSummaryPrompt = `Basé STRICTEMENT sur le document suivant, remplis les champs JSON demandés.
      SI le texte mentionne un prix (ex: 500€, 1000-2000€), mets-le dans "budget". Sinon mets "À définir".
      SI le texte mentionne une durée (ex: 3 mois, 2 semaines), mets-la dans "duration". Sinon mets "À estimer".
      L'objet DOIT être un JSON valide : {"complexity": "...", "techStack": "...", "duration": "...", "budget": "..."}
      
      TEXTE :\n${fullContent.substring(0, 4000)}`;
      
      const summaryResult = await AIService.generateAiText(state.appSettings.aiSettings, finalSummaryPrompt);
      // Tentative de parsing du JSON plus robuste
      try {
        const jsonMatch = summaryResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const newSummary = {
            complexity: parsed.complexity || 'Moyenne',
            techStack: parsed.techStack || 'Standards Web',
            duration: parsed.duration || 'À estimer',
            budget: parsed.budget || 'À définir'
          };
          setSummaryData(newSummary);
          
          // Sauvegarder dans l'historique avec la bonne synthèse
          const newDossier = {
            id: uuidv4(),
            projectName: formData.projectName,
            description: formData.description,
            objectives: formData.objectives,
            targetAudience: formData.targetAudience,
            features: formData.features,
            constraints: formData.constraints,
            logo: formData.logo,
            fullContent,
            summaryData: newSummary,
            createdAt: new Date().toISOString()
          };
          
          dispatch({ type: 'ADD_VISION_DOSSIER', payload: newDossier });
        }
      } catch (e) {
        console.warn("Erreur parsing synthèse IA:", e);
      }

      setFinalDocument(fullContent);
      setStep(4);
    } catch (error) {
      console.error('Erreur lors de la génération du document:', error);
    }
  };

  const clearForm = () => {
    setFormData({
      projectName: '',
      description: '',
      objectives: '',
      targetAudience: '',
      features: '',
      constraints: '',
      logo: undefined
    });
    setFinalDocument('');
    setSummaryData({
      complexity: 'Moyenne',
      techStack: 'Standards Web',
      duration: 'À estimer',
      budget: 'À définir'
    });
    setStep(1);
  };

  const exportAsMarkdown = () => {
    const element = document.createElement("a");
    const file = new Blob([finalDocument], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `Vision_${formData.projectName.replace(/\s+/g, '_') || 'Projet'}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateHTMLReport = (isForPrint = false) => {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vision de Projet - ${formData.projectName || 'Dossier'}</title>
      <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: ${isForPrint ? 'white' : '#f8fafc'}; color: #1e293b; -webkit-print-color-adjust: exact; line-height: 1.6; }
        .prose h1 { color: #1e40af; font-weight: 800; border-bottom: 4px solid #3b82f6; padding-bottom: 0.75rem; margin-top: 3rem; }
        .prose h2 { color: #0f172a; font-weight: 700; border-left: 6px solid #1e40af; padding-left: 1.25rem; margin-top: 2.5rem; margin-bottom: 1.25rem; background: #f1f5f9; padding-top: 0.5rem; padding-bottom: 0.5rem; border-radius: 0 0.5rem 0.5rem 0; }
        .prose h3 { color: #2563eb; font-weight: 600; margin-top: 1.75rem; }
        .page-header { background: linear-gradient(135deg, #0f172a 0%, #1e40af 100%); color: white; padding: 6rem 2rem; border-radius: 0 0 4rem 4rem; margin-bottom: 5rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2); }
        .content-card { background: white; border-radius: 2.5rem; padding: 5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1); margin-top: -4rem; border: 1px solid #f1f5f9; }
        @media print {
          body { background: white; }
          .content-card { box-shadow: none; border: none; margin-top: 0; padding: 0.5cm; }
          .page-header { border-radius: 0; margin-bottom: 2rem; padding: 3rem; background: #0f172a !important; }
          .no-print { display: none; }
          @page { margin: 1.5cm; }
        }
      </style>
    </head>
    <body class="min-h-screen pb-32">
      <header class="page-header text-center">
        <div class="max-w-6xl mx-auto">
          <h1 class="text-6xl font-black mb-4 tracking-tighter">${formData.projectName || 'Vision de Projet'}</h1>
          <p class="text-blue-300 opacity-90 uppercase tracking-[0.3em] font-black text-xs">Analyse & Stratégie Opérationnelle</p>
          <div class="mt-10 flex items-center justify-center gap-6 text-sm text-blue-200/60">
            <span class="bg-blue-900/40 px-3 py-1 rounded-full border border-blue-400/20">Édition Premium IA</span>
            <span>•</span>
            <span>${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </header>
      
      <main class="max-w-6xl mx-auto px-8">
        <div class="content-card">
          <div id="content" class="prose prose-blue lg:prose-lg max-w-none">
            <!-- Rendu Markdown par marked.js -->
          </div>
        </div>
        
        <footer class="mt-12 text-center text-gray-400 text-xs italic">
          Nexus IA - Ce document est une proposition stratégique générée par intelligence artificielle.
        </footer>
      </main>

      <script>
        const markdown = \`${finalDocument.replace(/`/g, '\\`').replace(/\$/g, '&#36;')}\`;
        document.getElementById('content').innerHTML = marked.parse(markdown);
        ${isForPrint ? 'window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }' : ''}
      </script>
    </body>
    </html>
    `;
  };

  const exportAsHTML = () => {
    const htmlContent = generateHTMLReport(false);
    const element = document.createElement("a");
    const file = new Blob([htmlContent], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `Vision_${(formData.projectName || 'Projet').replace(/\s+/g, '_')}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const exportAsPDF = () => {
    const htmlContent = generateHTMLReport(true);
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      message.error("Veuillez autoriser les popups pour l'exportation PDF");
    }
  };

  const loadFromHistory = (dossier: any) => {
    // 1. Restaurer les données du formulaire
    setFormData({
      projectName: dossier.projectName,
      description: dossier.description || '',
      objectives: dossier.objectives || '',
      targetAudience: dossier.targetAudience || '',
      features: dossier.features || '',
      constraints: dossier.constraints || '',
      logo: dossier.logo
    });

    // 2. Essayer de découper le fullContent pour recréer les steps
    // On cherche les titres de niveau 2 pour s'aligner sur la structure habituelle
    const sections = dossier.fullContent.split(/## \d+\. /).filter(Boolean);
    const mockSteps: GenerationStep[] = [
      { id: 'vision', label: 'Visions & Objectifs', status: 'completed', content: sections[0] || '' },
      { id: 'features', label: 'Fonctionnalités & UX', status: 'completed', content: sections[1] || '' },
      { id: 'stack', label: 'Architecture & Stack', status: 'completed', content: sections[2] || '' },
      { id: 'planning', label: 'Planning & Budget', status: 'completed', content: sections[3] || '' },
      { id: 'roadmap', label: 'Roadmap & Étapes', status: 'completed', content: sections[4] || '' },
    ];
    setGenerationSteps(mockSteps);
    
    setFinalDocument(dossier.fullContent);
    setSummaryData(dossier.summaryData);
    setStep(4);
  };

  const deleteDossier = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Supprimer ce dossier de vision ?')) {
      dispatch({ type: 'DELETE_VISION_DOSSIER', payload: id });
    }
  };

  return (
    <div className="max-w-8xl mx-auto px-4 py-8">
      {/* Style d'impression professionnel */}
      {/* The local @media print style block has been removed as per instructions. */}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Assistant Vision</h1>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">Beta</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep(step === 0 ? 1 : 0)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${step === 0
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-500 hover:text-blue-600 border border-gray-100 dark:border-gray-700'
                }`}
            >
              <History className="w-3.5 h-3.5" />
              Historique
            </button>
            <button
              onClick={clearForm}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${step >= 1 && step < 4
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-500 hover:text-blue-600 border border-gray-100 dark:border-gray-700'
                }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Nouveau Dossier
            </button>
          </div>
        </div>

        {step === 4 && (
          <div className="flex gap-2">
            <Button onClick={exportAsMarkdown} variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Markdown
            </Button>
            <Button onClick={exportAsHTML} variant="outline" size="sm">
              <Layout className="w-4 h-4 mr-2" />
              HTML
            </Button>
            <Button onClick={exportAsPDF} variant="gradient" className="shadow-lg">
              <Download className="w-4 h-4 mr-2" />
              Exporter en PDF
            </Button>
          </div>
        )}
      </div>

      {/* Beta Disclaimer - Always visible or prominent at start */}
      {step < 4 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 mb-8 flex gap-4 items-start shadow-sm">
          <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-xl text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-1">Note Importante (BETA)</h4>
            <p className="text-sm text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
              Cet outil est une aide à la conception. Les analyses, coûts et délais sont des **propositions générées par intelligence artificielle** basées sur vos descriptions. Cette plateforme ne remplace en aucun cas l'expertise de professionnels ou de boîtes de développement. Elle est là pour vous donner un aperçu et un chemin à suivre avant de consulter des experts pour finaliser votre projet.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[500px] flex flex-col">

        {/* Progress Bar (Visual) */}
        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="p-8 flex-1 flex flex-col">
          <AnimatePresence mode="wait">

            {/* STEP 0: History */}
            {step === 0 && (
              <motion.div
                key="history"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold dark:text-white">Mes Anciens Dossiers</h2>
                </div>

                {state.visionDossiers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 dark:bg-gray-900/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <History className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">Aucun dossier généré pour le moment.</p>
                    <Button onClick={() => setStep(1)} variant="outline" className="mt-4">
                      Commencer mon premier dossier
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {state.visionDossiers.map(dossier => (
                      <div
                        key={dossier.id}
                        onClick={() => loadFromHistory(dossier)}
                        className="group relative bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900/50 transition-all cursor-pointer overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <button
                            onClick={(e) => deleteDossier(e, dossier.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <h3 className="text-lg font-bold dark:text-white mb-1 line-clamp-1">{dossier.projectName}</h3>
                        <p className="text-xs text-gray-500 mb-4">{new Date(dossier.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-400 rounded-md">
                            {dossier.summaryData.techStack.split('/')[0]}
                          </span>
                          <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-[10px] font-bold text-blue-600 dark:text-blue-400 rounded-md">
                            {dossier.summaryData.budget}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 1: Basis */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold dark:text-white">L'Essence de votre Idée</h2>
                    <p className="text-sm text-gray-500">Commençons par les bases du projet.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nom du Projet</label>
                      <input
                        type="text"
                        name="projectName"
                        value={formData.projectName}
                        onChange={handleInputChange}
                        placeholder="Ex: Mon Application de Fitness"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description Globale</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={6}
                        placeholder="Décrivez votre idée en quelques phrases. Quel problème résolvez-vous ? Que fait l'application ?"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Objectifs principaux</label>
                      <textarea
                        name="objectives"
                        value={formData.objectives}
                        onChange={handleInputChange}
                        placeholder="Quels sont les résultats attendus ? (Ex: Avoir 1000 utilisateurs, Automatiser la gestion...)"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Logo (Optionnel)</label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="relative h-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all overflow-hidden"
                      >
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain p-2" />
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                            <span className="text-xs text-gray-400">Cliquez pour ajouter votre logo</span>
                          </>
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleLogoUpload}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!formData.projectName || !formData.description}
                    variant="gradient"
                    className="px-8"
                  >
                    Suivant
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold dark:text-white">Détails & Fonctionnalités</h2>
                    <p className="text-sm text-gray-500">Affinez votre vision pour une meilleure analyse.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Public Cible</label>
                    <textarea
                      name="targetAudience"
                      value={formData.targetAudience}
                      onChange={handleInputChange}
                      placeholder="À qui s'adresse ce projet ? (Âge, métier, besoins spécifiques...)"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Fonctionnalités Clés</label>
                    <textarea
                      name="features"
                      value={formData.features}
                      onChange={handleInputChange}
                      placeholder="Listez les choses essentielles que l'utilisateur pourra faire."
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      rows={4}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Contraintes (Budget, Temps, Technique)</label>
                    <textarea
                      name="constraints"
                      value={formData.constraints}
                      onChange={handleInputChange}
                      placeholder="Avez-vous des restrictions ? (Ex: Petit budget, doit être prêt en 2 mois, utiliser uniquement du React...)"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button onClick={() => setStep(1)} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                  <Button onClick={generateFullDocument} variant="gradient" className="px-8 shadow-blue-500/20">
                    Générer mon Dossier de Vision
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Generation Progress */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="relative mb-12">
                  <div className="w-32 h-32 border-4 border-blue-100 dark:border-blue-900/30 rounded-full flex items-center justify-center">
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold dark:text-white mb-2">Génération de votre dossier...</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-10">L'IA analyse vos informations et construit un plan complet pour votre projet. Cela peut prendre une minute.</p>

                <div className="w-full max-w-lg space-y-4">
                  {generationSteps.map((s, index) => (
                    <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${s.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                          s.status === 'loading' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                            'bg-gray-100 dark:bg-gray-800 text-gray-400'
                          }`}>
                          {index === 0 ? <Target className="w-4 h-4" /> :
                            index === 1 ? <Layout className="w-4 h-4" /> :
                                index === 2 ? <Cpu className="w-4 h-4" /> :
                                index === 3 ? <DollarSign className="w-4 h-4" /> :
                                  <Rocket className="w-4 h-4" />}
                        </div>
                        <span className={`text-sm font-medium ${s.status === 'loading' ? 'text-blue-600 dark:text-blue-400' : 'dark:text-gray-300'}`}>{s.label}</span>
                      </div>

                      {s.status === 'loading' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                      {s.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {s.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-gray-200 dark:border-gray-700" />}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 4: Result */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm border border-green-200 dark:border-green-800">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold dark:text-white">Votre Dossier est Prêt !</h2>
                      <p className="text-sm text-gray-500">Voici un guide complet pour lancer votre projet.</p>
                    </div>
                  </div>
                  <Button onClick={() => setStep(1)} variant="outline" size="sm">
                    Recommencer
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Result document */}
                  <div id="vision-result-content" className="lg:col-span-2 space-y-8 prose dark:prose-invert max-w-none print:bg-white print:text-black print:p-0">
                    {/* Header invisible sauf impression */}
                    <div className="hidden print:block mb-8 border-b-2 border-blue-600 pb-6">
                      <h1 className="text-4xl font-bold text-blue-800 mb-2 uppercase tracking-tighter">{formData.projectName}</h1>
                      <p className="text-gray-600">Dossier de Vision de Projet - Généré par Assistant Vision IA</p>
                    </div>

                    {generationSteps.map((s, index) => (
                      <div key={s.id} className="bg-gray-50/50 dark:bg-gray-900/20 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 group hover:border-blue-200 dark:hover:border-blue-800 transition-all print:bg-transparent print:border-none print:p-0 print:mb-12 break-inside-avoid">
                        <div className="flex items-center gap-2 mb-6 text-blue-600 dark:text-blue-400 opacity-60 print:hidden">
                          <span className="text-xs font-black uppercase tracking-widest">Étape {index + 1}</span>
                          <div className="h-px flex-1 bg-current opacity-20" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 print:text-3xl print:text-blue-700">
                          <div className="print:hidden">
                            {index === 0 ? <Target className="w-6 h-6" /> :
                              index === 1 ? <Layout className="w-6 h-6" /> :
                                index === 2 ? <Cpu className="w-6 h-6" /> :
                                  index === 3 ? <DollarSign className="w-6 h-6" /> :
                                    <Rocket className="w-6 h-6" />}
                          </div>
                          {s.label}
                        </h3>
                        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed print:text-black">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {s.content || ''}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}

                    <div className="hidden print:block mt-20 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
                      Ce document est une proposition générée par IA et ne remplace pas une expertise professionnelle.
                    </div>
                  </div>

                  {/* Sidebar stats/disclaimer */}
                  <div className="space-y-6">
                    <div className="sticky top-8 space-y-6">
                      {/* Recap Card */}
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl">
                        <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Synthèse Rapide
                        </h4>
                        <div className="space-y-4 text-blue-50">
                          <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                            <span>Complexité</span>
                            <span className="font-bold">{summaryData.complexity}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                            <span>Tech conseillée</span>
                            <span className="font-bold">{summaryData.techStack}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                            <span>Durée estimée</span>
                            <span className="font-bold">{summaryData.duration}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                            <span>Budget estimé</span>
                            <span className="font-bold">{summaryData.budget}</span>
                          </div>
                        </div>
                      </div>

                      {/* Reminder Card */}
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-3xl p-6">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3">
                          <AlertCircle className="w-5 h-5" />
                          <span className="font-bold uppercase text-[10px] tracking-widest">Conseil Professionnel</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                          "Ce document est une excellente base pour rédiger votre cahier des charges. Présentez-le à des agences ou des freelances pour obtenir des devis réels et affiner la faisabilité technique."
                        </p>
                      </div>

                      <div className="p-4 flex flex-col gap-3">
                        <button
                          onClick={exportAsPDF}
                          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                        >
                          <FileText className="w-4 h-4" />
                          Imprimer le dossier
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
