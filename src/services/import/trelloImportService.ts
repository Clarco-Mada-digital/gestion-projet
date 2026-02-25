import { Project, Task, User } from '../../types';

interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  lists: TrelloList[];
  cards: TrelloCard[];
  members: TrelloMember[];
  checklists: TrelloChecklist[]; // Ajouté - checklists au niveau racine
}

interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  idBoard: string;
  pos: number;
  subscribed: boolean;
  softLimit: number;
  type: string;
  datasource: any;
  creationMethod: string;
  idOrganization: string;
  limits: any;
  nodeId: string;
}

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  due: string | null;
  idList: string;
  labels: TrelloLabel[];
  attachments: TrelloAttachment[];
  idChecklists: string[]; // Changé - références aux checklists
}

interface TrelloMember {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string;
}

interface TrelloLabel {
  id: string;
  name: string;
  color: string;
}

interface TrelloAttachment {
  id: string;
  name: string;
  url: string;
}

interface TrelloChecklist {
  id: string;
  name: string;
  checkItems: TrelloCheckItem[];
}

interface TrelloCheckItem {
  id: string;
  name: string;
  state: string;
}

export class TrelloImportService {
  static async importFromFile(file: File, currentUserId?: string): Promise<Project> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const trelloData: TrelloBoard = JSON.parse(e.target?.result as string);
          const project = this.convertTrelloToProject(trelloData, currentUserId);
          resolve(project);
        } catch (error) {
          reject(new Error('Erreur lors de la lecture du fichier Trello: ' + error));
        }
      };
      
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsText(file);
    });
  }

  private static convertTrelloToProject(trelloBoard: TrelloBoard, currentUserId?: string): Project {
    // L'utilisateur qui importe devient le propriétaire et le seul membre
    const ownerUser: User = {
      id: currentUserId || 'import-user',
      name: 'Utilisateur Principal',
      email: 'user@import.local',
      avatar: '',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Créer un mapping des ID de checklists vers les checklists complètes
    const checklistMap = new Map<string, any>();
    (trelloBoard.checklists || []).forEach(checklist => {
      checklistMap.set(checklist.id, checklist);
    });

    // Mapping des listes vers des états de tâches avec les vrais noms
    const listMap = new Map<string, string>();
    const listNames = new Map<string, string>();
    (trelloBoard.lists || []).forEach((list) => {
      const statusId = list.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      listMap.set(list.id, statusId);
      listNames.set(statusId, list.name);
    });

    // Conversion des cartes en tâches
    const tasks: Task[] = (trelloBoard.cards || []).map(card => {
      const statusId = listMap.get(card.idList) || 'todo';
      const projectId = `trello_${trelloBoard.id}`;
      
      // Récupérer les checklists complètes pour cette carte
      const cardChecklists = (card.idChecklists || []).map((checklistId: string) => 
        checklistMap.get(checklistId)
      ).filter(Boolean);
      
      return {
        id: card.id,
        title: card.name,
        description: card.desc,
        status: statusId,
        priority: this.extractPriorityFromLabels(card.labels || []),
        startDate: new Date().toISOString().split('T')[0],
        dueDate: card.due ? new Date(card.due).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        assignees: [ownerUser.id], // Assigné au propriétaire
        projectId: projectId,
        tags: (card.labels || []).map(label => label.name),
        subTasks: this.convertChecklistsToSubTasks(cardChecklists),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: (card.attachments || []).map(att => ({
          id: att.id,
          name: att.name,
          type: 'link' as const,
          url: att.url,
          size: 0,
          uploadedAt: new Date().toISOString()
        }))
      };
    });

    // Création des colonnes personnalisées pour le Kanban
    const customColumns = (trelloBoard.lists || []).map(list => {
      const statusId = list.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const color = this.getDefaultStatusColorFromIndex(list.name);
      return {
        id: statusId,
        title: list.name,
        gradient: `from-${color}/20 to-${color}/10`,
        iconColor: `from-${color} to-${color}`
      };
    });

    return {
      id: `trello_${trelloBoard.id}`,
      name: trelloBoard.name || 'Projet Trello Importé',
      description: trelloBoard.desc || 'Projet importé depuis Trello',
      color: '#3B82F6',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: tasks,
      source: 'local' as const, // Projet local par défaut
      ownerId: ownerUser.id, // Propriétaire = celui qui importe
      members: [ownerUser.id], // Seul membre = celui qui importe
      memberRoles: {
        [ownerUser.id]: 'admin' // Rôle admin pour le propriétaire
      },
      isShared: false, // Non partagé par défaut
      kanbanSettings: {
        columnOrder: (trelloBoard.lists || []).map(list => 
          list.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        ),
        customColumns: customColumns
      }
    };
  }

  private static convertChecklistsToSubTasks(checklists: any[]): any[] {
    return checklists.flatMap((checklist: any) => 
      (checklist.checkItems || []).map((item: any) => ({
        id: item.id,
        title: item.name,
        completed: item.state === 'complete',
        createdAt: new Date().toISOString(),
        updatedAt: item.state === 'complete' ? new Date().toISOString() : new Date().toISOString(),
        group: checklist.name // Utiliser le nom de la checklist comme groupe
      }))
    );
  }

  private static getDefaultStatusColorFromIndex(name: string): string {
    const colors = ['gray', 'blue', 'green', 'yellow', 'red', 'purple'];
    const index = name.length % colors.length;
    return colors[index];
  }

  private static getDefaultStatusColor(index: number): string {
    const colors = ['#6B7280', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    return colors[index % colors.length];
  }

  private static extractPriorityFromLabels(labels: TrelloLabel[]): 'low' | 'medium' | 'high' {
    const priorityLabel = labels.find(label => 
      label.name.toLowerCase().includes('urgent') || 
      label.name.toLowerCase().includes('high') ||
      label.color === 'red'
    );
    
    if (priorityLabel) return 'high';
    
    const mediumLabel = labels.find(label => 
      label.name.toLowerCase().includes('medium') ||
      label.color === 'yellow'
    );
    
    return mediumLabel ? 'medium' : 'low';
  }

  private static extractAssigneeFromCard(card: TrelloCard, members: User[]): string | null {
    // Trello n'a pas directement d'assigné dans l'export JSON
    // On pourrait extraire depuis la description ou les mentions
    // Pour l'instant, on retourne null
    return null;
  }

  static validateTrelloFile(file: File): boolean {
    return file.type === 'application/json' && file.name.endsWith('.json');
  }
}
