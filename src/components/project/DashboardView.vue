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

      <!-- Charts -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <!-- ── 1. Donut: by status ─────────────────────────────────────── -->
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Tasks by Completion Status</h3>
          <div class="flex items-center gap-6">
            <svg width="120" height="120" viewBox="0 0 120 120" class="flex-shrink-0">
              <circle cx="60" cy="60" r="52" fill="#f9fafb" />
              <path v-for="seg in donutSegments" :key="seg.label" :d="seg.path" :fill="seg.color" />
              <circle cx="60" cy="60" r="33" fill="white" />
              <text x="60" y="55" text-anchor="middle" font-size="18" font-weight="700" fill="#111827">{{ total }}</text>
              <text x="60" y="69" text-anchor="middle" font-size="9" fill="#9ca3af">tasks</text>
            </svg>
            <div class="space-y-2.5 flex-1 min-w-0">
              <div v-for="seg in donutSegments" :key="seg.label" class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 rounded-sm flex-shrink-0" :style="{ background: seg.color }"></div>
                <span class="text-xs text-gray-600 flex-1 truncate">{{ seg.label }}</span>
                <span class="text-xs font-bold text-gray-800">{{ seg.count }}</span>
                <span class="text-xs text-gray-400 w-8 text-right">{{ pct(seg.count, total) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── 2. Vertical bar: incomplete by section ─────────────────── -->
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-2">Incomplete Tasks by Section</h3>
          <div class="h-48">
            <svg width="100%" height="100%" :viewBox="`0 0 ${BC_VW} ${BC_VH}`" preserveAspectRatio="xMidYMid meet">
              <!-- Grid lines -->
              <template v-for="tick in sectionYTicks" :key="tick.val">
                <line :x1="BC_PL" :y1="tick.y" :x2="BC_VW - BC_PR" :y2="tick.y" stroke="#f3f4f6" stroke-width="1" />
                <text :x="BC_PL - 4" :y="tick.y + 3" text-anchor="end" font-size="8" fill="#9ca3af">{{ tick.val }}</text>
              </template>
              <!-- Bars -->
              <template v-for="bar in sectionBars" :key="bar.name">
                <rect v-if="bar.h > 0" :x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h" rx="2" fill="#818cf8" />
                <text v-if="bar.count > 0" :x="bar.x + bar.w / 2" :y="bar.y - 3"
                  text-anchor="middle" font-size="8" font-weight="600" fill="#6366f1">{{ bar.count }}</text>
                <text :x="bar.x + bar.w / 2" :y="BC_VH - 3"
                  text-anchor="middle" font-size="8" fill="#6b7280">
                  {{ bar.name.length > 9 ? bar.name.slice(0, 8) + '…' : bar.name }}
                </text>
              </template>
              <!-- Zero state -->
              <text v-if="sectionBars.length === 0" :x="BC_VW / 2" :y="BC_VH / 2"
                text-anchor="middle" font-size="10" fill="#d1d5db">No data</text>
            </svg>
          </div>
        </div>

        <!-- ── 3. Lollipop: upcoming by assignee ──────────────────────── -->
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-0.5">Upcoming Tasks by Assignee</h3>
          <p class="text-xs text-gray-400 mb-4">Future due dates, not yet done</p>
          <div v-if="upcomingByAssignee.length === 0"
            class="flex items-center justify-center h-44 text-xs text-gray-400 italic">
            No upcoming tasks with due dates
          </div>
          <div v-else class="space-y-3.5 py-1">
            <div v-for="e in upcomingByAssignee.slice(0, 8)" :key="e.name" class="flex items-center gap-3">
              <span class="text-xs text-gray-500 w-24 truncate text-right flex-shrink-0">{{ e.name }}</span>
              <div class="flex-1 flex items-center min-w-0">
                <div class="h-0.5 rounded-full bg-indigo-300 flex-shrink-0 transition-all duration-500"
                  :style="{ width: lollipopWidth(e.count) + '%' }"></div>
                <div class="w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow flex-shrink-0 -ml-1"></div>
              </div>
              <span class="text-xs font-bold text-indigo-700 w-5 text-right flex-shrink-0">{{ e.count }}</span>
            </div>
          </div>
        </div>

        <!-- ── 4. Area: task completion over time ─────────────────────── -->
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-2">Task Completion Over Time</h3>
          <div class="flex items-center gap-4 mb-2">
            <div class="flex items-center gap-1.5">
              <div class="w-6 h-0.5 bg-indigo-400 rounded"></div>
              <span class="text-xs text-gray-500">Created</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-6 h-0.5 bg-emerald-400 rounded"></div>
              <span class="text-xs text-gray-500">Completed</span>
            </div>
          </div>
          <div class="h-44">
            <svg width="100%" height="100%" :viewBox="`0 0 ${AC_VW} ${AC_VH}`" preserveAspectRatio="xMidYMid meet">
              <!-- Grid lines -->
              <template v-for="tick in areaYTicks" :key="tick.val">
                <line :x1="AC_PL" :y1="tick.y" :x2="AC_VW - AC_PR" :y2="tick.y" stroke="#f1f5f9" stroke-width="1" />
                <text :x="AC_PL - 4" :y="tick.y + 3" text-anchor="end" font-size="7" fill="#9ca3af">{{ tick.val }}</text>
              </template>
              <!-- Filled areas -->
              <path v-if="createdAreaPath" :d="createdAreaPath" fill="rgba(129,140,248,0.15)" />
              <path v-if="completedAreaPath" :d="completedAreaPath" fill="rgba(52,211,153,0.22)" />
              <!-- Lines -->
              <path v-if="createdLinePath" :d="createdLinePath" fill="none" stroke="#818cf8" stroke-width="1.5" stroke-linejoin="round" />
              <path v-if="completedLinePath" :d="completedLinePath" fill="none" stroke="#34d399" stroke-width="1.5" stroke-linejoin="round" />
              <!-- X-axis labels -->
              <text
                v-for="(w, i) in areaWeeks"
                :key="i"
                :x="AC_PL + i * (AC_CW / (areaWeeks.length - 1))"
                :y="AC_VH - 3"
                text-anchor="middle"
                font-size="7"
                fill="#9ca3af"
              >{{ i % 2 === 0 ? w : '' }}</text>
            </svg>
          </div>
        </div>

        <!-- ── 5. Horizontal bar: by priority ─────────────────────────── -->
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-5">Tasks by Priority</h3>
          <div class="space-y-4">
            <div v-for="p in priorityBars" :key="p.label" class="flex items-center gap-3">
              <span class="text-xs font-medium text-gray-500 w-14 flex-shrink-0">{{ p.label }}</span>
              <div class="flex-1 bg-gray-100 rounded-full h-3.5 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500"
                  :style="{ width: pct(p.count, maxPriorityCount) + '%', background: p.color }"></div>
              </div>
              <span class="text-xs font-bold text-gray-700 w-5 text-right flex-shrink-0">{{ p.count }}</span>
            </div>
          </div>
        </div>

        <!-- ── 6. Stacked bar: workload by assignee ────────────────────── -->
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-2">Workload by Assignee</h3>
          <div class="flex items-center gap-4 mb-3">
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-sm bg-emerald-400"></div>
              <span class="text-xs text-gray-500">Done</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-sm bg-indigo-400"></div>
              <span class="text-xs text-gray-500">Active</span>
            </div>
          </div>
          <div v-if="workloadByAssignee.length === 0"
            class="flex items-center justify-center h-36 text-xs text-gray-400 italic">
            No tasks assigned to members yet
          </div>
          <div v-else class="space-y-2.5">
            <div v-for="e in workloadByAssignee.slice(0, 8)" :key="e.name" class="flex items-center gap-2">
              <span class="text-xs text-gray-500 w-20 truncate flex-shrink-0">{{ e.name }}</span>
              <div class="flex-1 flex rounded overflow-hidden h-5 bg-gray-100 min-w-0">
                <div v-if="e.done > 0"
                  class="bg-emerald-400 flex items-center justify-center min-w-0 transition-all"
                  :style="{ width: pct(e.done, e.done + e.active) + '%' }">
                  <span class="text-xs text-white font-medium leading-none truncate px-1">{{ e.done }}</span>
                </div>
                <div v-if="e.active > 0"
                  class="bg-indigo-400 flex items-center justify-center min-w-0 transition-all"
                  :style="{ width: pct(e.active, e.done + e.active) + '%' }">
                  <span class="text-xs text-white font-medium leading-none truncate px-1">{{ e.active }}</span>
                </div>
              </div>
              <span class="text-xs font-bold text-gray-600 w-5 text-right flex-shrink-0">{{ e.done + e.active }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMembersStore } from '@/stores/members'
import type { Task, Section } from '@/types'

const props = defineProps<{ tasks: Task[]; sections: Section[] }>()

const membersStore = useMembersStore()
onMounted(() => { if (membersStore.members.length === 0) membersStore.fetchMembers() })

// ── SVG layout constants ───────────────────────────────────────────────────────

// Bar chart  (viewBox 300 × 150)
const BC_VW = 300, BC_VH = 150
const BC_PL = 28, BC_PR = 6, BC_PT = 10, BC_PB = 22
const BC_CW = BC_VW - BC_PL - BC_PR   // 266
const BC_CH = BC_VH - BC_PT - BC_PB   // 118

// Area chart (viewBox 320 × 140)
const AC_VW = 320, AC_VH = 140
const AC_PL = 24, AC_PR = 6, AC_PT = 8, AC_PB = 20
const AC_CW = AC_VW - AC_PL - AC_PR   // 290
const AC_CH = AC_VH - AC_PT - AC_PB   // 112

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDate(d: any): Date {
  return 'toDate' in d ? d.toDate() : new Date(d)
}

function pct(v: number, max: number): number {
  return max === 0 ? 0 : Math.round((v / max) * 100)
}

const todayBase = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })()

// ── KPIs ──────────────────────────────────────────────────────────────────────

const total      = computed(() => props.tasks.length)
const completed  = computed(() => props.tasks.filter(t => t.status === 'done').length)
const incomplete = computed(() => props.tasks.filter(t => t.status !== 'done').length)
const completionRate = computed(() =>
  total.value === 0 ? 0 : Math.round((completed.value / total.value) * 100)
)
const overdue = computed(() =>
  props.tasks.filter(t => {
    if (t.status === 'done' || !t.dueDate) return false
    const d = toDate(t.dueDate); d.setHours(0, 0, 0, 0)
    return d < todayBase
  }).length
)

// ── Donut: by status ──────────────────────────────────────────────────────────

function polarXY(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function donutSegPath(cx: number, cy: number, ro: number, ri: number, s: number, e: number): string {
  if (e - s >= 359.99) {
    const t = polarXY(cx, cy, ro, s), b = polarXY(cx, cy, ro, s + 180)
    const ti = polarXY(cx, cy, ri, s + 180), bi = polarXY(cx, cy, ri, s)
    return `M${t.x} ${t.y} A${ro} ${ro} 0 1 1 ${b.x} ${b.y} A${ro} ${ro} 0 1 1 ${t.x} ${t.y}` +
           ` L${ti.x} ${ti.y} A${ri} ${ri} 0 1 0 ${bi.x} ${bi.y} A${ri} ${ri} 0 1 0 ${ti.x} ${ti.y} Z`
  }
  const ps = polarXY(cx, cy, ro, s), pe = polarXY(cx, cy, ro, e)
  const qi = polarXY(cx, cy, ri, e), pi = polarXY(cx, cy, ri, s)
  const lg = e - s > 180 ? 1 : 0
  return `M${ps.x.toFixed(2)} ${ps.y.toFixed(2)}` +
         ` A${ro} ${ro} 0 ${lg} 1 ${pe.x.toFixed(2)} ${pe.y.toFixed(2)}` +
         ` L${qi.x.toFixed(2)} ${qi.y.toFixed(2)}` +
         ` A${ri} ${ri} 0 ${lg} 0 ${pi.x.toFixed(2)} ${pi.y.toFixed(2)} Z`
}

const donutSegments = computed(() => {
  const items = [
    { label: 'To Do',       count: props.tasks.filter(t => t.status === 'todo').length,        color: '#94a3b8' },
    { label: 'In Progress', count: props.tasks.filter(t => t.status === 'in_progress').length, color: '#60a5fa' },
    { label: 'Review',      count: props.tasks.filter(t => t.status === 'review').length,      color: '#fbbf24' },
    { label: 'Done',        count: completed.value,                                            color: '#34d399' }
  ]
  const tot = items.reduce((s, it) => s + it.count, 0)
  if (tot === 0) return items.map(it => ({ ...it, path: '' }))
  const gap = 2
  let deg = 0
  return items.map(it => {
    const sweep = (it.count / tot) * (360 - items.filter(x => x.count > 0).length * gap)
    const start = deg
    const end = it.count > 0 ? deg + sweep : deg
    deg = it.count > 0 ? end + gap : deg
    return { ...it, path: it.count > 0 ? donutSegPath(60, 60, 52, 33, start, end) : '' }
  })
})

// ── Vertical bar: incomplete by section ───────────────────────────────────────

const sectionBars = computed(() => {
  const cols = props.sections.map(s => ({
    name: s.name,
    count: props.tasks.filter(t => t.sectionId === s.id && t.status !== 'done').length
  }))
  const maxCount = Math.max(...cols.map(c => c.count), 1)
  const n = cols.length || 1
  const slotW = BC_CW / n
  const barW = Math.min(slotW * 0.55, 44)
  return cols.map((col, i) => {
    const h = (col.count / maxCount) * BC_CH
    const x = BC_PL + i * slotW + (slotW - barW) / 2
    const y = BC_PT + BC_CH - h
    return { ...col, x, y, w: barW, h }
  })
})

const sectionYTicks = computed(() => {
  const maxCount = Math.max(...props.sections.map(s =>
    props.tasks.filter(t => t.sectionId === s.id && t.status !== 'done').length
  ), 1)
  return [0, 0.25, 0.5, 0.75, 1].map(f => ({
    val: Math.round(f * maxCount),
    y: BC_PT + BC_CH - f * BC_CH
  }))
})

// ── Lollipop: upcoming by assignee ────────────────────────────────────────────

const upcomingByAssignee = computed(() => {
  const upcoming = props.tasks.filter(t => {
    if (t.status === 'done' || !t.dueDate) return false
    const d = toDate(t.dueDate); d.setHours(0, 0, 0, 0)
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
      return { name: uid === '__unassigned' ? 'Unassigned' : (member?.displayName ?? 'Unknown'), count }
    })
    .sort((a, b) => b.count - a.count)
})

const maxUpcoming = computed(() => Math.max(...upcomingByAssignee.value.map(e => e.count), 1))

function lollipopWidth(count: number): number {
  return Math.max(3, (count / maxUpcoming.value) * 82)
}

// ── Area: task activity over time ─────────────────────────────────────────────

function weekLabel(date: Date): string {
  const d = new Date(date); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay())
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const areaWeeks = computed(() => {
  const weeks: string[] = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date(todayBase); d.setDate(d.getDate() - i * 7); weeks.push(weekLabel(d))
  }
  return weeks
})

const areaWeeksData = computed(() => {
  const weeks = areaWeeks.value
  const created = new Array(8).fill(0)
  const comp = new Array(8).fill(0)
  for (const task of props.tasks) {
    const ci = weeks.indexOf(weekLabel(toDate(task.createdAt as any)))
    if (ci !== -1) created[ci]++
    if (task.status === 'done') {
      const ui = weeks.indexOf(weekLabel(toDate(task.updatedAt as any)))
      if (ui !== -1) comp[ui]++
    }
  }
  return { created, completed: comp }
})

const areaMaxVal = computed(() =>
  Math.max(...areaWeeksData.value.created, ...areaWeeksData.value.completed, 1)
)

const areaYTicks = computed(() =>
  [0, 0.25, 0.5, 0.75, 1].map(f => ({
    val: Math.round(f * areaMaxVal.value),
    y: AC_PT + AC_CH - f * AC_CH
  }))
)

function smoothLinePath(data: number[], maxVal: number): string {
  if (data.length < 2) return ''
  const xStep = AC_CW / (data.length - 1)
  const pts = data.map((v, i) => ({
    x: AC_PL + i * xStep,
    y: AC_PT + AC_CH * (1 - v / maxVal)
  }))
  const t = xStep / 3
  let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    path += ` C ${(pts[i-1].x + t).toFixed(1)} ${pts[i-1].y.toFixed(1)}` +
            ` ${(pts[i].x - t).toFixed(1)} ${pts[i].y.toFixed(1)}` +
            ` ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`
  }
  return path
}

function closedAreaPath(linePath: string, data: number[]): string {
  if (!linePath || data.length < 2) return ''
  return `${linePath} L ${(AC_PL + AC_CW).toFixed(1)} ${(AC_PT + AC_CH).toFixed(1)} L ${AC_PL.toFixed(1)} ${(AC_PT + AC_CH).toFixed(1)} Z`
}

const createdLinePath   = computed(() => smoothLinePath(areaWeeksData.value.created,   areaMaxVal.value))
const completedLinePath = computed(() => smoothLinePath(areaWeeksData.value.completed, areaMaxVal.value))
const createdAreaPath   = computed(() => closedAreaPath(createdLinePath.value,   areaWeeksData.value.created))
const completedAreaPath = computed(() => closedAreaPath(completedLinePath.value, areaWeeksData.value.completed))

// ── Priority: horizontal bars ─────────────────────────────────────────────────

const priorityBars = computed(() => [
  { label: 'Urgent', count: props.tasks.filter(t => t.priority === 'urgent').length, color: '#ef4444' },
  { label: 'High',   count: props.tasks.filter(t => t.priority === 'high').length,   color: '#f97316' },
  { label: 'Medium', count: props.tasks.filter(t => t.priority === 'medium').length, color: '#60a5fa' },
  { label: 'Low',    count: props.tasks.filter(t => t.priority === 'low').length,    color: '#94a3b8' }
])

const maxPriorityCount = computed(() => Math.max(...priorityBars.value.map(p => p.count), 1))

// ── Workload: stacked bars by assignee ────────────────────────────────────────

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
      return { name: uid === '__unassigned' ? 'Unassigned' : (member?.displayName ?? 'Unknown'), ...counts }
    })
    .sort((a, b) => (b.done + b.active) - (a.done + a.active))
})
</script>
