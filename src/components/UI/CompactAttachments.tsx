import React, { useState, useRef } from 'react';
import { Plus, X as XIcon, Eye } from 'lucide-react';
import { Attachment } from '../../types';

interface CompactAttachmentsProps {
  attachments: Attachment[];
  isEditing: boolean;
  onAddFiles: (files: FileList) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  className?: string;
}

export function CompactAttachments({
  attachments,
  isEditing,
  onAddFiles,
  onRemoveAttachment,
  className = ''
}: CompactAttachmentsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAddFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return '🖼️';
      case 'document': return '📄';
      default: return '📎';
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case 'image': return 'text-green-600 dark:text-green-400';
      case 'document': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* En-tête compact */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Fichiers joints
        </span>
        {attachments.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {attachments.length} fichier{attachments.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          {/* Zone d'upload compacte */}
          <div
            className={`
              border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all
              ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,.doc,.docx,.txt,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Plus className="w-4 h-4" />
              <span>Ajouter des fichiers</span>
              <span className="text-gray-400">•</span>
              <span>Max 10MB</span>
            </div>
          </div>

          {/* Badges des fichiers */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="group inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-xs border border-gray-300 dark:border-gray-600 transition-colors cursor-pointer"
                  title={`${attachment.name} • ${(attachment.size / 1024).toFixed(1)} KB`}
                >
                  <span className={getFileColor(attachment.type)}>
                    {getFileIcon(attachment.type)}
                  </span>
                  <span className="max-w-24 truncate text-gray-700 dark:text-gray-300">
                    {attachment.name.length > 15 ? attachment.name.substring(0, 12) + '...' : attachment.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveAttachment(attachment.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all duration-200"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Mode lecture seule
        <div>
          {attachments.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-xs border border-gray-300 dark:border-gray-600 transition-colors cursor-pointer"
                  title={`${attachment.name} • ${(attachment.size / 1024).toFixed(1)} KB • Cliquez pour ouvrir`}
                >
                  <span className={getFileColor(attachment.type)}>
                    {getFileIcon(attachment.type)}
                  </span>
                  <span className="max-w-24 truncate text-gray-700 dark:text-gray-300">
                    {attachment.name.length > 15 ? attachment.name.substring(0, 12) + '...' : attachment.name}
                  </span>
                  <Eye className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-all duration-200" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">Aucun fichier joint</p>
          )}
        </div>
      )}
    </div>
  );
}
