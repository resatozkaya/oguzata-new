export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  phoneNumber?: string;
  photoURL?: string;
  sites?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  SITE_MANAGER = 'site_manager',
  FOREMAN = 'foreman',
  WAREHOUSE_MANAGER = 'warehouse_manager',
  TECHNICAL_OFFICE = 'technical_office',
  ACCOUNTANT = 'accountant',
  WORKER = 'worker'
}

export interface ConstructionSite {
  id: string;
  name: string;
  address: string;
  city: string;
  status: SiteStatus;
  managerId: string;
  startDate: Date;
  estimatedEndDate?: Date;
  actualEndDate?: Date;
  budget: number;
  progress: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export enum SiteStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Material {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  minStock: number;
  currentStock: number;
  supplier?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  siteId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string[];
  startDate: Date;
  dueDate: Date;
  completedDate?: Date;
  attachments?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}
