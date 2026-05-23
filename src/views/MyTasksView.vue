<template>
  <div class="p-6 max-w-4xl">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-xl font-bold text-gray-900">My Tasks</h1>
      <p class="text-sm text-gray-500 mt-0.5">Tasks assigned to you across all projects</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card divide-y divide-gray-100">
      <div v-for="i in 5" :key="i" class="flex items-center gap-3 px-4 py-3">
        <div class="w-5 h-5 rounded-full bg-gray-200 animate-pulse flex-shrink-0"></div>
        <div class="h-4 flex-1 bg-gray-200 rounded animate-pulse"></div>
        <div class="h-4 w-20 bg-gray-100 rounded animate-pulse"></div>
      </div>
    </div>

    <template v-else>
      <!-- Group by status -->
      <div v-for="group in groupedTasks" :key="group.status" class="mb-6">
        <div
          v-if="group.tasks.length > 0"
          class="card overflow-hidden"
        >
          <!-- Group header -->
          <div
            class="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer"
            @click="toggleGroup(group.status)"
          >
            <svg
              class="w-3.5 h-3.5 text-gray-400 transition-transform"
              :class="{ '-rotate-90': collapsed.has(group.status) }"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
            <span class="w-2 h-2 rounded-full" :class="group.color"></span>
            <span class="text-xs font-semibold text-gray-600">{{ group.label }}</span>
            <span class="text-xs text-gray-400">{{ group.tasks.length }}</span>
          </div>

          <!-- Task rows -->
          <template v-if="!collapsed.has(group.status)">
            <div
              v-for="item in group.tasks"
              :key="item.task.id"
              class="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
              @click="$router.push(`/project/${item.task.projectId}/task/${item.task.id}`)"
            >
              <!-- Status dot -->
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :class="group.color"></span>

              <!-- Title -->
              <span class="flex-1 text-sm text-gray-800 truncate">{{ item.task.title }}</span>

              <!-- Project name -->
              <span class="text-xs text-gray-400 hidden sm:block truncate max-w-[140px]">
                {{ item.projectName }}
              </span>

              <!-- Priority -->
              <span class="badge flex-shrink-0" :class="priorityClass(item.task.priority)">
                {{ item.task.priority }}
              </span>

              <!-- Due date -->
              <span
                v-if="item.task.dueDate"
                class="text-xs flex-shrink-0"
                :class="dueDateClass(item.task.dueDate)"
              >
                {{ formatDate(item.task.dueDate) }}
              </span>
            </div>
          </template>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="allMyTasks.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg class="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-600 mb-1">No tasks assigned to you</p>
        <p class="text-xs text-gray-400">Tasks assigned to you will appear here</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { collection, query, where, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import type { Task, TaskStatus } from '@/types'

const authStore = useAuthStore()
const projectsStore = useProjectsStore()

const myTasks = ref<Task[]>([])
const loading = ref(true)
let unsubscribe: Unsubscribe | null = null

const collapsed = ref<Set<TaskStatus>>(new Set())

const STATUS_GROUPS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'todo', label: 'To Do', color: 'bg-gray-400' },
  { status: 'in_progress', label: 'In Progress', color: 'bg-blue-400' },
  { status: 'review', label: 'Review', color: 'bg-yellow-400' },
  { status: 'done', label: 'Done', color: 'bg-green-400' }
]

const allMyTasks = computed(() => myTasks.value)

const groupedTasks = computed(() =>
  STATUS_GROUPS.map((g) => ({
    ...g,
    tasks: myTasks.value
      .filter((t) => t.status === g.status)
      .map((t) => ({
        task: t,
        projectName: projectsStore.getProjectById(t.projectId)?.name ?? 'Unknown project'
      }))
  }))
)

function toggleGroup(status: TaskStatus) {
  if (collapsed.value.has(status)) {
    collapsed.value.delete(status)
  } else {
    collapsed.value.add(status)
  }
}

function priorityClass(priority: string) {
  const map: Record<string, string> = {
    urgent: 'priority-urgent',
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low'
  }
  return map[priority] ?? 'priority-low'
}

function formatDate(dueDate: any): string {
  const date = 'toDate' in dueDate ? dueDate.toDate() : new Date(dueDate)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function dueDateClass(dueDate: any): string {
  const date = 'toDate' in dueDate ? dueDate.toDate() : new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  if (date < today) return 'text-red-500'
  if (date.getTime() === today.getTime()) return 'text-orange-500'
  return 'text-gray-400'
}

onMounted(() => {
  const uid = authStore.uid
  const workspaceId = authStore.currentWorkspace?.id
  if (!uid || !workspaceId) { loading.value = false; return }

  const q = query(
    collection(db, 'tasks'),
    where('workspaceId', '==', workspaceId),
    where('assigneeId', '==', uid)
  )

  unsubscribe = onSnapshot(q, (snap) => {
    myTasks.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task))
    loading.value = false
  }, () => { loading.value = false })
})

onUnmounted(() => { if (unsubscribe) unsubscribe() })
</script>
