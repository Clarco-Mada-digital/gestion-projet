const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Début de l\'application des patches ===');

try {
  // Vérifier si le dossier patches existe
  const patchesDir = path.join(__dirname, '..', 'patches');
  if (!fs.existsSync(patchesDir)) {
    console.log('Aucun dossier patches trouvé. Aucun patch à appliquer.');
    process.exit(0);
  }

  // Lister tous les fichiers de patch
  const patchFiles = fs.readdirSync(patchesDir).filter(file => file.endsWith('.patch'));
  
  if (patchFiles.length === 0) {
    console.log('Aucun fichier de patch trouvé dans le dossier patches.');
    process.exit(0);
  }

  console.log(`Tentative d'application de ${patchFiles.length} patch(s)...`);

  // Appliquer chaque patch manuellement
  patchFiles.forEach(patchFile => {
    const patchPath = path.join(patchesDir, patchFile);
    console.log(`\nApplication du patch: ${patchFile}`);
    
    try {
      // Utiliser git apply pour appliquer le patch
      execSync(`git apply --ignore-whitespace --whitespace=nowarn "${patchPath}"`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
      console.log(`✅ Patch appliqué avec succès: ${patchFile}`);
    } catch (error) {
      console.warn(`⚠️ Impossible d'appliquer le patch ${patchFile}. Le patch a peut-être déjà été appliqué.`);
      console.warn('Message d\'erreur:', error.message);
    }
  });

  console.log('\n=== Tous les patches ont été traités ===');
  process.exit(0);
} catch (error) {
  console.error('❌ Erreur lors de l\'application des patches:', error.message);
  process.exit(1);
}
