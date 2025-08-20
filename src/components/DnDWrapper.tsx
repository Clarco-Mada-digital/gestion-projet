import React, { useEffect } from 'react';
import { DragDropContext as RBDDragDropContext, DragDropContextProps } from 'react-beautiful-dnd';

// Supprimer les avertissements spécifiques de la console
const patchConsoleWarnings = () => {
  const originalWarn = console.warn;
  
  console.warn = (...args) => {
    // Ignorer l'avertissement spécifique à react-beautiful-dnd
    if (args[0] && typeof args[0] === 'string' && 
        args[0].includes('Support for defaultProps will be removed from memo components')) {
      return;
    }
    originalWarn.apply(console, args);
  };

  return () => {
    console.warn = originalWarn;
  };
};

export const DragDropContext: React.FC<DragDropContextProps> = (props) => {
  useEffect(() => {
    const restoreConsole = patchConsoleWarnings();
    return () => {
      restoreConsole();
    };
  }, []);

  return <RBDDragDropContext {...props} />;
};

// Réexporter les autres composants nécessaires depuis react-beautiful-dnd
export { 
  Droppable as RBDDroppable,
  Draggable as RBDDraggable,
  resetServerContext
} from 'react-beautiful-dnd';

export type { 
  DroppableProps as RBDDroppableProps,
  DraggableProps as RBDDraggableProps,
  DropResult as RBDDropResult,
  DraggableProvided as RBDDraggableProvided,
  DraggableStateSnapshot as RBDDraggableStateSnapshot,
  DroppableProvided as RBDDroppableProvided,
  DroppableStateSnapshot as RBDDroppableStateSnapshot
} from 'react-beautiful-dnd';
