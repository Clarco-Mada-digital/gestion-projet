const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/react-beautiful-dnd/dist/react-beautiful-dnd.cjs.js');

console.log('Patching react-beautiful-dnd...');

try {
  // Lire le contenu du fichier
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remplacer la partie problématique
  const findStr = 'Provider.defaultProps';
  const replaceStr = '// Patched: Removed defaultProps to prevent warning\n  // ';
  
  if (content.includes(findStr)) {
    content = content.replace(findStr, replaceStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully patched react-beautiful-dnd!');
  } else {
    console.log('Warning: Could not find the target string in the file.');
  }
} catch (error) {
  console.error('Error patching react-beautiful-dnd:', error);
  process.exit(1);
}
