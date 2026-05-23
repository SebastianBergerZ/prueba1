import { defineStore } from 'pinia'
import { ref } from 'vue'
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
import type { Project, CreateProjectPayload, ProjectColor } from '@/types'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let unsubscribe: Unsubscribe | null = null

  const authStore = useAuthStore()

  // ── Real-time listener ────────────────────────────────────────────────────

  function subscribeToProjects(workspaceId: string): void {
    if (unsubscribe) unsubscribe()

    loading.value = true
    const q = query(
      collection(db, 'projects'),
      where('workspaceId', '==', workspaceId)
    )

    unsubscribe = onSnapshot(
      q,
      (snap) => {
        projects.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project))
        loading.value = false
      },
      (err) => {
        error.value = err.message
        loading.value = false
      }
    )
  }

  function unsubscribeFromProjects(): void {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    projects.value = []
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async function createProject(payload: CreateProjectPayload): Promise<string> {
    error.value = null
    const uid = authStore.uid
    if (!uid) throw new Error('Not authenticated')

    const docRef = await addDoc(collection(db, 'projects'), {
      name: payload.name,
      description: payload.description,
      color: payload.color,
      workspaceId: payload.workspaceId,
      ownerId: uid,
      members: [uid],
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Create default sections for the new project
    await createDefaultSections(docRef.id)

    return docRef.id
  }

  async function createDefaultSections(projectId: string): Promise<void> {
    const defaults = [
      { name: 'To Do', order: 0 },
      { name: 'In Progress', order: 1 },
      { name: 'Review', order: 2 },
      { name: 'Done', order: 3 }
    ]
    await Promise.all(
      defaults.map((s) =>
        addDoc(collection(db, 'sections'), {
          name: s.name,
          projectId,
          order: s.order,
          createdAt: serverTimestamp()
        })
      )
    )
  }

  async function updateProject(
    id: string,
    data: Partial<Pick<Project, 'name' | 'description' | 'color' | 'status'>>
  ): Promise<void> {
    error.value = null
    await updateDoc(doc(db, 'projects', id), {
      ...data,
      updatedAt: serverTimestamp()
    })
  }

  async function deleteProject(id: string): Promise<void> {
    error.value = null
    await deleteDoc(doc(db, 'projects', id))
  }

  function getProjectById(id: string): Project | undefined {
    return projects.value.find((p) => p.id === id)
  }

  // ── Color helpers ─────────────────────────────────────────────────────────

  const PROJECT_COLORS: { value: ProjectColor; label: string; bg: string; text: string; border: string }[] = [
    { value: 'red', label: 'Red', bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
    { value: 'orange', label: 'Orange', bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500' },
    { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500' },
    { value: 'green', label: 'Green', bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' },
    { value: 'teal', label: 'Teal', bg: 'bg-teal-500', text: 'text-teal-500', border: 'border-teal-500' },
    { value: 'blue', label: 'Blue', bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
    { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-500' },
    { value: 'purple', label: 'Purple', bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500' },
    { value: 'pink', label: 'Pink', bg: 'bg-pink-500', text: 'text-pink-500', border: 'border-pink-500' },
    { value: 'gray', label: 'Gray', bg: 'bg-gray-500', text: 'text-gray-500', border: 'border-gray-500' }
  ]

  function getColorClasses(color: ProjectColor) {
    return PROJECT_COLORS.find((c) => c.value === color) ?? PROJECT_COLORS[5]
  }

  return {
    projects,
    loading,
    error,
    PROJECT_COLORS,
    subscribeToProjects,
    unsubscribeFromProjects,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    getColorClasses
  }
})
