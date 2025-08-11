const fs = require('fs-extra');
const path = require('path');

const srcDir = path.join(__dirname, '..');
const destDir = path.join(__dirname, '../dist');

// Créer le répertoire de destination s'il n'existe pas
fs.ensureDirSync(destDir);

// Copier le fichier DOCUMENTATION.md
fs.copyFileSync(
  path.join(srcDir, 'DOCUMENTATION.md'),
  path.join(destDir, 'DOCUMENTATION.md')
);

console.log('Documentation copiée avec succès dans le répertoire de build');
