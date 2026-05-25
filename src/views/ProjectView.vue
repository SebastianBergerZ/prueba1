<template>
  <div class="flex flex-col h-full">
    <!-- Project header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
      <div v-if="project" class="flex items-center justify-between">
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            :class="colorClasses?.bg"
          >
            {{ project.name.charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0">
            <h1 class="text-lg font-bold text-gray-900 truncate">{{ project.name }}</h1>
            <p v-if="project.description" class="text-xs text-gray-500 truncate">{{ project.description }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <!-- View toggle -->
          <div class="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              @click="viewMode = 'board'"
              class="p-1.5 rounded-md transition-colors"
              :class="viewMode === 'board' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'"
              title="Board view"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </button>
            <button
              @click="viewMode = 'list'"
              class="p-1.5 rounded-md transition-colors"
              :class="viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'"
              title="List view"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              @click="viewMode = 'calendar'"
              class="p-1.5 rounded-md transition-colors"
              :class="viewMode === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'"
              title="Calendar view"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              @click="viewMode = 'dashboard'"
              class="p-1.5 rounded-md transition-colors"
              :class="viewMode === 'dashboard' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'"
              title="Dashboard view"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>

          <button v-if="!isViewer" @click="showEditProject = true" class="btn-secondary gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button v-if="!isViewer" @click="showCreateTask = true" class="btn-primary gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add task
          </button>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-else class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-gray-200 animate-pulse"></div>
        <div class="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-hidden">
      <!-- Board view -->
      <div v-if="viewMode === 'board'" class="flex gap-4 p-6 h-full overflow-x-auto items-start">
        <div
          v-for="col in tasksStore.sectionColumns"
          :key="col.section.id"
          class="flex flex-col w-72 min-w-72 flex-shrink-0"
        >
          <!-- Column header -->
          <div class="flex items-center justify-between mb-3 group/col">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <!-- Editable section name -->
              <input
                v-if="editingSectionId === col.section.id"
                :ref="el => { if (el) sectionInputRefs[col.section.id] = el as HTMLInputElement }"
                v-model="editingSectionName"
                class="text-sm font-semibold text-gray-700 bg-white border border-primary-400 rounded px-1 w-full focus:outline-none"
                @keydown.enter="saveSection(col.section.id)"
                @keydown.escape="cancelEditSection"
                @blur="saveSection(col.section.id)"
              />
              <template v-else>
                <h3
                  class="text-sm font-semibold text-gray-700 truncate"
                  :class="isViewer ? '' : 'cursor-pointer hover:text-primary-600'"
                  @click="!isViewer && startEditSection(col.section)"
                  :title="isViewer ? col.section.name : 'Click to rename'"
                >{{ col.section.name }}</h3>
                <span class="text-xs text-gray-400 font-normal flex-shrink-0">{{ col.tasks.length }}</span>
              </template>
            </div>

            <div v-if="!isViewer" class="flex items-center gap-1 flex-shrink-0">
              <!-- Add task to column -->
              <button
                @click="openCreateTaskInSection(col.section.id)"
                class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Add task"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <!-- Delete column -->
              <button
                @click="handleDeleteSection(col.section.id, col.tasks.length)"
                class="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover/col:opacity-100"
                title="Delete column"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Task cards -->
          <div class="space-y-2 overflow-y-auto pb-4">
            <TransitionGroup name="task-list">
              <TaskCard
                v-for="task in col.tasks"
                :key="task.id"
                :task="task"
                @move="handleMoveTask"
              />
            </TransitionGroup>

            <button
              v-if="!isViewer"
              @click="openCreateTaskInSection(col.section.id)"
              class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add task
            </button>
          </div>
        </div>

        <!-- Add column button -->
        <div v-if="!isViewer" class="flex-shrink-0 w-64">
          <button
            v-if="!addingSection"
            @click="addingSection = true"
            class="w-full flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors text-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add column
          </button>
          <div v-else class="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <input
              ref="newSectionInput"
              v-model="newSectionName"
              type="text"
              placeholder="Column name..."
              class="input-field mb-2 text-sm"
              @keydown.enter="handleAddSection"
              @keydown.escape="addingSection = false; newSectionName = ''"
            />
            <div class="flex gap-2">
              <button @click="handleAddSection" class="btn-primary text-xs px-3 py-1.5 flex-1">Add</button>
              <button @click="addingSection = false; newSectionName = ''" class="btn-secondary text-xs px-3 py-1.5">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <!-- List view -->
      <div v-else-if="viewMode === 'list'" class="p-6 max-w-5xl">
        <div v-if="tasksStore.loading" class="card">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <div class="w-5 h-5 rounded-full bg-gray-200 animate-pulse"></div>
            <div class="h-4 flex-1 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-4 w-16 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>

        <div v-else class="card overflow-hidden">
          <div class="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200">
            <span class="w-5 flex-shrink-0"></span>
            <span class="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</span>
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:block w-24">Column</span>
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:block w-20">Priority</span>
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Due</span>
            <span class="w-20 flex-shrink-0"></span>
          </div>

          <template v-for="col in tasksStore.sectionColumns" :key="col.section.id">
            <div>
              <div
                class="flex items-center gap-2 px-4 py-2 bg-gray-50/50 border-b border-gray-100 cursor-pointer"
                @click="toggleSection(col.section.id)"
              >
                <svg class="w-3.5 h-3.5 text-gray-400 transition-transform"
                  :class="{ '-rotate-90': collapsedSections.has(col.section.id) }"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
                <span class="text-xs font-semibold text-gray-600">{{ col.section.name }}</span>
                <span class="text-xs text-gray-400">{{ col.tasks.length }}</span>
              </div>
              <template v-if="!collapsedSections.has(col.section.id)">
                <TaskRow
                  v-for="task in col.tasks"
                  :key="task.id"
                  :task="task"
                  @move="handleMoveTask"
                  @delete="handleDeleteTask"
                />
                <div v-if="col.tasks.length === 0" class="px-4 py-3 text-xs text-gray-400 italic">
                  No tasks in this column
                </div>
              </template>
            </div>
          </template>

          <div v-if="tasksStore.tasks.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
            <p class="text-sm text-gray-500 mb-3">No tasks yet</p>
            <button v-if="!isViewer" @click="showCreateTask = true" class="btn-primary text-sm">Add your first task</button>
          </div>
        </div>
      </div>

      <!-- Calendar view -->
      <div v-if="viewMode === 'calendar'" class="flex-1 overflow-y-auto">
        <CalendarView :tasks="tasksStore.tasks" />
      </div>

      <!-- Dashboard view -->
      <div v-else-if="viewMode === 'dashboard'" class="flex-1 overflow-hidden">
        <DashboardView :tasks="tasksStore.tasks" :sections="tasksStore.sections" />
      </div>
    </div>

    <!-- Edit project modal -->
    <EditProjectModal
      v-if="showEditProject && project"
      :project="project"
      @close="showEditProject = false"
      @updated="showEditProject = false"
    />

    <!-- Create task modal -->
    <CreateTaskModal
      v-if="showCreateTask && project"
      :project-id="project.id"
      :workspace-id="project.workspaceId"
      :default-section-id="createTaskDefaultSectionId"
      @close="showCreateTask = false"
      @saved="handleTaskSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import { useCustomFieldsStore } from '@/stores/customFields'
import { useMembersStore } from '@/stores/members'
import TaskCard from '@/components/tasks/TaskCard.vue'
import TaskRow from '@/components/tasks/TaskRow.vue'
import CreateTaskModal from '@/components/tasks/CreateTaskModal.vue'
import EditProjectModal from '@/components/projects/EditProjectModal.vue'
import CalendarView from '@/components/project/CalendarView.vue'
import DashboardView from '@/components/project/DashboardView.vue'
import type { Section } from '@/types'

const props = defineProps<{ id: string }>()

const route = useRoute()
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()
const customFieldsStore = useCustomFieldsStore()
const membersStore = useMembersStore()
const isViewer = computed(() => membersStore.isViewer)

const viewMode = ref<'board' | 'list' | 'calendar' | 'dashboard'>('board')
const showCreateTask = ref(false)
const showEditProject = ref(false)
const createTaskDefaultSectionId = ref<string>('')
const collapsedSections = ref<Set<string>>(new Set())

// Section editing
const editingSectionId = ref<string | null>(null)
const editingSectionName = ref('')
const sectionInputRefs: Record<string, HTMLInputElement> = {}

// Add section
const addingSection = ref(false)
const newSectionName = ref('')
const newSectionInput = ref<HTMLInputElement | null>(null)

const project = computed(() => projectsStore.getProjectById(props.id))
const colorClasses = computed(() =>
  project.value ? projectsStore.getColorClasses(project.value.color) : null
)

function openCreateTaskInSection(sectionId: string) {
  createTaskDefaultSectionId.value = sectionId
  showCreateTask.value = true
}

function toggleSection(sectionId: string) {
  if (collapsedSections.value.has(sectionId)) {
    collapsedSections.value.delete(sectionId)
  } else {
    collapsedSections.value.add(sectionId)
  }
}

function startEditSection(section: Section) {
  editingSectionId.value = section.id
  editingSectionName.value = section.name
  nextTick(() => sectionInputRefs[section.id]?.focus())
}

function cancelEditSection() {
  editingSectionId.value = null
  editingSectionName.value = ''
}

async function saveSection(sectionId: string) {
  const name = editingSectionName.value.trim()
  if (name) await tasksStore.updateSection(sectionId, name)
  cancelEditSection()
}

async function handleAddSection() {
  const name = newSectionName.value.trim()
  if (!name) return
  await tasksStore.createSection(props.id, name)
  newSectionName.value = ''
  addingSection.value = false
}

async function handleDeleteSection(sectionId: string, taskCount: number) {
  if (taskCount > 0) {
    alert(`Cannot delete a column that has ${taskCount} task${taskCount > 1 ? 's' : ''}. Move or delete the tasks first.`)
    return
  }
  if (!confirm('Delete this column?')) return
  await tasksStore.deleteSection(sectionId)
}

async function handleMoveTask(taskId: string, sectionId: string) {
  await tasksStore.moveTaskToSection(taskId, sectionId)
}

async function handleDeleteTask(taskId: string) {
  if (!confirm('Delete this task?')) return
  await tasksStore.deleteTask(taskId)
}

function handleTaskSaved() {
  showCreateTask.value = false
}

// Subscribe when project changes
watch(() => props.id, (newId) => {
  tasksStore.subscribeToProject(newId)
  customFieldsStore.subscribeToProject(newId)
  editingSectionId.value = null
  addingSection.value = false
}, { immediate: true })

watch(addingSection, (val) => {
  if (val) nextTick(() => newSectionInput.value?.focus())
})

onUnmounted(() => {
  tasksStore.unsubscribeFromProject()
  customFieldsStore.unsubscribeFromProject()
})
</script>

<style scoped>
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.2s ease;
}
.task-list-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.task-list-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
