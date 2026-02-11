import React, { useState, useRef } from 'react';
import { Plus, X as XIcon, Eye, Image as ImageIcon, FileText, Music, Video, File, FileSpreadsheet, Presentation } from 'lucide-react';
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
      case 'image': return <ImageIcon className="w-3 h-3" />;
      case 'document': return <FileText className="w-3 h-3" />;
      case 'spreadsheet': return <FileSpreadsheet className="w-3 h-3" />;
      case 'presentation': return <Presentation className="w-3 h-3" />;
      case 'audio': return <Music className="w-3 h-3" />;
      case 'video': return <Video className="w-3 h-3" />;
      default: return <File className="w-3 h-3" />;
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case 'image': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'document': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'spreadsheet': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
      case 'presentation': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'audio': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
      case 'video': return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
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
                  className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border border-transparent transition-all cursor-pointer ${getFileColor(attachment.type)}`}
                  title={`${attachment.name} • ${(attachment.size / 1024).toFixed(1)} KB`}
                >
                  <span className="flex-shrink-0">
                    {getFileIcon(attachment.type)}
                  </span>
                  <span className="max-w-32 truncate font-medium">
                    {attachment.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveAttachment(attachment.id);
                    }}
                    className="ml-0.5 opacity-60 hover:opacity-100 hover:text-red-500 transition-all duration-200"
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
                  className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border border-transparent transition-all cursor-pointer hover:scale-105 active:scale-95 ${getFileColor(attachment.type)}`}
                  title={`${attachment.name} • ${(attachment.size / 1024).toFixed(1)} KB • Cliquez pour ouvrir`}
                >
                  <span className="flex-shrink-0">
                    {getFileIcon(attachment.type)}
                  </span>
                  <span className="max-w-32 truncate font-medium">
                    {attachment.name}
                  </span>
                  <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-200" />
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
