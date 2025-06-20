import React, { useState, useRef, useEffect, ReactElement } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function Select({ value, onValueChange, children, className = '', disabled = false }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trouver l'élément sélectionné
  const selectedChild = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.props.value === value
  );

  // Gérer la sélection d'un élément
  const handleSelect = (value: string) => {
    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        className={`flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="truncate">
          {React.isValidElement(selectedChild) ? selectedChild.props.children : 'Sélectionner...'}
        </span>
        <ChevronDown 
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
        />
      </button>
      
      {/* Menu déroulant */}
      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return (
                  <div
                    key={child.props.value}
                    className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                      child.props.value === value
                        ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleSelect(child.props.value)}
                  >
                    {child.props.children}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function SelectItem({ children, className = '' }: SelectItemProps) {
  return <div className={className}>{children}</div>;
}

// Composants factices pour la compatibilité avec l'API existante
export const SelectTrigger = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SelectContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SelectValue = ({ children, ...props }: any) => <div {...props}>{children}</div>;
