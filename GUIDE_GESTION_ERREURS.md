# Guide de Gestion des Erreurs

Ce document décrit l'architecture de gestion des erreurs mise en place dans l'application de gestion de projet.

## Architecture

### 1. `AppError` - Classe d'erreur personnalisée

La classe `AppError` étend la classe native `Error` et ajoute des fonctionnalités supplémentaires :
- Typage des erreurs (validation, authentification, API, etc.)
- Contexte supplémentaire pour le débogage
- Horodatage des erreurs
- Gestion des erreurs d'origine (error chaining)

**Exemple d'utilisation :**
```typescript
throw new AppError(
  'L\'utilisateur n\'a pas les droits nécessaires',
  'AUTH_ERROR',
  { userId: 123, requiredRole: 'admin' }
);
```

### 2. Gestionnaire d'erreurs global (`errorHandler`)

Le gestionnaire d'erreurs centralisé offre :
- Journalisation des erreurs
- Affichage des notifications utilisateur
- Rapport d'erreurs à Sentry (en production)
- Traduction des messages d'erreur techniques en messages utilisateur conviviaux

**Exemple d'utilisation :**
```typescript
try {
  // Code potentiellement problématique
} catch (error) {
  errorHandler.handleError(error, {
    type: 'API_ERROR',
    context: { endpoint: '/api/data', method: 'GET' },
    showToast: true
  });
}
```

### 3. Boundary d'erreurs React

Le composant `ErrorBoundary` intercepte les erreurs non capturées dans les composants React et affiche une UI de repli.

**Utilisation :**
```tsx
<ErrorBoundary 
  fallback={(error) => (
    <div className="error-view">
      <h2>Une erreur est survenue</h2>
      <p>{error.message}</p>
      <button onClick={() => window.location.reload()}>Réessayer</button>
    </div>
  )}
>
  <MonComposantCritique />
</ErrorBoundary>
```

### 4. Système de notifications (Toast)

Un système de notifications contextuelles pour informer l'utilisateur des succès, avertissements et erreurs.

**Utilisation :**
```typescript
const { showToast } = useToast();

// Afficher un message de succès
showToast('Les modifications ont été enregistrées avec succès', 'success');

// Afficher une erreur
showToast('Impossible de charger les données', 'error');
```

## Bonnes pratiques

1. **Ne jamais ignorer les erreurs**
   Toujours capturer et traiter les erreurs, même pour les promesses non gérées.

2. **Utiliser des messages d'erreur explicites**
   Les messages d'erreur doivent être suffisamment détaillés pour le débogage mais afficher un message convivial à l'utilisateur.

3. **Enrichir le contexte**
   Fournir toujours un contexte pertinent avec les erreurs pour faciliter le débogage.

4. **Hiérarchiser les erreurs**
   - `error` : Pour les erreurs critiques qui empêchent le fonctionnement normal
  - `warning` : Pour les problèmes non critiques
  - `info` : Pour les informations de débogage

5. **Tester la gestion des erreurs**
   S'assurer que les cas d'erreur sont testés, en particulier pour les appels API et les opérations asynchrones.

## Intégration avec les services existants

### Service Email

Le service email a été mis à jour pour utiliser le nouveau système de gestion d'erreurs avec :
- Validation des entrées
- Gestion des erreurs réseau
- Messages d'erreur conviviaux
- Journalisation détaillée

### Redux

Les erreurs dans les thunks Redux sont automatiquement capturées et traitées par le middleware d'erreur global.

## Surveillance et journalisation

En production, les erreurs sont :
1. Journalisées dans la console en développement
2. Envoyées à Sentry pour le suivi
3. Affichées à l'utilisateur via des toasts (si pertinent)

## Dépannage

### Problèmes courants

1. **Erreur "EmailJS non initialisé"**
   - Vérifier que la configuration EmailJS est correctement définie
   - S'assurer que `EmailService.configure()` a été appelé au démarrage de l'application

2. **Erreurs réseau non capturées**
   - Vérifier que les appels API sont correctement enveloppés avec `withErrorHandling`
   - S'assurer que les erreurs sont propagées correctement

3. **Notifications en double**
   - Vérifier que l'erreur n'est pas traitée à plusieurs endroits
   - Utiliser `showToast: false` dans `handleError` si nécessaire

## Améliorations futures

- [ ] Ajouter plus de contexte utilisateur dans les rapports d'erreur
- [ ] Implémenter un système de rétry pour les erreurs réseau
- [ ] Améliorer la traduction des messages d'erreur
- [ ] Ajouter des tests unitaires pour la gestion des erreurs
