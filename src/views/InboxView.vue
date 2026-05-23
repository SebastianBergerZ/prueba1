<template>
  <div class="p-6 max-w-3xl">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-xl font-bold text-gray-900">Inbox</h1>
      <p class="text-sm text-gray-500 mt-0.5">Recent activity and updates on your tasks</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="card px-4 py-3 flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-gray-200 animate-pulse flex-shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          <div class="h-3 w-1/2 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- Overdue section -->
      <div v-if="overdue.length > 0" class="mb-6">
        <h2 class="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Overdue ({{ overdue.length }})
        </h2>
        <div class="card divide-y divide-gray-100 overflow-hidden">
          <InboxItem
            v-for="item in overdue"
            :key="item.task.id"
            :item="item"
            type="overdue"
          />
        </div>
      </div>

      <!-- Due today section -->
      <div v-if="dueToday.length > 0" class="mb-6">
        <h2 class="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Due today ({{ dueToday.length }})
        </h2>
        <div class="card divide-y divide-gray-100 overflow-hidden">
          <InboxItem
            v-for="item in dueToday"
            :key="item.task.id"
            :item="item"
            type="due-today"
          />
        </div>
      </div>

      <!-- Recently assigned -->
      <div v-if="recentlyAssigned.length > 0" class="mb-6">
        <h2 class="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Recently assigned to you
        </h2>
        <div class="card divide-y divide-gray-100 overflow-hidden">
          <InboxItem
            v-for="item in recentlyAssigned"
            :key="item.task.id"
            :item="item"
            type="assigned"
          />
        </div>
      </div>

      <!-- Recently updated -->
      <div v-if="recentlyUpdated.length > 0" class="mb-6">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Recently updated
        </h2>
        <div class="card divide-y divide-gray-100 overflow-hidden">
          <InboxItem
            v-for="item in recentlyUpdated"
            :key="item.task.id"
            :item="item"
            type="updated"
          />
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="isEmpty" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg class="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-600 mb-1">You're all caught up!</p>
        <p class="text-xs text-gray-400">No overdue, due today, or recent tasks to show</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineComponent, h } from 'vue'
import { useRouter } from 'vue-router'
import { collection, query, where, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import type { Task } from '@/types'

const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const router = useRouter()

const allTasks = ref<Task[]>([])
const loading = ref(true)
let unsubscribe: Unsubscribe | null = null

interface InboxTask { task: Task; projectName: string }

function toDate(val: any): Date {
  return 'toDate' in val ? val.toDate() : new Date(val)
}

function toMs(val: any): number {
  return toDate(val).getTime()
}

const withProject = computed<InboxTask[]>(() =>
  allTasks.value.map((t) => ({
    task: t,
    projectName: projectsStore.getProjectById(t.projectId)?.name ?? 'Unknown project'
  }))
)

const now = new Date()
const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999)
const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

const overdue = computed(() =>
  withProject.value.filter((i) => {
    if (!i.task.dueDate || i.task.status === 'done') return false
    return toDate(i.task.dueDate) < todayStart
  })
)

const dueToday = computed(() =>
  withProject.value.filter((i) => {
    if (!i.task.dueDate || i.task.status === 'done') return false
    const d = toDate(i.task.dueDate)
    return d >= todayStart && d <= todayEnd
  })
)

const recentlyAssigned = computed(() =>
  withProject.value
    .filter((i) => {
      if (i.task.status === 'done') return false
      if (!i.task.createdAt) return false
      const created = toDate(i.task.createdAt)
      const isRecent = created >= sevenDaysAgo
      // Not already in overdue or dueToday
      const notOverdue = !overdue.value.find((o) => o.task.id === i.task.id)
      const notDueToday = !dueToday.value.find((o) => o.task.id === i.task.id)
      return isRecent && notOverdue && notDueToday
    })
    .sort((a, b) => toMs(b.task.createdAt) - toMs(a.task.createdAt))
    .slice(0, 10)
)

const recentlyUpdated = computed(() => {
  const assignedIds = new Set([
    ...overdue.value.map((i) => i.task.id),
    ...dueToday.value.map((i) => i.task.id),
    ...recentlyAssigned.value.map((i) => i.task.id)
  ])
  return withProject.value
    .filter((i) => {
      if (assignedIds.has(i.task.id)) return false
      if (!i.task.updatedAt) return false
      return toDate(i.task.updatedAt) >= sevenDaysAgo
    })
    .sort((a, b) => toMs(b.task.updatedAt) - toMs(a.task.updatedAt))
    .slice(0, 10)
})

const isEmpty = computed(() =>
  overdue.value.length === 0 &&
  dueToday.value.length === 0 &&
  recentlyAssigned.value.length === 0 &&
  recentlyUpdated.value.length === 0
)

// InboxItem as inline component
const InboxItem = defineComponent({
  props: {
    item: { type: Object as () => InboxTask, required: true },
    type: { type: String, required: true }
  },
  setup(props) {
    const iconColor = computed(() => {
      if (props.type === 'overdue') return 'text-red-400'
      if (props.type === 'due-today') return 'text-orange-400'
      if (props.type === 'assigned') return 'text-blue-400'
      return 'text-gray-400'
    })

    const label = computed(() => {
      if (props.type === 'overdue') return 'Overdue'
      if (props.type === 'due-today') return 'Due today'
      if (props.type === 'assigned') return 'Assigned to you'
      return 'Updated'
    })

    function navigate() {
      router.push(`/project/${props.item.task.projectId}/task/${props.item.task.id}`)
    }

    return () => h('div', {
      class: 'flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors',
      onClick: navigate
    }, [
      h('div', { class: `w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 ${iconColor.value}` }, [
        h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
          h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' })
        ])
      ]),
      h('div', { class: 'flex-1 min-w-0' }, [
        h('p', { class: 'text-sm font-medium text-gray-900 truncate' }, props.item.task.title),
        h('p', { class: 'text-xs text-gray-400 mt-0.5' }, [
          h('span', { class: `font-medium ${iconColor.value}` }, label.value),
          ' · ',
          props.item.projectName
        ])
      ])
    ])
  }
})

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
    allTasks.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task))
    loading.value = false
  }, () => { loading.value = false })
})

onUnmounted(() => { if (unsubscribe) unsubscribe() })
</script>
