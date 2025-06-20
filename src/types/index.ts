export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignees: string[];
  projectId: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export type ViewMode = 'today' | 'projects' | 'kanban' | 'calendar';
export type Theme = 'light' | 'dark';