# Fix : Synchronisation des tâches modifiées avec le projet en cours d'édition

## Problème identifié

Quand vous modifiez un projet et que vous ouvrez la fenêtre de modification d'une tâche (`EditTaskForm`), les modifications de la tâche n'étaient pas répercutées sur le projet en cours d'édition. Quand vous enregistriez le projet, il écrasait les modifications des tâches avec l'ancienne version.

### Cause du problème

1. `editingProject` était une copie locale du projet
2. Quand une tâche était modifiée via `EditTaskForm`, le store global était mis à jour via `UPDATE_TASK`
3. Mais `editingProject` conservait l'ancienne version des tâches
4. À l'enregistrement du projet, les anciennes tâches écrasaient les nouvelles modifications

## Solution implémentée

### 1. Synchronisation automatique du editingProject

Ajout d'un `useEffect` dans `ProjectsView.tsx` pour synchroniser `editingProject` avec le store global :

```typescript
// Synchroniser editingProject avec le store global quand les tâches sont modifiées
useEffect(() => {
  if (editingProject) {
    const updatedProject = state.projects.find(p => p.id === editingProject.id);
    if (updatedProject) {
      // Vérifier si les tâches ont été modifiées en comparant les updatedAt ou les IDs
      const storeTasks = updatedProject.tasks || [];
      const localTasks = editingProject.tasks || [];
      
      // Si le nombre de tâches est différent ou si une tâche a été mise à jour
      const hasTaskChanges = storeTasks.length !== localTasks.length || 
        storeTasks.some(storeTask => {
          const localTask = localTasks.find(t => t.id === storeTask.id);
          return !localTask || localTask.updatedAt !== storeTask.updatedAt;
        });

      if (hasTaskChanges) {
        setEditingProject({
          ...updatedProject,
          tasks: storeTasks
        });
      }
    }
  }
}, [state.projects, editingProject?.id]);
```

### 2. Utilisation de la version la plus récente des tâches

Modification de `openTaskModal` pour toujours utiliser la version la plus récente de la tâche :

```typescript
const openTaskModal = (task: Task) => {
  // Récupérer la version la plus récente de la tâche depuis le store global
  const latestTask = state.tasks.find(t => t.id === task.id) || task;
  setEditingTask(latestTask);
};
```

## Comment ça fonctionne maintenant

1. **Modification d'une tâche** : Le store global est mis à jour via `UPDATE_TASK`
2. **Détection des changements** : Le `useEffect` détecte que les tâches dans le store sont différentes de celles dans `editingProject`
3. **Synchronisation automatique** : `editingProject` est mis à jour avec les dernières versions des tâches
4. **Enregistrement du projet** : Le projet est enregistré avec les tâches à jour

## Fichiers modifiés

- `/src/components/Views/ProjectsView.tsx` : Ajout de la logique de synchronisation

## Tests recommandés

1. Ouvrir un projet en édition
2. Modifier une tâche via le modal
3. Vérifier que les modifications apparaissent dans la liste des tâches du projet
4. Enregistrer le projet
5. Vérifier que les modifications de la tâche sont bien conservées

## Avantages de cette solution

- **Synchronisation en temps réel** : Les modifications sont immédiatement visibles
- **Pas de perte de données** : Plus d'écrasement des modifications
- **Performance optimisée** : Détection intelligente des changements
- **Rétrocompatibilité** : Ne casse pas le fonctionnement existant
