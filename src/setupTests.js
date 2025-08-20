// Ignorer l'avertissement spécifique à react-beautiful-dnd
const originalError = console.error;

console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && 
      args[0].includes('Support for defaultProps will be removed from memo components')) {
    return;
  }
  originalError.apply(console, args);
};

// Ignorer également les avertissements dans les tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' && 
      args[0].includes('Support for defaultProps will be removed from memo components')) {
    return;
  }
  originalWarn.apply(console, args);
};
