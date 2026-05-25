<template>
  <div class="p-6">
    <!-- Month navigation -->
    <div class="flex items-center justify-between mb-4">
      <button @click="prevMonth" class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h2 class="text-sm font-semibold text-gray-800">
        {{ monthName }} {{ year }}
      </h2>
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
        class="border-r border-b border-gray-200 min-h-24 p-1.5"
        :class="cell.isCurrentMonth ? 'bg-white' : 'bg-gray-50'"
      >
        <!-- Day number -->
        <div class="flex items-center justify-center w-6 h-6 mb-1 rounded-full text-xs font-medium"
          :class="cell.isToday
            ? 'bg-primary-600 text-white'
            : cell.isCurrentMonth ? 'text-gray-700' : 'text-gray-300'"
        >{{ cell.day }}</div>

        <!-- Tasks on this day -->
        <div class="space-y-0.5 overflow-hidden">
          <div
            v-for="task in cell.tasks.slice(0, 3)"
            :key="task.id"
            @click="$router.push(`/project/${task.projectId}/task/${task.id}`)"
            class="px-1.5 py-0.5 rounded text-xs truncate cursor-pointer transition-opacity hover:opacity-80"
            :class="taskChipClass(task)"
            :title="task.title"
          >{{ task.title }}</div>
          <div
            v-if="cell.tasks.length > 3"
            class="px-1.5 py-0.5 text-xs text-gray-400"
          >+{{ cell.tasks.length - 3 }} more</div>
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
          class="px-2.5 py-1 rounded-md text-xs cursor-pointer transition-opacity hover:opacity-80"
          :class="taskChipClass(task)"
        >{{ task.title }}</div>
      </div>
      <p v-else class="text-xs text-gray-400 italic">All tasks have a due date.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Task } from '@/types'

const props = defineProps<{ tasks: Task[] }>()
const router = useRouter()

const today = new Date()
const currentMonth = ref(today.getMonth())
const currentYear = ref(today.getFullYear())

const year = computed(() => currentYear.value)
const monthName = computed(() =>
  new Date(currentYear.value, currentMonth.value, 1)
    .toLocaleString('en-US', { month: 'long' })
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

function taskDueDate(task: Task): Date | null {
  if (!task.dueDate) return null
  return toDateOnly(task.dueDate)
}

const calendarCells = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells = []
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`

  // Prev month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const date = new Date(year, month - 1, day)
    cells.push({ key: `prev-${day}`, day, date, isCurrentMonth: false, isToday: false, tasks: [] })
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    const isToday = dateStr === todayStr
    const tasks = props.tasks.filter((t) => {
      const d = taskDueDate(t)
      return d && d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
    cells.push({ key: `cur-${day}`, day, date, isCurrentMonth: true, isToday, tasks })
  }

  // Next month padding to complete last row
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let day = 1; day <= remaining; day++) {
      cells.push({ key: `next-${day}`, day, date: new Date(year, month + 1, day), isCurrentMonth: false, isToday: false, tasks: [] })
    }
  }

  return cells
})

const unscheduledTasks = computed(() =>
  props.tasks.filter((t) => !t.dueDate)
)

function taskChipClass(task: Task): string {
  const d = taskDueDate(task)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  if (d && d < now) return 'bg-red-100 text-red-700'
  const map: Record<string, string> = {
    urgent: 'bg-red-50 text-red-600',
    high: 'bg-orange-50 text-orange-600',
    medium: 'bg-blue-50 text-blue-600',
    low: 'bg-gray-100 text-gray-600'
  }
  return map[task.priority] ?? 'bg-gray-100 text-gray-600'
}
</script>
