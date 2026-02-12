/**
 * Calcule la durée de travail entre deux dates et la formate en texte lisible
 * @param startDate Date de début (format ISO string ou Date, sans heure)
 * @param endDate Date d'échéance (format ISO string ou Date, sans heure)
 * @returns Durée formatée (ex: "1m 2j 14h" ou "8h")
 */
export function calculateDuration(startDate: string | Date, endDate: string | Date): string {
  // Gérer différents formats de date (ISO string, Timestamp Firebase, etc.)
  let start: Date;
  let end: Date;
  
  if (typeof startDate === 'string') {
    // Vérifier si c'est un Timestamp Firebase (ex: {seconds: 1234567890, nanoseconds: 0})
    try {
      const parsed = JSON.parse(startDate);
      if (parsed.seconds) {
        start = new Date(parsed.seconds * 1000);
      } else {
        start = new Date(startDate);
      }
    } catch {
      start = new Date(startDate);
    }
  } else {
    start = new Date(startDate);
  }
  
  if (typeof endDate === 'string') {
    try {
      const parsed = JSON.parse(endDate);
      if (parsed.seconds) {
        end = new Date(parsed.seconds * 1000);
      } else {
        end = new Date(endDate);
      }
    } catch {
      end = new Date(endDate);
    }
  } else {
    end = new Date(endDate);
  }
  
  // Validation des dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Date invalide';
  }
  
  // S'assurer que la date de fin est après la date de début
  if (end < start) {
    return 'Date de fin antérieure à la date de début';
  }
  
  // Pour les dates sans heures spécifiées :
  // - Date de début : début de journée (00:00)
  // - Date d'échéance : fin de journée (23:59:59)
  const startOfDay = new Date(start);
  const endOfDay = new Date(end);
  startOfDay.setHours(0, 0, 0, 0);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Calcul de la différence en millisecondes
  const diffMs = endOfDay.getTime() - startOfDay.getTime();
  
  
  // Conversion en différentes unités
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30.44); // Moyenne de 30.44 jours par mois
  const diffYears = Math.floor(diffDays / 365.25); // Année bissextile prise en compte
  
  const parts: string[] = [];
  
  // Construction des parties de la durée avec abréviations
  if (diffYears > 0) {
    parts.push(`${diffYears}a`);
  }
  
  if (diffMonths > 0) {
    const remainingMonths = diffMonths % 12;
    if (remainingMonths > 0) {
      parts.push(`${remainingMonths}m`);
    }
  }
  
  if (diffWeeks > 0 && diffYears === 0 && diffMonths === 0) {
    const remainingWeeks = diffWeeks % 4;
    if (remainingWeeks > 0) {
      parts.push(`${remainingWeeks}s`);
    }
  }
  
  if (diffDays > 0) {
    let remainingDays: number;
    
    if (diffYears > 0 || diffMonths > 0) {
      // S'il y a des années ou des mois, on calcule les jours restants
      remainingDays = diffYears === 0 && diffMonths === 0 ? diffDays % 7 : diffDays % 30.44;
    } else {
      // Pas d'années ni de mois, on prend tous les jours
      remainingDays = diffDays;
    }
    
    if (remainingDays > 0) {
      parts.push(`${Math.floor(remainingDays)}j`);
    }
  }
  
  if (diffHours > 0) {
    const remainingHours = diffHours % 24;
    if (remainingHours > 0) {
      parts.push(`${remainingHours}h`);
    }
  }
  
  // Si aucune partie n'a été ajoutée (durée très courte), on affiche en minutes
  if (parts.length === 0) {
    if (diffMinutes > 0) {
      return `${diffMinutes}min`;
    } else {
      return '<1min';
    }
  }
  
  // Limiter à 3 parties maximum pour éviter les affichages trop longs
  if (parts.length > 3) {
    return parts.slice(0, 3).join(' ');
  }
  
  return parts.join(' ');
}

/**
 * Calcule le nombre total d'heures entre deux dates
 * @param startDate Date de début
 * @param endDate Date de fin
 * @returns Nombre total d'heures (arrondi à 2 décimales)
 */
export function calculateTotalHours(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }
  
  const diffMs = end.getTime() - start.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
}

/**
 * Vérifie si une tâche s'étend sur plusieurs jours
 * @param startDate Date de début
 * @param endDate Date de fin
 * @returns true si la tâche couvre plusieurs jours
 */
export function isMultiDayTask(startDate: string | Date, endDate: string | Date): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }
  
  // Reset les heures pour comparer uniquement les dates
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  
  return startDay.getTime() !== endDay.getTime();
}
