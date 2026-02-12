import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect } from 'react';
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
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`relative w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col bg-white dark:bg-gray-800 shadow-2xl rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden z-10`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap overflow-hidden text-ellipsis w-full" title={typeof title === 'string' ? title : ''}>
                  {title}
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {extra && <div className="flex items-center">{extra}</div>}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-110"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}