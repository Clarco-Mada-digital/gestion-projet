# FIX : Création et suppression de tâches dans les projets

## ✅ Problème résolu

Quand vous créiez une nouvelle tâche dans un projet et ajoutiez des sous-tâches avant d'enregistrer, la tâche disparaissait complètement. Même problème pour la suppression de tâches.

### Cause du problème

1. **Création de tâche** : La tâche était ajoutée seulement à `editingProject` (état local) mais pas au store global
2. **Conflit de synchronisation** : Le `useEffect` de synchronisation comparait `editingProject` avec le store global
3. **Écrasement** : Comme la tâche n'existait pas dans le store, le `useEffect` écrasait `editingProject` avec les données du store (sans la nouvelle tâche)

## Solution implémentée

### 1. Ajout immédiat au store global (addTask)

```typescript
const addTask = () => {
  // ... création de la tâche ...

  // Ajouter la tâche au store global IMMÉDIATEMENT
  dispatch({
    type: 'ADD_TASK',
    payload: {
      projectId: editingProject.id,
      task: task
    }
  });

  // Mettre à jour le projet en cours d'édition avec la nouvelle tâche
  const updatedProject = {
    ...editingProject,
    tasks: [...(editingProject.tasks || []), task],
    updatedAt: new Date().toISOString()
  };

  setEditingProject(updatedProject);

  // Mettre à jour le projet dans le store aussi
  dispatch({
    type: 'UPDATE_PROJECT',
    payload: updatedProject
  });
};
```

### 2. Suppression immédiate du store global (removeTask)

```typescript
const removeTask = (taskId: string, isEditing: boolean = false) => {
  if (isEditing) {
    // Supprimer la tâche du store global IMMÉDIATEMENT
    dispatch({
      type: 'DELETE_TASK',
      payload: {
        projectId: editingProject.id,
        taskId: taskId
      }
    });

    const updatedTasks = editingProject.tasks?.filter(task => task.id !== taskId) || [];
    const updatedProject = {
      ...editingProject,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString()
    };

    setEditingProject(updatedProject);

    // Mettre à jour le projet dans le store aussi
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: updatedProject
    });
  }
};
```

## Comment ça fonctionne maintenant

### Pour la création de tâche :
1. **Création** → La tâche est créée
2. **Ajout au store** → `ADD_TASK` est dispatché immédiatement
3. **Mise à jour locale** → `editingProject` est mis à jour
4. **Synchronisation** → Le projet est mis à jour dans le store
5. **Résultat** → La tâche existe dans le store ET localement

### Pour la suppression de tâche :
1. **Suppression** → La tâche est supprimée
2. **Retrait du store** → `DELETE_TASK` est dispatché immédiatement
3. **Mise à jour locale** → `editingProject` est mis à jour
4. **Synchronisation** → Le projet est mis à jour dans le store
5. **Résultat** → La tâche est supprimée du store ET localement

## Avantages de cette solution

- ✅ **Plus de perte de données** : Les tâches ne disparaissent plus
- ✅ **Synchronisation parfaite** : Store global et état local toujours cohérents
- ✅ **Gestion des sous-tâches** : Vous pouvez maintenant ajouter des sous-tâches immédiatement
- ✅ **Performance** : Évite les conflits de synchronisation

## Tests recommandés

1. **Création avec sous-tâches** :
   - Créer une nouvelle tâche
   - Ajouter des sous-tâches immédiatement
   - Enregistrer la tâche
   - Vérifier que tout est bien conservé

2. **Suppression** :
   - Supprimer une tâche
   - Vérifier qu'elle disparaît bien partout

3. **Modification** :
   - Modifier une tâche existante
   - Vérifier que les changements sont synchronisés

## Fichiers modifiés

- `/src/components/Views/ProjectsView.tsx` : Correction des fonctions `addTask` et `removeTask`
