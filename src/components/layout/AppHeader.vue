<template>
  <header class="bg-white border-b border-gray-200 flex items-center justify-between px-6 py-3 flex-shrink-0 z-10">
    <!-- Left: page title -->
    <div class="flex items-center gap-2 min-w-0">
      <h1 class="text-base font-semibold text-gray-900 truncate">{{ pageTitle }}</h1>
    </div>

    <!-- Center: Search -->
    <div class="flex-1 max-w-md mx-6">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search tasks, projects..."
          class="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 border border-transparent rounded-md focus:outline-none focus:bg-white focus:border-gray-300 transition-colors"
        />
      </div>
    </div>

    <!-- Right: actions + avatar -->
    <div class="flex items-center gap-2">

      <!-- Notifications bell -->
      <div class="relative" ref="notifRef">
        <button
          @click="notifOpen = !notifOpen"
          class="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <!-- Badge -->
          <span
            v-if="urgentCount > 0"
            class="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none"
          >
            {{ urgentCount > 9 ? '9+' : urgentCount }}
          </span>
        </button>

        <!-- Notifications dropdown -->
        <Transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="notifOpen"
            class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-dropdown border border-gray-100 z-50 overflow-hidden"
          >
            <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p class="text-sm font-semibold text-gray-900">Notifications</p>
              <span v-if="urgentCount > 0" class="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium">
                {{ urgentCount }} urgent
              </span>
            </div>

            <!-- Loading -->
            <div v-if="notifLoading" class="p-4 text-center">
              <div class="w-5 h-5 border-2 border-gray-200 border-t-primary-500 rounded-full animate-spin mx-auto"></div>
            </div>

            <!-- Notification items -->
            <div v-else-if="notifications.length > 0" class="max-h-80 overflow-y-auto divide-y divide-gray-100">
              <button
                v-for="n in notifications"
                :key="n.task.id"
                @click="goToTask(n.task)"
                class="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <span class="mt-1 w-2 h-2 rounded-full flex-shrink-0" :class="n.dotColor"></span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ n.task.title }}</p>
                  <p class="text-xs mt-0.5" :class="n.labelColor">{{ n.label }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ n.projectName }}</p>
                </div>
              </button>
            </div>

            <!-- Empty -->
            <div v-else class="px-4 py-8 text-center">
              <svg class="w-8 h-8 text-gray-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p class="text-sm text-gray-500">You're all caught up!</p>
            </div>

            <div class="border-t border-gray-100 px-4 py-2">
              <button
                @click="goToInbox"
                class="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                View all in Inbox →
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <!-- User menu -->
      <div class="relative" ref="userMenuRef">
        <button
          @click="userMenuOpen = !userMenuOpen"
          class="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center overflow-hidden">
            <img v-if="authStore.photoURL" :src="authStore.photoURL" :alt="authStore.displayName" class="w-full h-full object-cover" />
            <span v-else class="text-xs font-bold text-white">{{ initials }}</span>
          </div>
        </button>

        <Transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="userMenuOpen"
            class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-dropdown border border-gray-100 py-1 z-50"
          >
            <div class="px-4 py-3 border-b border-gray-100">
              <p class="text-sm font-medium text-gray-900">{{ authStore.displayName }}</p>
              <p class="text-xs text-gray-500 truncate">{{ authStore.user?.email }}</p>
            </div>
            <div class="border-t border-gray-100 py-1">
              <button
                @click="handleLogout"
                class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { collection, query, where, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import type { Task } from '@/types'

const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const router = useRouter()
const route = useRoute()

const searchQuery = ref('')
const userMenuOpen = ref(false)
const notifOpen = ref(false)
const notifLoading = ref(true)
const userMenuRef = ref<HTMLElement | null>(null)
const notifRef = ref<HTMLElement | null>(null)

const myTasks = ref<Task[]>([])
let unsubscribe: Unsubscribe | null = null

// ── Computed ────────────────────────────────────────────────────────────────

const initials = computed(() =>
  authStore.displayName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
)

const pageTitle = computed(() => {
  const nameMap: Record<string, string> = {
    dashboard: 'Home',
    'my-tasks': 'My Tasks',
    inbox: 'Inbox',
    members: 'Members',
    'task-detail': 'Task Detail'
  }
  if (route.name === 'project') {
    return projectsStore.getProjectById(route.params.id as string)?.name ?? 'Project'
  }
  return nameMap[route.name as string] ?? 'Qanty'
})

function toDate(val: any): Date {
  return 'toDate' in val ? val.toDate() : new Date(val)
}

const todayStart = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })()
const todayEnd = (() => { const d = new Date(); d.setHours(23, 59, 59, 999); return d })()
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

interface Notification { task: Task; label: string; labelColor: string; dotColor: string; projectName: string }

const notifications = computed<Notification[]>(() => {
  const result: Notification[] = []
  const seen = new Set<string>()

  for (const task of myTasks.value) {
    if (task.status === 'done' || seen.has(task.id)) continue

    if (task.dueDate) {
      const d = toDate(task.dueDate)
      if (d < todayStart) {
        result.push({ task, label: `Overdue · due ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, labelColor: 'text-red-500', dotColor: 'bg-red-500', projectName: projectsStore.getProjectById(task.projectId)?.name ?? '' })
        seen.add(task.id)
        continue
      }
      if (d >= todayStart && d <= todayEnd) {
        result.push({ task, label: 'Due today', labelColor: 'text-orange-500', dotColor: 'bg-orange-400', projectName: projectsStore.getProjectById(task.projectId)?.name ?? '' })
        seen.add(task.id)
        continue
      }
    }

    if (task.createdAt && toDate(task.createdAt) >= sevenDaysAgo) {
      result.push({ task, label: 'Recently assigned to you', labelColor: 'text-blue-500', dotColor: 'bg-blue-400', projectName: projectsStore.getProjectById(task.projectId)?.name ?? '' })
      seen.add(task.id)
    }
  }

  return result.slice(0, 15)
})

const urgentCount = computed(() =>
  notifications.value.filter((n) => n.dotColor === 'bg-red-500' || n.dotColor === 'bg-orange-400').length
)

// ── Actions ─────────────────────────────────────────────────────────────────

function goToTask(task: Task) {
  notifOpen.value = false
  router.push(`/project/${task.projectId}/task/${task.id}`)
}

function goToInbox() {
  notifOpen.value = false
  router.push('/inbox')
}

async function handleLogout() {
  userMenuOpen.value = false
  await authStore.logout()
  router.push('/login')
}

function handleOutsideClick(e: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) userMenuOpen.value = false
  if (notifRef.value && !notifRef.value.contains(e.target as Node)) notifOpen.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick)

  const uid = authStore.uid
  const workspaceId = authStore.currentWorkspace?.id
  if (!uid || !workspaceId) { notifLoading.value = false; return }

  const q = query(
    collection(db, 'tasks'),
    where('workspaceId', '==', workspaceId),
    where('assigneeId', '==', uid)
  )
  unsubscribe = onSnapshot(q, (snap) => {
    myTasks.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task))
    notifLoading.value = false
  }, () => { notifLoading.value = false })
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleOutsideClick)
  if (unsubscribe) unsubscribe()
})
</script>
