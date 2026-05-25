<template>
  <div class="p-6">
    <!-- Month navigation -->
    <div class="flex items-center justify-between mb-4">
      <button @click="prevMonth" class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h2 class="text-sm font-semibold text-gray-800">{{ monthName }} {{ year }}</h2>
      <button @click="nextMonth" class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Day headers -->
    <div class="grid grid-cols-7 mb-1">
      <div
        v-for="day in ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']"
        :key="day"
        class="text-center text-xs font-semibold text-gray-400 py-2"
      >{{ day }}</div>
    </div>

    <!-- Calendar grid -->
    <div class="grid grid-cols-7 border-l border-t border-gray-200">
      <div
        v-for="cell in calendarCells"
        :key="cell.key"
        class="border-r border-b border-gray-200 min-h-24 p-1.5 overflow-hidden"
        :class="cell.isCurrentMonth ? 'bg-white' : 'bg-gray-50'"
      >
        <!-- Day number -->
        <div
          class="flex items-center justify-center w-6 h-6 mb-1 rounded-full text-xs font-medium"
          :class="cell.isToday
            ? 'bg-primary-600 text-white'
            : cell.isCurrentMonth ? 'text-gray-700' : 'text-gray-300'"
        >{{ cell.day }}</div>

        <!-- Events -->
        <div class="space-y-0.5">
          <template v-for="ct in cell.events.slice(0, 3)" :key="ct.task.id + cell.key">
            <div
              @click="$router.push(`/project/${ct.task.projectId}/task/${ct.task.id}`)"
              class="h-5 flex items-center text-xs cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
              :class="eventClass(ct)"
            >
              <span v-if="ct.isFirst" class="truncate leading-none">{{ ct.task.title }}</span>
              <span v-else class="leading-none">&nbsp;</span>
            </div>
          </template>
          <div v-if="cell.events.length > 3" class="px-1 text-xs text-gray-400">
            +{{ cell.events.length - 3 }} more
          </div>
        </div>
      </div>
    </div>

    <!-- Unscheduled tasks -->
    <div class="mt-6">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Unscheduled <span class="font-normal normal-case">— no due date</span>
      </p>
      <div v-if="unscheduledTasks.length" class="flex flex-wrap gap-2">
        <div
          v-for="task in unscheduledTasks"
          :key="task.id"
          @click="$router.push(`/project/${task.projectId}/task/${task.id}`)"
          class="px-2.5 py-1 rounded-md text-xs cursor-pointer hover:opacity-80 transition-opacity"
          :class="taskColorClass(task)"
        >{{ task.title }}</div>
      </div>
      <p v-else class="text-xs text-gray-400 italic">All tasks have a due date.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Task } from '@/types'

interface CellEvent {
  task: Task
  isFirst: boolean  // first visible day of this event
  isLast: boolean   // last visible day
  isRange: boolean  // spans more than one day
}

const props = defineProps<{ tasks: Task[] }>()

const today = new Date()
const currentMonth = ref(today.getMonth())
const currentYear = ref(today.getFullYear())

const year = computed(() => currentYear.value)
const monthName = computed(() =>
  new Date(currentYear.value, currentMonth.value, 1).toLocaleString('en-US', { month: 'long' })
)

function prevMonth() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
}
function nextMonth() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
}

function toDateOnly(d: any): Date {
  const date = 'toDate' in d ? d.toDate() : new Date(d)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isTaskOnDate(task: Task, date: Date): boolean {
  const start = task.startDate ? toDateOnly(task.startDate) : null
  const due = task.dueDate ? toDateOnly(task.dueDate) : null
  if (!start && !due) return false
  if (start && due) return date >= start && date <= due
  if (due) return date.getTime() === due.getTime()
  if (start) return date.getTime() === start.getTime()
  return false
}

function buildCellEvents(date: Date): CellEvent[] {
  return props.tasks
    .filter(task => isTaskOnDate(task, date))
    .map(task => {
      const start = task.startDate ? toDateOnly(task.startDate) : null
      const due = task.dueDate ? toDateOnly(task.dueDate) : null
      const isRange = !!(start && due && start.getTime() !== due.getTime())
      const isFirst = isRange ? date.getTime() === start!.getTime() : true
      const isLast = isRange ? date.getTime() === due!.getTime() : true
      return { task, isFirst, isLast, isRange }
    })
}

const calendarCells = computed(() => {
  const y = currentYear.value
  const m = currentMonth.value
  const firstDay = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const daysInPrevMonth = new Date(y, m, 0).getDate()
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`

  const cells = []

  // Prev month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const date = new Date(y, m - 1, day)
    cells.push({ key: `prev-${day}`, day, date, isCurrentMonth: false, isToday: false, events: buildCellEvents(date) })
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(y, m, day)
    const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    cells.push({ key: `cur-${day}`, day, date, isCurrentMonth: true, isToday: dateStr === todayStr, events: buildCellEvents(date) })
  }

  // Next month padding
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let day = 1; day <= remaining; day++) {
      const date = new Date(y, m + 1, day)
      cells.push({ key: `next-${day}`, day, date, isCurrentMonth: false, isToday: false, events: buildCellEvents(date) })
    }
  }

  return cells
})

const unscheduledTasks = computed(() => props.tasks.filter(t => !t.dueDate && !t.startDate))

function taskColorClass(task: Task): string {
  const d = task.dueDate ? toDateOnly(task.dueDate) : null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  if (d && d < now) return 'bg-red-100 text-red-700'
  const map: Record<string, string> = {
    urgent: 'bg-red-50 text-red-600',
    high:   'bg-orange-50 text-orange-600',
    medium: 'bg-blue-50 text-blue-600',
    low:    'bg-gray-100 text-gray-600'
  }
  return map[task.priority] ?? 'bg-gray-100 text-gray-600'
}

function eventClass(ct: CellEvent): string {
  const color = taskColorClass(ct.task)
  if (!ct.isRange) {
    // Single-day chip
    return `px-1.5 rounded ${color}`
  }
  // Multi-day bar: escape cell padding to connect adjacent cells
  if (ct.isFirst && ct.isLast) return `px-1.5 rounded ${color}`
  if (ct.isFirst)  return `pl-1.5 pr-0 -mr-[7px] rounded-l ${color}`
  if (ct.isLast)   return `pr-1.5 pl-0 -ml-[7px] rounded-r ${color}`
  return `-mx-[7px] px-0 rounded-none ${color}`
}
</script>
