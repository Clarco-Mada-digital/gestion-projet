import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  extra?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', extra }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      <div className="fixed inset-0 transition-opacity bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className={`relative w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
              {title}
            </h3>
            {extra && <div className="flex items-center w-full">{extra}</div>}
          </div>

          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
}