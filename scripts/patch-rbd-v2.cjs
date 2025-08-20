const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/react-beautiful-dnd/dist/react-beautiful-dnd.cjs.js');

console.log('Patching react-beautiful-dnd...');

try {
  // Lire le contenu du fichier
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Trouver la définition du Provider
  const providerPattern = /var Provider = /;
  const providerMatch = content.match(providerPattern);
  
  if (providerMatch) {
    // Trouver la fin de la définition du composant Provider
    let providerEndIndex = content.indexOf('});', providerMatch.index) + 3;
    
    // Vérifier si nous avons trouvé la fin
    if (providerEndIndex > 3) {
      // Extraire la définition complète du Provider
      const providerDefinition = content.substring(providerMatch.index, providerEndIndex);
      
      // Vérifier si la définition contient defaultProps
      if (providerDefinition.includes('defaultProps')) {
        // Supprimer les defaultProps
        const patchedDefinition = providerDefinition.replace(/\s*Provider\.defaultProps = \{[^}]*\};?/g, '');
        
        // Remplacer la définition originale par la version patchée
        content = content.substring(0, providerMatch.index) + 
                 patchedDefinition + 
                 content.substring(providerEndIndex);
        
        // Écrire le fichier modifié
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Successfully patched react-beautiful-dnd!');
      } else {
        console.log('Warning: Could not find defaultProps in Provider definition.');
      }
    } else {
      console.log('Warning: Could not find the end of Provider definition.');
    }
  } else {
    console.log('Warning: Could not find Provider definition in the file.');
  }
} catch (error) {
  console.error('Error patching react-beautiful-dnd:', error);
  process.exit(1);
}
