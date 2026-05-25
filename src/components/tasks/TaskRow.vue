<template>
  <div
    class="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer group transition-colors"
    @click="$router.push(`/project/${task.projectId}/task/${task.id}`)"
  >
    <!-- Complete checkbox -->
    <button
      @click.stop="$emit('move', task.id, isDone ? firstSectionId : lastSectionId)"
      class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
      :class="isDone ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'"
    >
      <svg v-if="isDone" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
      </svg>
    </button>

    <!-- Title -->
    <span
      class="flex-1 text-sm text-gray-800 truncate"
      :class="{ 'line-through text-gray-400': isDone }"
    >
      {{ task.title }}
    </span>

    <!-- Tags (hidden on small screens) -->
    <div class="hidden sm:flex items-center gap-1">
      <span
        v-for="tag in task.tags.slice(0, 2)"
        :key="tag"
        class="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded"
      >
        {{ tag }}
      </span>
    </div>

    <!-- Status badge -->
    <span class="badge flex-shrink-0 text-xs" :class="statusClass">
      {{ statusLabel }}
    </span>

    <!-- Priority -->
    <span class="badge flex-shrink-0 text-xs hidden md:inline-flex" :class="priorityClass">
      {{ priorityLabel }}
    </span>

    <!-- Due date -->
    <div
      v-if="task.dueDate"
      class="flex items-center gap-1 flex-shrink-0"
      :class="dueDateClass"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span class="text-xs">{{ formattedDueDate }}</span>
    </div>
    <span v-else class="w-16 flex-shrink-0"></span>

    <!-- Actions (on hover) -->
    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
      <button
        @click.stop="$emit('delete', task.id)"
        class="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        title="Delete task"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import type { Task } from '@/types'

const props = defineProps<{ task: Task }>()
defineEmits<{
  move: [taskId: string, sectionId: string]
  delete: [taskId: string]
}>()

const tasksStore = useTasksStore()
const lastSectionId = computed(() => tasksStore.sections[tasksStore.sections.length - 1]?.id ?? '')
const firstSectionId = computed(() => tasksStore.sections[0]?.id ?? '')
const isDone = computed(() => props.task.sectionId === lastSectionId.value || props.task.status === 'done')

const statusClass = computed(() => {
  const map: Record<string, string> = {
    todo: 'status-todo',
    in_progress: 'status-in_progress',
    review: 'status-review',
    done: 'status-done'
  }
  return map[props.task.status] ?? 'status-todo'
})

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done'
  }
  return map[props.task.status] ?? props.task.status
})

const priorityClass = computed(() => {
  const map: Record<string, string> = {
    urgent: 'priority-urgent',
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low'
  }
  return map[props.task.priority] ?? 'priority-low'
})

const priorityLabel = computed(() => {
  const map: Record<string, string> = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  }
  return map[props.task.priority] ?? props.task.priority
})

const formattedDueDate = computed(() => {
  if (!props.task.dueDate) return ''
  const d = props.task.dueDate
  const date = 'toDate' in d ? (d as any).toDate() : new Date(d as any)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})

const dueDateClass = computed(() => {
  if (!props.task.dueDate) return 'text-gray-400'
  const d = props.task.dueDate
  const date = 'toDate' in d ? (d as any).toDate() : new Date(d as any)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  if (date < today) return 'text-red-500'
  if (date.getTime() === today.getTime()) return 'text-orange-500'
  return 'text-gray-400'
})
</script>
