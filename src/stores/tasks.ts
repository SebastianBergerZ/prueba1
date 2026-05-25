import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth'
import type { Task, Section, CreateTaskPayload, UpdateTaskPayload, KanbanColumn, TaskStatus } from '@/types'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const sections = ref<Section[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let unsubscribeTasks: Unsubscribe | null = null
  let unsubscribeSections: Unsubscribe | null = null

  const authStore = useAuthStore()

  // ── Computed ──────────────────────────────────────────────────────────────

  const kanbanColumns = computed<KanbanColumn[]>(() => {
    const statuses: { id: TaskStatus; label: string; color: string }[] = [
      { id: 'todo', label: 'To Do', color: 'bg-gray-200' },
      { id: 'in_progress', label: 'In Progress', color: 'bg-blue-200' },
      { id: 'review', label: 'Review', color: 'bg-yellow-200' },
      { id: 'done', label: 'Done', color: 'bg-green-200' }
    ]
    return statuses.map((s) => ({
      ...s,
      tasks: tasks.value
        .filter((t) => t.status === s.id)
        .sort((a, b) => a.order - b.order)
    }))
  })

  // Section-based columns: the source of truth for the kanban board
  const sectionColumns = computed(() => {
    const firstSectionId = sections.value[0]?.id ?? null
    return sections.value.map((section) => ({
      section,
      tasks: tasks.value
        .filter((t) => {
          if (t.sectionId === section.id) return true
          // fallback: orphaned tasks go to first section
          if (section.id === firstSectionId) {
            return !sections.value.some((s) => s.id === t.sectionId)
          }
          return false
        })
        .sort((a, b) => a.order - b.order)
    }))
  })

  const tasksBySection = computed(() => {
    const map: Record<string, Task[]> = {}
    sections.value.forEach((s) => {
      map[s.id] = tasks.value
        .filter((t) => t.sectionId === s.id)
        .sort((a, b) => a.order - b.order)
    })
    return map
  })

  // ── Real-time listeners ───────────────────────────────────────────────────

  function subscribeToProject(projectId: string): void {
    if (unsubscribeTasks) unsubscribeTasks()
    if (unsubscribeSections) unsubscribeSections()

    loading.value = true

    // Subscribe to sections — no orderBy to avoid composite index requirement
    const sectionsQuery = query(
      collection(db, 'sections'),
      where('projectId', '==', projectId)
    )
    unsubscribeSections = onSnapshot(
      sectionsQuery,
      (snap) => {
        sections.value = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Section))
          .sort((a, b) => a.order - b.order)
      },
      (err) => { error.value = err.message }
    )

    // Subscribe to tasks — no orderBy to avoid composite index requirement
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('projectId', '==', projectId)
    )
    unsubscribeTasks = onSnapshot(
      tasksQuery,
      (snap) => {
        tasks.value = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Task))
          .sort((a, b) => a.order - b.order)
        loading.value = false
      },
      (err) => {
        error.value = err.message
        loading.value = false
      }
    )
  }

  function unsubscribeFromProject(): void {
    if (unsubscribeTasks) {
      unsubscribeTasks()
      unsubscribeTasks = null
    }
    if (unsubscribeSections) {
      unsubscribeSections()
      unsubscribeSections = null
    }
    tasks.value = []
    sections.value = []
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async function createTask(payload: CreateTaskPayload): Promise<string> {
    error.value = null
    const uid = authStore.uid
    if (!uid) throw new Error('Not authenticated')

    // Determine order (place at end of column)
    const existingInStatus = tasks.value.filter((t) => t.status === payload.status)
    const order = existingInStatus.length

    const docRef = await addDoc(collection(db, 'tasks'), {
      title: payload.title,
      description: payload.description,
      projectId: payload.projectId,
      workspaceId: payload.workspaceId,
      assigneeId: payload.assigneeId,
      startDate: payload.startDate ?? null,
      dueDate: payload.dueDate,
      priority: payload.priority,
      status: payload.status,
      sectionId: payload.sectionId,
      order,
      tags: payload.tags,
      customFieldValues: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    return docRef.id
  }

  async function updateTask(payload: UpdateTaskPayload): Promise<void> {
    error.value = null
    const { id, ...data } = payload
    await updateDoc(doc(db, 'tasks', id), {
      ...data,
      updatedAt: serverTimestamp()
    })
  }

  async function moveTask(taskId: string, newStatus: TaskStatus): Promise<void> {
    error.value = null
    const existingInStatus = tasks.value.filter((t) => t.status === newStatus)
    await updateDoc(doc(db, 'tasks', taskId), {
      status: newStatus,
      order: existingInStatus.length,
      updatedAt: serverTimestamp()
    })
  }

  async function moveTaskToSection(taskId: string, newSectionId: string): Promise<void> {
    error.value = null
    const sectionIndex = sections.value.findIndex((s) => s.id === newSectionId)
    const total = sections.value.length
    // Derive a status from section position for inbox/my-tasks compatibility
    let status: TaskStatus = 'in_progress'
    if (total <= 1 || sectionIndex === 0) status = 'todo'
    else if (sectionIndex === total - 1) status = 'done'
    else if (sectionIndex === 1) status = 'in_progress'
    else status = 'review'

    const order = tasks.value.filter((t) => t.sectionId === newSectionId).length
    await updateDoc(doc(db, 'tasks', taskId), {
      sectionId: newSectionId,
      status,
      order,
      updatedAt: serverTimestamp()
    })
  }

  async function deleteTask(id: string): Promise<void> {
    error.value = null
    await deleteDoc(doc(db, 'tasks', id))
  }

  function getTaskById(id: string): Task | undefined {
    return tasks.value.find((t) => t.id === id)
  }

  // ── Section CRUD ──────────────────────────────────────────────────────────

  async function createSection(projectId: string, name: string): Promise<void> {
    const order = sections.value.length
    await addDoc(collection(db, 'sections'), {
      name,
      projectId,
      order,
      createdAt: serverTimestamp()
    })
  }

  async function updateSection(id: string, name: string): Promise<void> {
    await updateDoc(doc(db, 'sections', id), { name })
  }

  async function deleteSection(id: string): Promise<void> {
    await deleteDoc(doc(db, 'sections', id))
  }

  return {
    tasks,
    sections,
    loading,
    error,
    kanbanColumns,
    tasksBySection,
    sectionColumns,
    subscribeToProject,
    unsubscribeFromProject,
    createTask,
    updateTask,
    moveTask,
    moveTaskToSection,
    deleteTask,
    getTaskById,
    createSection,
    updateSection,
    deleteSection
  }
})
