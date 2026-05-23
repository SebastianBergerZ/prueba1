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
          </div>

          <button @click="showEditProject = true" class="btn-secondary gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button @click="showCreateTask = true" class="btn-primary gap-2">
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
      <div v-if="viewMode === 'board'" class="flex gap-4 p-6 h-full overflow-x-auto">
        <div
          v-for="col in tasksStore.kanbanColumns"
          :key="col.id"
          class="flex flex-col w-72 min-w-72 flex-shrink-0"
        >
          <!-- Column header -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full" :class="col.color"></span>
              <h3 class="text-sm font-semibold text-gray-700">{{ col.label }}</h3>
              <span class="text-xs text-gray-400 font-normal">{{ col.tasks.length }}</span>
            </div>
            <button
              @click="openCreateTaskInColumn(col.id as TaskStatus)"
              class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <!-- Task cards -->
          <div class="flex-1 space-y-2 overflow-y-auto max-h-full pb-4">
            <TransitionGroup name="task-list">
              <TaskCard
                v-for="task in col.tasks"
                :key="task.id"
                :task="task"
                @move="handleMoveTask"
              />
            </TransitionGroup>

            <!-- Add task inline -->
            <button
              @click="openCreateTaskInColumn(col.id as TaskStatus)"
              class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add task
            </button>
          </div>
        </div>
      </div>

      <!-- List view -->
      <div v-else class="p-6 max-w-5xl">
        <!-- Loading -->
        <div v-if="tasksStore.loading" class="card">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <div class="w-5 h-5 rounded-full bg-gray-200 animate-pulse"></div>
            <div class="h-4 flex-1 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-4 w-16 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>

        <div v-else class="card overflow-hidden">
          <!-- Header row -->
          <div class="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200">
            <span class="w-5 flex-shrink-0"></span>
            <span class="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</span>
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:block w-24">Status</span>
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:block w-20">Priority</span>
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Due</span>
            <span class="w-20 flex-shrink-0"></span>
          </div>

          <!-- Group by status -->
          <template v-for="col in tasksStore.kanbanColumns" :key="col.id">
            <div v-if="col.tasks.length > 0">
              <!-- Section header -->
              <div
                class="flex items-center gap-2 px-4 py-2 bg-gray-50/50 border-b border-gray-100 cursor-pointer"
                @click="toggleSection(col.id)"
              >
                <svg
                  class="w-3.5 h-3.5 text-gray-400 transition-transform"
                  :class="{ '-rotate-90': collapsedSections.has(col.id) }"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
                <span class="w-2 h-2 rounded-full" :class="col.color"></span>
                <span class="text-xs font-semibold text-gray-600">{{ col.label }}</span>
                <span class="text-xs text-gray-400">{{ col.tasks.length }}</span>
              </div>

              <!-- Tasks -->
              <template v-if="!collapsedSections.has(col.id)">
                <TaskRow
                  v-for="task in col.tasks"
                  :key="task.id"
                  :task="task"
                  @move="handleMoveTask"
                  @delete="handleDeleteTask"
                />
              </template>
            </div>
          </template>

          <!-- All done empty state -->
          <div
            v-if="tasksStore.tasks.length === 0"
            class="flex flex-col items-center justify-center py-16 text-center"
          >
            <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p class="text-sm text-gray-500 mb-3">No tasks yet</p>
            <button @click="showCreateTask = true" class="btn-primary text-sm">Add your first task</button>
          </div>
        </div>
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
      :default-status="createTaskDefaultStatus"
      @close="showCreateTask = false"
      @saved="handleTaskSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import { useAuthStore } from '@/stores/auth'
import TaskCard from '@/components/tasks/TaskCard.vue'
import TaskRow from '@/components/tasks/TaskRow.vue'
import CreateTaskModal from '@/components/tasks/CreateTaskModal.vue'
import EditProjectModal from '@/components/projects/EditProjectModal.vue'
import type { TaskStatus } from '@/types'

const props = defineProps<{ id: string }>()

const route = useRoute()
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()
const authStore = useAuthStore()

const viewMode = ref<'board' | 'list'>('board')
const showCreateTask = ref(false)
const showEditProject = ref(false)
const createTaskDefaultStatus = ref<TaskStatus>('todo')
const collapsedSections = ref<Set<string>>(new Set())

const project = computed(() => projectsStore.getProjectById(props.id))
const colorClasses = computed(() =>
  project.value ? projectsStore.getColorClasses(project.value.color) : null
)

function openCreateTaskInColumn(status: TaskStatus) {
  createTaskDefaultStatus.value = status
  showCreateTask.value = true
}

function toggleSection(sectionId: string) {
  if (collapsedSections.value.has(sectionId)) {
    collapsedSections.value.delete(sectionId)
  } else {
    collapsedSections.value.add(sectionId)
  }
}

async function handleMoveTask(taskId: string, newStatus: TaskStatus) {
  await tasksStore.moveTask(taskId, newStatus)
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

  // Also ensure projects are loaded
  const workspaceId = authStore.currentWorkspace?.id
  if (workspaceId && projectsStore.projects.length === 0) {
    projectsStore.subscribeToProjects(workspaceId)
  }
}, { immediate: true })

onUnmounted(() => {
  tasksStore.unsubscribeFromProject()
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
