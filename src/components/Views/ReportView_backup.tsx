import React, { useState } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { useApp } from '../../context/AppContext';
import { AIService } from '../../services/aiService';

export function ReportView() {
  const { state } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string>('');
  const [editedReport, setEditedReport] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const generateAIReport = async (): Promise<void> => {
    setIsGenerating(true);

    try {
      const project = state.projects[0];
      
      if (!project) {
        throw new Error('Aucun projet trouvé dans les données.');
      }
      
      const projectAiSettings = project?.aiSettings;
      
      const finalAISettings: any = {
        provider: 'openrouter',
        openrouterApiKey: projectAiSettings?.openrouterApiKey || null,
        openrouterModel: 'google/gemma-7b-it:free',
        maxTokens: 800,
        temperature: 0.5,
        isConfigured: true
      };
      
      const prompt = `En tant que directeur de projet, rédige un rapport professionnel d'activité basé sur les tâches terminées récemment.

CONSIGNES IMPORTANTES:
- Style: Exécutif, professionnel, factuel
- Structure: TITRE PROFESSIONNEL + RÉSUMÉ EXÉCUTIF + RÉALISATIONS MAJEURES + PERSPECTIVES
- Maximum 300 mots
- Ne mentionne JAMAIS que tu es une IA
- Pas de "Voici le rapport" ou autres préambules
- Utilise des formulations professionnelles

Génère UNIQUEMENT le contenu du rapport, sans aucune réflexion interne.`;

      const aiResponse = await AIService.generateAiText(finalAISettings, prompt);

      if (!aiResponse || aiResponse.includes('Erreur') || aiResponse.includes('error')) {
        throw new Error('L\'IA n\'a pas pu générer le rapport.');
      }

      const currentUser = state.users[0];
      const userName = currentUser?.name || 'Responsable de Projet';
      const userPos = currentUser?.position ? ` ${currentUser?.position?.trim()}` : '';
      const userDept = currentUser?.department ? ` ${currentUser?.department?.trim()}` : '';

      const finalReport = `${aiResponse.trim()}

---

Cordialement,

${userName}${userPos}${userDept}`;

      setAiReport(finalReport);
      setEditedReport(finalReport);
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la génération du rapport IA:', error);
      const errorMessage = 'Désolé, une erreur technique a empêché la génération du rapport. Veuillez réessayer.';
      setAiReport(errorMessage);
      setEditedReport(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Générateur de Rapports</h1>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Générateur de rapports IA</span>
            </div>
          </div>

          <Button
            onClick={generateAIReport}
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
        </Card>

        {(aiReport || isEditing) && (
          <Card className="p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Modifier le rapport' : 'Rapport généré'}
              </h2>
              {isEditing && (
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      setEditedReport(aiReport);
                      setIsEditing(false);
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={() => {
                      setAiReport(editedReport);
                      setIsEditing(false);
                    }}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Sauvegarder
                  </Button>
                </div>
              )}
            </div>

            <textarea
              value={editedReport}
              onChange={(e) => setEditedReport(e.target.value)}
              readOnly={!isEditing}
              className="w-full h-96 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Le rapport généré apparaîtra ici..."
            />
          </Card>
        )}
      </div>
    </div>
  );
}
