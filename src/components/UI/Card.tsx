import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export function Card({ children, className = '', hover = false, gradient = false }: CardProps) {
  return (
    <div className={`
      ${gradient 
        ? 'bg-gradient-to-br from-white/95 via-blue-50/60 to-purple-50/60 dark:from-gray-800/95 dark:via-gray-800/80 dark:to-gray-800/80' 
        : 'bg-white/90 dark:bg-gray-800/90'
      }
      backdrop-blur-xl rounded-2xl shadow-md border border-gray-200/60 dark:border-gray-700/60
      ${hover ? 'hover:shadow-lg hover:translate-y-[-5px] transition-all duration-200 transform' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}