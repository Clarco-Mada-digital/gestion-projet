
/**
 * Service pour interagir avec l'API Google Calendar
 */
export const googleCalendarService = {
  /**
   * Récupère les événements du calendrier principal de l'utilisateur
   * @param accessToken Token d'accès Google
   * @param daysToFetch Nombre de jours à récupérer avant et après aujourd'hui
   */
  async fetchEvents(accessToken: string, daysToFetch: number = 30): Promise<any[]> {
    if (!accessToken) return [];

    const now = new Date();
    const timeMin = new Date(now.getTime() - daysToFetch * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(now.getTime() + daysToFetch * 24 * 60 * 60 * 1000).toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token Google expiré ou invalide');
        }
        const errorData = await response.json();
        console.error('Erreur API Google Calendar:', errorData);
        throw new Error(errorData.error?.message || 'Erreur lors de la récupération du calendrier');
      }

      const data = await response.json();

      // Transformer les événements Google au format attendu par CalendarView
      return (data.items || []).map((item: any) => ({
        id: item.id,
        title: item.summary || 'Événement sans titre',
        description: item.description || '',
        startDate: item.start?.dateTime || item.start?.date,
        dueDate: item.end?.dateTime || item.end?.date,
        type: 'external',
        location: item.location || '',
        color: '#4285F4', // Couleur Google par défaut
        source: 'google'
      }));
    } catch (error) {
      console.error('Erreur googleCalendarService:', error);
      throw error;
    }
  }
};
