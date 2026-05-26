<template>
  <div
    class="flex items-center px-4 py-2.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer group transition-colors"
    @click="$router.push(`/project/${task.projectId}/task/${task.id}`)"
  >
    <!-- Checkbox -->
    <div class="w-10 flex-shrink-0 flex items-center">
      <button
        @click.stop="$emit('move', task.id, isDone ? firstSectionId : lastSectionId)"
        class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
        :class="isDone ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'"
      >
        <svg v-if="isDone" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </div>

    <!-- Title -->
    <div class="flex-1 min-w-48 pr-4 overflow-hidden">
      <span
        class="text-sm truncate block"
        :class="isDone ? 'line-through text-gray-400' : 'text-gray-800'"
      >{{ task.title }}</span>
    </div>

    <!-- Status -->
    <div class="w-24 flex-shrink-0 pr-3">
      <span class="badge text-xs" :class="statusClass">{{ statusLabel }}</span>
    </div>

    <!-- Assignee -->
    <div class="w-28 flex-shrink-0 pr-3 overflow-hidden">
      <span class="text-xs text-gray-600 truncate block">{{ assigneeName }}</span>
    </div>

    <!-- Section -->
    <div class="w-28 flex-shrink-0 pr-3 overflow-hidden">
      <span class="text-xs text-gray-500 truncate block">{{ sectionName }}</span>
    </div>

    <!-- Start date -->
    <div class="w-24 flex-shrink-0 pr-3">
      <span v-if="formattedStartDate" class="text-xs text-gray-400">{{ formattedStartDate }}</span>
      <span v-else class="text-xs text-gray-300">—</span>
    </div>

    <!-- Due date -->
    <div class="w-24 flex-shrink-0 pr-3" :class="dueDateClass">
      <span v-if="formattedDueDate" class="text-xs">{{ formattedDueDate }}</span>
      <span v-else class="text-xs text-gray-300">—</span>
    </div>

    <!-- Priority -->
    <div class="w-20 flex-shrink-0 pr-3">
      <span class="badge text-xs" :class="priorityClass">{{ priorityLabel }}</span>
    </div>

    <!-- Tags -->
    <div class="w-36 flex-shrink-0 pr-3 flex flex-wrap gap-1 overflow-hidden">
      <span
        v-for="tag in task.tags.slice(0, 3)"
        :key="tag"
        class="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded whitespace-nowrap"
      >{{ tag }}</span>
    </div>

    <!-- Description -->
    <div class="w-44 flex-shrink-0 pr-3 overflow-hidden">
      <span class="text-xs text-gray-400 truncate block">{{ task.description || '—' }}</span>
    </div>

    <!-- Custom fields -->
    <div
      v-for="field in customFieldsStore.fields"
      :key="field.id"
      class="w-28 flex-shrink-0 pr-3 overflow-hidden"
    >
      <span class="text-xs text-gray-600 truncate block">{{ formatCustomValue(field) }}</span>
    </div>

    <!-- Actions -->
    <div class="w-12 flex-shrink-0 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
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
import { useMembersStore } from '@/stores/members'
import { useCustomFieldsStore } from '@/stores/customFields'
import type { Task, CustomField } from '@/types'

const props = defineProps<{ task: Task }>()
defineEmits<{
  move: [taskId: string, sectionId: string]
  delete: [taskId: string]
}>()

const tasksStore         = useTasksStore()
const membersStore       = useMembersStore()
const customFieldsStore  = useCustomFieldsStore()

const lastSectionId  = computed(() => tasksStore.sections[tasksStore.sections.length - 1]?.id ?? '')
const firstSectionId = computed(() => tasksStore.sections[0]?.id ?? '')
const isDone         = computed(() => props.task.status === 'done')

const sectionName = computed(() =>
  tasksStore.sections.find(s => s.id === props.task.sectionId)?.name ?? '—'
)

const assigneeName = computed(() => {
  if (!props.task.assigneeId) return '—'
  return membersStore.getMemberById(props.task.assigneeId)?.displayName ?? '—'
})

// ── Status ────────────────────────────────────────────────────────────────────

const statusClass = computed(() => {
  const map: Record<string, string> = {
    todo: 'status-todo', in_progress: 'status-in_progress',
    review: 'status-review', done: 'status-done'
  }
  return map[props.task.status] ?? 'status-todo'
})

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done'
  }
  return map[props.task.status] ?? props.task.status
})

// ── Priority ──────────────────────────────────────────────────────────────────

const priorityClass = computed(() => {
  const map: Record<string, string> = {
    urgent: 'priority-urgent', high: 'priority-high',
    medium: 'priority-medium', low: 'priority-low'
  }
  return map[props.task.priority] ?? 'priority-low'
})

const priorityLabel = computed(() => {
  const map: Record<string, string> = {
    urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low'
  }
  return map[props.task.priority] ?? props.task.priority
})

// ── Dates ─────────────────────────────────────────────────────────────────────

function formatDate(d: any): string {
  const date = 'toDate' in d ? d.toDate() : new Date(d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formattedStartDate = computed(() => props.task.startDate ? formatDate(props.task.startDate) : '')
const formattedDueDate   = computed(() => props.task.dueDate   ? formatDate(props.task.dueDate)   : '')

const dueDateClass = computed(() => {
  if (!props.task.dueDate) return 'text-gray-300'
  const d = 'toDate' in props.task.dueDate
    ? (props.task.dueDate as any).toDate()
    : new Date(props.task.dueDate as any)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  if (d < today) return 'text-red-500'
  if (d.getTime() === today.getTime()) return 'text-orange-500'
  return 'text-gray-400'
})

// ── Custom fields ─────────────────────────────────────────────────────────────

function formatCustomValue(field: CustomField): string {
  const val = props.task.customFieldValues?.[field.id]
  if (val === null || val === undefined || val === '') return '—'
  if (field.type === 'checkbox') return val ? '✓' : '✗'
  if (field.type === 'date') {
    try {
      return new Date(val as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch { return String(val) }
  }
  return String(val)
}
</script>
