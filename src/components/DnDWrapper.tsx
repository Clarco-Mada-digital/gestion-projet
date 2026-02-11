import React, { useEffect } from 'react';
import { DragDropContext as RBDDragDropContext, DragDropContextProps } from 'react-beautiful-dnd';

// Supprimer les avertissements spécifiques de la console
const patchConsoleWarnings = () => {
  const originalWarn = console.warn;
  const originalError = console.error;

  const filterWarning = (...args: any[]) => {
    if (args[0] && typeof args[0] === 'string' &&
      (args[0].includes('Support for defaultProps will be removed from memo components') ||
        args[0].includes('Connect(Droppable)') ||
        args[0].includes('Connect(Draggable)'))) {
      return true;
    }
    return false;
  };

  console.warn = (...args) => {
    if (filterWarning(...args)) return;
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    if (filterWarning(...args)) return;
    originalError.apply(console, args);
  };

  return () => {
    console.warn = originalWarn;
    console.error = originalError;
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
