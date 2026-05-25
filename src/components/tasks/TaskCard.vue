<template>
  <div
    class="bg-white rounded-lg border border-gray-200 p-3 shadow-card hover:shadow-md transition-all cursor-pointer group"
    @click="$router.push(`/project/${task.projectId}/task/${task.id}`)"
  >
    <!-- Priority indicator -->
    <div class="flex items-start gap-2 mb-2">
      <span
        class="badge mt-0.5 flex-shrink-0"
        :class="priorityClass"
      >
        {{ priorityLabel }}
      </span>
      <h3 class="text-sm font-medium text-gray-800 leading-snug line-clamp-2 flex-1">
        {{ task.title }}
      </h3>
    </div>

    <!-- Description snippet -->
    <p v-if="task.description" class="text-xs text-gray-500 line-clamp-1 mb-2">
      {{ task.description }}
    </p>

    <!-- Tags -->
    <div v-if="task.tags && task.tags.length" class="flex flex-wrap gap-1 mb-2">
      <span
        v-for="tag in task.tags.slice(0, 3)"
        :key="tag"
        class="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
      >
        {{ tag }}
      </span>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
      <!-- Dates -->
      <div class="flex items-center gap-2">
        <div v-if="task.startDate" class="flex items-center gap-1 text-gray-400" :title="'Start: ' + formattedStartDate">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span class="text-xs">{{ formattedStartDate }}</span>
        </div>
        <span v-if="task.startDate && task.dueDate" class="text-xs text-gray-300">→</span>
        <div v-if="task.dueDate" class="flex items-center gap-1" :class="dueDateClass">
          <svg v-if="!task.startDate" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span class="text-xs">{{ formattedDueDate }}</span>
        </div>
      </div>
      <span v-if="!task.startDate && !task.dueDate"></span>

      <!-- Assignee avatar -->
      <div
        v-if="assignee"
        class="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
        :class="assignee.photoURL ? '' : 'bg-primary-500'"
        :title="assignee.displayName"
      >
        <img v-if="assignee.photoURL" :src="assignee.photoURL" :alt="assignee.displayName" class="w-full h-full object-cover" />
        <span v-else class="text-xs font-bold text-white">{{ membersStore.getInitials(assignee.displayName) }}</span>
      </div>
    </div>

    <!-- Move buttons (shown on hover) -->
    <div v-if="otherSections.length" class="hidden group-hover:flex items-center gap-1 mt-2 pt-2 border-t border-gray-100 flex-wrap">
      <span class="text-xs text-gray-400 mr-1">Move to:</span>
      <button
        v-for="s in otherSections"
        :key="s.id"
        @click.stop="$emit('move', task.id, s.id)"
        class="px-2 py-0.5 text-xs rounded border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
      >
        {{ s.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMembersStore } from '@/stores/members'
import { useTasksStore } from '@/stores/tasks'
import type { Task } from '@/types'

const props = defineProps<{ task: Task }>()
const emit = defineEmits<{ move: [taskId: string, sectionId: string] }>()

const membersStore = useMembersStore()
const tasksStore = useTasksStore()
const assignee = computed(() => props.task.assigneeId ? membersStore.getMemberById(props.task.assigneeId) : null)
const otherSections = computed(() => tasksStore.sections.filter((s) => s.id !== props.task.sectionId))

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

const formattedStartDate = computed(() => {
  if (!props.task.startDate) return ''
  const d = props.task.startDate
  const date = 'toDate' in d ? (d as any).toDate() : new Date(d as any)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
