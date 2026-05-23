import type { Timestamp } from 'firebase/firestore'

// ─── User ────────────────────────────────────────────────────────────────────

export interface AppUser {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
  createdAt: Timestamp | Date
}

// ─── Workspace ───────────────────────────────────────────────────────────────

export interface Workspace {
  id: string
  name: string
  ownerId: string
  members: string[]
  createdAt: Timestamp | Date
}

// ─── Project ─────────────────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived'
export type ProjectColor =
  | 'red' | 'orange' | 'yellow' | 'green' | 'teal'
  | 'blue' | 'indigo' | 'purple' | 'pink' | 'gray'

export interface Project {
  id: string
  name: string
  description: string
  color: ProjectColor
  workspaceId: string
  ownerId: string
  members: string[]
  status: ProjectStatus
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// ─── Section ─────────────────────────────────────────────────────────────────

export interface Section {
  id: string
  name: string
  projectId: string
  order: number
  createdAt: Timestamp | Date
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  projectId: string
  workspaceId: string
  assigneeId: string | null
  dueDate: Timestamp | Date | null
  priority: TaskPriority
  status: TaskStatus
  sectionId: string
  order: number
  tags: string[]
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// ─── UI Helpers ──────────────────────────────────────────────────────────────

export interface KanbanColumn {
  id: TaskStatus
  label: string
  color: string
  tasks: Task[]
}

export interface NavItem {
  label: string
  icon: string
  to: string
}

// ─── Form payloads ───────────────────────────────────────────────────────────

export interface CreateProjectPayload {
  name: string
  description: string
  color: ProjectColor
  workspaceId: string
}

export interface CreateTaskPayload {
  title: string
  description: string
  projectId: string
  workspaceId: string
  assigneeId: string | null
  dueDate: Date | null
  priority: TaskPriority
  status: TaskStatus
  sectionId: string
  tags: string[]
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  id: string
  order?: number
}
