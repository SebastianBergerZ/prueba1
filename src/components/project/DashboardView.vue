<template>
  <div class="h-full overflow-y-auto">
    <div class="p-6 max-w-7xl">

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="card p-4">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Tasks</p>
          <p class="text-4xl font-bold text-gray-900">{{ total }}</p>
        </div>
        <div class="card p-4 border-l-4 border-emerald-400">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Completed</p>
          <p class="text-4xl font-bold text-emerald-600">{{ completed }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ completionRate }}% completion rate</p>
        </div>
        <div class="card p-4 border-l-4 border-blue-400">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Incomplete</p>
          <p class="text-4xl font-bold text-blue-600">{{ incomplete }}</p>
        </div>
        <div class="card p-4 border-l-4 border-red-400">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Overdue</p>
          <p class="text-4xl font-bold text-red-500">{{ overdue }}</p>
          <p class="text-xs text-gray-400 mt-1">not yet done</p>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="total === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <svg class="w-14 h-14 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p class="text-sm text-gray-400">No tasks yet — add tasks to see your dashboard.</p>
      </div>

      <!-- Charts grid -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <!-- Donut: by completion status -->
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Total Tasks by Completion Status</h3>
          <div class="h-52">
            <Doughnut :data="donutData" :options="donutOptions" />
          </div>
        </div>

        <!-- Vertical bar: incomplete by section -->
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Incomplete Tasks by Section</h3>
          <div class="h-52">
            <Bar :data="sectionBarData" :options="sectionBarOptions" />
          </div>
        </div>

        <!-- Lollipop: upcoming by assignee (custom SVG) -->
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-0.5">Upcoming Tasks by Assignee</h3>
          <p class="text-xs text-gray-400 mb-4">Future due dates, not yet done</p>
          <div v-if="upcomingByAssignee.length === 0"
            class="flex items-center justify-center h-44 text-xs text-gray-400 italic">
            No upcoming tasks with due dates assigned
          </div>
          <div v-else class="space-y-3.5 py-1 px-1 overflow-hidden">
            <div
              v-for="entry in upcomingByAssignee.slice(0, 8)"
              :key="entry.name"
              class="flex items-center gap-3"
            >
              <span class="text-xs text-gray-500 w-24 truncate text-right flex-shrink-0">{{ entry.name }}</span>
              <div class="flex-1 flex items-center min-w-0">
                <div
                  class="h-0.5 rounded-full bg-indigo-300 flex-shrink-0 transition-all duration-500"
                  :style="{ width: lollipopWidth(entry.count) + '%' }"
                ></div>
                <div class="w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow flex-shrink-0 -ml-1"></div>
              </div>
              <span class="text-xs font-bold text-indigo-700 w-5 text-right flex-shrink-0">{{ entry.count }}</span>
            </div>
          </div>
        </div>

        <!-- Stacked area: task activity over time -->
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Task Completion Over Time (8 weeks)</h3>
          <div class="h-52">
            <Line :data="areaData" :options="areaOptions" />
          </div>
        </div>

        <!-- Horizontal bar: priority distribution -->
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Tasks by Priority</h3>
          <div class="h-52">
            <Bar :data="priorityData" :options="priorityOptions" />
          </div>
        </div>

        <!-- Stacked bar: workload by assignee -->
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Workload by Assignee</h3>
          <div v-if="workloadByAssignee.length === 0"
            class="flex items-center justify-center h-52 text-xs text-gray-400 italic">
            No tasks assigned to members yet
          </div>
          <div v-else class="h-52">
            <Bar :data="workloadData" :options="workloadOptions" />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Doughnut, Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js'
import { useMembersStore } from '@/stores/members'
import type { Task, Section } from '@/types'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler)

const props = defineProps<{
  tasks: Task[]
  sections: Section[]
}>()

const membersStore = useMembersStore()

onMounted(() => {
  if (membersStore.members.length === 0) membersStore.fetchMembers()
})

function toDate(d: any): Date {
  return 'toDate' in d ? d.toDate() : new Date(d)
}

const todayBase = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})()

// ── KPIs ─────────────────────────────────────────────────────────────────────

const total = computed(() => props.tasks.length)
const completed = computed(() => props.tasks.filter(t => t.status === 'done').length)
const incomplete = computed(() => props.tasks.filter(t => t.status !== 'done').length)
const completionRate = computed(() =>
  total.value === 0 ? 0 : Math.round((completed.value / total.value) * 100)
)
const overdue = computed(() =>
  props.tasks.filter(t => {
    if (t.status === 'done' || !t.dueDate) return false
    const d = toDate(t.dueDate)
    d.setHours(0, 0, 0, 0)
    return d < todayBase
  }).length
)

// ── Donut: by status ──────────────────────────────────────────────────────────

const donutData = computed(() => ({
  labels: ['To Do', 'In Progress', 'Review', 'Done'],
  datasets: [{
    data: [
      props.tasks.filter(t => t.status === 'todo').length,
      props.tasks.filter(t => t.status === 'in_progress').length,
      props.tasks.filter(t => t.status === 'review').length,
      completed.value
    ],
    backgroundColor: ['#94a3b8', '#60a5fa', '#fbbf24', '#34d399'],
    borderWidth: 2,
    borderColor: '#ffffff',
    hoverOffset: 6
  }]
}))

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'right' as const,
      labels: { boxWidth: 12, padding: 14, font: { size: 11 } }
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `  ${ctx.label}: ${ctx.raw}`
      }
    }
  }
}

// ── Vertical bar: incomplete by section ───────────────────────────────────────

const sectionBarData = computed(() => ({
  labels: props.sections.map(s => s.name),
  datasets: [{
    label: 'Incomplete tasks',
    data: props.sections.map(s =>
      props.tasks.filter(t => t.sectionId === s.id && t.status !== 'done').length
    ),
    backgroundColor: '#818cf8',
    hoverBackgroundColor: '#6366f1',
    borderRadius: 4
  }]
}))

const sectionBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { precision: 0, font: { size: 11 } }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 } }
    }
  }
}

// ── Lollipop: upcoming by assignee (CSS/HTML) ─────────────────────────────────

const upcomingByAssignee = computed(() => {
  const upcoming = props.tasks.filter(t => {
    if (t.status === 'done' || !t.dueDate) return false
    const d = toDate(t.dueDate)
    d.setHours(0, 0, 0, 0)
    return d >= todayBase
  })
  const map: Record<string, number> = {}
  for (const task of upcoming) {
    const key = task.assigneeId ?? '__unassigned'
    map[key] = (map[key] ?? 0) + 1
  }
  return Object.entries(map)
    .map(([uid, count]) => {
      const member = membersStore.members.find(m => m.uid === uid)
      const name = uid === '__unassigned' ? 'Unassigned' : (member?.displayName ?? 'Unknown')
      return { name, count }
    })
    .sort((a, b) => b.count - a.count)
})

const maxUpcoming = computed(() =>
  Math.max(...upcomingByAssignee.value.map(e => e.count), 1)
)

function lollipopWidth(count: number): number {
  return Math.max(3, (count / maxUpcoming.value) * 82)
}

// ── Stacked area: task completion over time ───────────────────────────────────

function getWeekLabel(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay()) // align to Sunday
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const areaData = computed(() => {
  const weeks: string[] = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date(todayBase)
    d.setDate(d.getDate() - i * 7)
    weeks.push(getWeekLabel(d))
  }
  const createdArr = new Array(8).fill(0)
  const completedArr = new Array(8).fill(0)

  for (const task of props.tasks) {
    const ci = weeks.indexOf(getWeekLabel(toDate(task.createdAt as any)))
    if (ci !== -1) createdArr[ci]++
    if (task.status === 'done') {
      const ui = weeks.indexOf(getWeekLabel(toDate(task.updatedAt as any)))
      if (ui !== -1) completedArr[ui]++
    }
  }

  return {
    labels: weeks,
    datasets: [
      {
        label: 'Completed',
        data: completedArr,
        fill: true,
        backgroundColor: 'rgba(52,211,153,0.25)',
        borderColor: '#34d399',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5
      },
      {
        label: 'Created',
        data: createdArr,
        fill: true,
        backgroundColor: 'rgba(129,140,248,0.15)',
        borderColor: '#818cf8',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  }
})

const areaOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: { boxWidth: 10, padding: 12, font: { size: 11 } }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { precision: 0, font: { size: 11 } }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 }, maxRotation: 45 }
    }
  }
}

// ── Horizontal bar: by priority ───────────────────────────────────────────────

const priorityData = computed(() => ({
  labels: ['Low', 'Medium', 'High', 'Urgent'],
  datasets: [{
    label: 'Tasks',
    data: (['low', 'medium', 'high', 'urgent'] as const).map(p =>
      props.tasks.filter(t => t.priority === p).length
    ),
    backgroundColor: ['#94a3b8', '#60a5fa', '#f97316', '#ef4444'],
    borderRadius: 4,
    borderSkipped: false
  }]
}))

const priorityOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: { label: (ctx: any) => `  ${ctx.raw} tasks` }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { precision: 0, font: { size: 11 } }
    },
    y: {
      grid: { display: false },
      ticks: { font: { size: 12 } }
    }
  }
}

// ── Stacked bar: workload by assignee ─────────────────────────────────────────

const workloadByAssignee = computed(() => {
  const map: Record<string, { done: number; active: number }> = {}
  for (const task of props.tasks) {
    const key = task.assigneeId ?? '__unassigned'
    if (!map[key]) map[key] = { done: 0, active: 0 }
    if (task.status === 'done') map[key].done++
    else map[key].active++
  }
  return Object.entries(map)
    .map(([uid, counts]) => {
      const member = membersStore.members.find(m => m.uid === uid)
      const name = uid === '__unassigned' ? 'Unassigned' : (member?.displayName ?? 'Unknown')
      return { name, ...counts }
    })
    .sort((a, b) => (b.done + b.active) - (a.done + a.active))
})

const workloadData = computed(() => ({
  labels: workloadByAssignee.value.map(e => e.name),
  datasets: [
    {
      label: 'Done',
      data: workloadByAssignee.value.map(e => e.done),
      backgroundColor: '#34d399',
      stack: 'w',
      borderRadius: 2
    },
    {
      label: 'Active',
      data: workloadByAssignee.value.map(e => e.active),
      backgroundColor: '#818cf8',
      stack: 'w',
      borderRadius: 2
    }
  ]
}))

const workloadOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: { boxWidth: 10, padding: 10, font: { size: 11 } }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      stacked: true,
      grid: { color: '#f1f5f9' },
      ticks: { precision: 0, font: { size: 11 } }
    },
    x: {
      stacked: true,
      grid: { display: false },
      ticks: { font: { size: 11 } }
    }
  }
}
</script>
