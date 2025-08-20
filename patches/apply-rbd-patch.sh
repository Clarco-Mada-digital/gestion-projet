#!/bin/bash

# Créer le dossier patches s'il n'existe pas
mkdir -p patches

# Créer le fichier de patch pour react-beautiful-dnd
cat > patches/react-beautiful-dnd+13.1.1.patch << 'EOL'
--- node_modules/react-beautiful-dnd/package.json
+++ node_modules/react-beautiful-dnd/package.json
@@ -1,5 +1,5 @@
 {
-  "name": "react-beautiful-dnd",
+  "name": "patched-react-beautiful-dnd",
   "version": "13.1.1",
   "description": "Beautiful, accessible drag and drop for lists with React",
   "license": "Apache-2.0",
@@ -7,7 +7,7 @@
   "bugs": "https://github.com/atlassian/react-beautiful-dnd/issues",
   "repository": "git@github.com:atlassian/react-beautiful-dnd.git",
   "scripts": {
-    "postinstall": "node ./scripts/postinstall/check-peer-dependencies.js"
+    "postinstall": "echo 'Skipping postinstall for react-beautiful-dnd'"
   },
   "dependencies": {
     "css-box-model": "1.2.1",
EOL

echo "Patch pour react-beautiful-dnd créé avec succès"
