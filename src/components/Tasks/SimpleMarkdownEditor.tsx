import React, { useState } from 'react';
import { Eye, Edit2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SimpleMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

// Fonction pour nettoyer le markdown mal formé
const cleanMarkdown = (text: string): string => {
  if (!text) return text;
  
  return text
    .replace(/\*\*\*+/g, '**')
    .replace(/\*\*(.*?)\*\*/g, '**$1**')
    .replace(/\*\*([^*]*?)\*\*/g, '**$1**');
};

export function SimpleMarkdownEditor({ 
  value, 
  onChange, 
  placeholder = "Entrez votre texte en markdown...",
  height = 200 
}: SimpleMarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      {/* En-tête avec boutons */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-300 dark:border-gray-600">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              !isPreview 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Edit2 className="w-3 h-3" />
            Éditer
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              isPreview 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Eye className="w-3 h-3" />
            Aperçu
          </button>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Markdown
        </span>
      </div>

      {/* Contenu */}
      <div style={{ height: `${height}px` }}>
        {isPreview ? (
          /* Mode aperçu */
          <div className="p-3 overflow-y-auto h-full bg-white dark:bg-gray-900">
            <div className="markdown-body prose dark:prose-invert max-w-none text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {value || "*Aucun contenu*"}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          /* Mode édition */
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full p-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-0 resize-none focus:outline-none text-sm font-mono"
            style={{ minHeight: `${height}px` }}
          />
        )}
      </div>

      {/* Barre d'outils rapide */}
      {!isPreview && (
        <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-t border-gray-300 dark:border-gray-600">
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            <span>**gras**</span>
            <span>*italique*</span>
            <span>`code`</span>
            <span># titre</span>
            <span>- liste</span>
          </div>
        </div>
      )}
    </div>
  );
}
