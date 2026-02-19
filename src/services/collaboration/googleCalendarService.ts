
/**
 * Service pour interagir avec l'API Google Calendar
 */
export const googleCalendarService = {
  /**
   * Récupère les événements du calendrier principal de l'utilisateur
   * @param accessToken Token d'accès Google
   * @param daysToFetch Nombre de jours à récupérer avant et après aujourd'hui
   */
  async fetchEvents(accessToken: string, daysToFetch: number = 30, timeMinParam?: string, timeMaxParam?: string): Promise<any[]> {
    if (!accessToken) return [];

    const now = new Date();
    const timeMin = timeMinParam || new Date(now.getTime() - daysToFetch * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = timeMaxParam || new Date(now.getTime() + daysToFetch * 24 * 60 * 60 * 1000).toISOString();

    try {
      // 1. Récupérer la liste des calendriers de l'utilisateur
      const calendarListRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      let calendars: any[] = [];

      if (calendarListRes.ok) {
        const calendarListData = await calendarListRes.json();
        calendars = calendarListData.items || [];
      } else {
        console.warn('Impossible de récupérer la liste des calendriers, tentative avec le calendrier principal uniquement.');
        // Fallback : On essaie au moins le calendrier primaire si la liste globale est interdite (403)
        // On utilise un objet qui ressemble à un calendrier Google
        calendars = [{ id: 'primary', summary: 'Principal', backgroundColor: '#4285F4' }];
      }

      let allEvents: any[] = [];

      let successCount = 0;
      let lastError = '';

      // 2. Récupérer les événements de chaque calendrier
      for (const calendar of calendars) {
        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const items = (data.items || []).map((item: any) => ({
            id: item.id,
            title: item.summary || 'Événement sans titre',
            description: item.description || '',
            startDate: item.start?.dateTime || item.start?.date,
            dueDate: item.end?.dateTime || item.end?.date,
            type: 'external',
            location: item.location || '',
            color: calendar.backgroundColor || '#4285F4',
            source: 'google',
            calendarName: calendar.summary,
            hangoutLink: item.hangoutLink || item.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri || '',
            attendees: item.attendees || [],
            htmlLink: item.htmlLink || '',
            organizer: item.organizer || item.creator
          }));
          allEvents = [...allEvents, ...items];
          successCount++;
        } else {
          const errBody = await response.json().catch(() => ({}));
          console.error(`Erreur pour le calendrier ${calendar.id}:`, errBody);
          lastError = errBody.error?.message || response.statusText;
        }
      }

      if (successCount === 0 && calendars.length > 0) {
        if (lastError.includes('Google Calendar API has not been used') || lastError.includes('disabled')) {
          // Extraire le numéro de projet pour aider l'utilisateur
          const projectMatch = lastError.match(/project (\d+)/);
          const projectNum = projectMatch ? projectMatch[1] : '650111904365';
          throw new Error(`API_GOOGLE_DISABLED|${projectNum}`);
        }
        throw new Error(`Erreur API Google : ${lastError || 'Accès refusé'}.`);
      }

      return allEvents;
    } catch (error) {
      console.error('Erreur googleCalendarService:', error);
      throw error;
    }
  }
};
