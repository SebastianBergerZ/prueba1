<template>
  <div class="p-6 max-w-3xl mx-auto">
    <!-- Back link -->
    <button
      @click="$router.back()"
      class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to project
    </button>

    <!-- Loading -->
    <div v-if="loading" class="card p-6 space-y-4">
      <div class="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>
      <div class="h-4 w-1/2 bg-gray-100 rounded animate-pulse"></div>
      <div class="h-20 bg-gray-100 rounded animate-pulse"></div>
    </div>

    <!-- Not found -->
    <div v-else-if="!task" class="text-center py-16">
      <p class="text-gray-500">Task not found.</p>
      <button @click="$router.back()" class="btn-secondary mt-4">Go back</button>
    </div>

    <!-- Task detail -->
    <div v-else class="card overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-5 border-b border-gray-100">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <!-- Complete button -->
            <button
              @click="toggleComplete"
              class="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
              :class="task.status === 'done'
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-green-400'"
            >
              <svg v-if="task.status === 'done'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </button>

            <div class="flex-1 min-w-0">
              <!-- Editable title -->
              <textarea
                v-if="editing"
                v-model="editForm.title"
                class="w-full text-xl font-bold text-gray-900 border border-primary-300 rounded-md px-2 py-1 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows="2"
                @blur="saveEdit"
                @keydown.enter.prevent="saveEdit"
              ></textarea>
              <h1
                v-else
                class="text-xl font-bold text-gray-900 cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1"
                :class="{ 'line-through text-gray-400': task.status === 'done' }"
                @click="startEdit"
              >
                {{ task.title }}
              </h1>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <button @click="showEditModal = true" class="btn-ghost text-xs">Edit</button>
            <button @click="handleDelete" class="btn-ghost text-xs text-red-600 hover:bg-red-50">Delete</button>
          </div>
        </div>
      </div>

      <!-- Meta info -->
      <div class="px-6 py-4 grid grid-cols-2 gap-4 border-b border-gray-100 bg-gray-50/50">
        <!-- Status -->
        <div>
          <p class="text-xs font-medium text-gray-500 mb-1">Status</p>
          <select
            :value="task.status"
            @change="updateField('status', ($event.target as HTMLSelectElement).value)"
            class="text-sm font-medium border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>

        <!-- Priority -->
        <div>
          <p class="text-xs font-medium text-gray-500 mb-1">Priority</p>
          <select
            :value="task.priority"
            @change="updateField('priority', ($event.target as HTMLSelectElement).value)"
            class="text-sm font-medium border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <!-- Start date -->
        <div>
          <p class="text-xs font-medium text-gray-500 mb-1">Start date</p>
          <input
            :value="startDateValue"
            type="date"
            @change="updateStartDate(($event.target as HTMLInputElement).value)"
            class="text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
          />
        </div>

        <!-- Due date -->
        <div>
          <p class="text-xs font-medium text-gray-500 mb-1">Due date</p>
          <input
            :value="dueDateValue"
            type="date"
            @change="updateDueDate(($event.target as HTMLInputElement).value)"
            class="text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
          />
        </div>

        <!-- Created -->
        <div>
          <p class="text-xs font-medium text-gray-500 mb-1">Created</p>
          <p class="text-sm text-gray-700">{{ formattedCreatedAt }}</p>
        </div>
      </div>

      <!-- Tags -->
      <div class="px-6 py-4 border-b border-gray-100">
        <p class="text-xs font-medium text-gray-500 mb-2">Tags</p>
        <div class="flex flex-wrap gap-2 mb-2">
          <span
            v-for="tag in task.tags"
            :key="tag"
            class="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs rounded-md font-medium"
          >
            {{ tag }}
            <button @click="removeTag(tag)" class="hover:text-primary-900 transition-colors">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        </div>
        <div class="flex gap-2">
          <input
            v-model="newTag"
            type="text"
            placeholder="Add tag..."
            class="input-field flex-1 text-xs py-1.5"
            @keydown.enter.prevent="addTag"
            maxlength="30"
          />
          <button @click="addTag" class="btn-secondary text-xs px-3 py-1.5">Add</button>
        </div>
      </div>

      <!-- Description -->
      <div class="px-6 py-4">
        <p class="text-xs font-medium text-gray-500 mb-2">Description</p>
        <textarea
          v-model="descriptionValue"
          placeholder="Add a description..."
          class="w-full text-sm text-gray-700 border border-transparent rounded-md px-2 py-1.5 resize-none focus:outline-none focus:border-gray-300 focus:bg-gray-50 hover:bg-gray-50/50 transition-colors min-h-24"
          rows="5"
          @blur="saveDescription"
        ></textarea>
      </div>
    </div>

    <!-- Edit modal -->
    <CreateTaskModal
      v-if="showEditModal && task"
      :project-id="task.projectId"
      :workspace-id="task.workspaceId"
      :task="task"
      @close="showEditModal = false"
      @saved="showEditModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTasksStore } from '@/stores/tasks'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import CreateTaskModal from '@/components/tasks/CreateTaskModal.vue'
import type { TaskStatus, TaskPriority } from '@/types'

const props = defineProps<{ projectId: string; taskId: string }>()
const router = useRouter()
const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()
const authStore = useAuthStore()

const loading = ref(false)
const showEditModal = ref(false)
const editing = ref(false)
const newTag = ref('')
const editForm = ref({ title: '' })
const descriptionValue = ref('')

const task = computed(() => tasksStore.getTaskById(props.taskId))

watch(task, (t) => {
  if (t) {
    descriptionValue.value = t.description
    editForm.value.title = t.title
  }
}, { immediate: true })

// Make sure we have the tasks subscription
onMounted(() => {
  if (tasksStore.tasks.length === 0) {
    tasksStore.subscribeToProject(props.projectId)
  }
  const workspaceId = authStore.currentWorkspace?.id
  if (workspaceId && projectsStore.projects.length === 0) {
    projectsStore.subscribeToProjects(workspaceId)
  }
})

const startDateValue = computed(() => {
  if (!task.value?.startDate) return ''
  const d = task.value.startDate
  return ('toDate' in d ? (d as any).toDate() : new Date(d as any)).toISOString().split('T')[0]
})

const dueDateValue = computed(() => {
  if (!task.value?.dueDate) return ''
  const d = task.value.dueDate
  return ('toDate' in d ? (d as any).toDate() : new Date(d as any)).toISOString().split('T')[0]
})

const formattedCreatedAt = computed(() => {
  if (!task.value?.createdAt) return ''
  const d = task.value.createdAt
  const date = 'toDate' in d ? (d as any).toDate() : new Date(d as any)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
})

function startEdit() {
  if (task.value) {
    editForm.value.title = task.value.title
    editing.value = true
  }
}

async function saveEdit() {
  editing.value = false
  if (!task.value || !editForm.value.title.trim()) return
  if (editForm.value.title.trim() === task.value.title) return
  await tasksStore.updateTask({ id: task.value.id, title: editForm.value.title.trim() })
}

async function saveDescription() {
  if (!task.value) return
  if (descriptionValue.value === task.value.description) return
  await tasksStore.updateTask({ id: task.value.id, description: descriptionValue.value })
}

async function toggleComplete() {
  if (!task.value) return
  const newStatus: TaskStatus = task.value.status === 'done' ? 'todo' : 'done'
  await tasksStore.updateTask({ id: task.value.id, status: newStatus })
}

async function updateField(field: 'status' | 'priority', value: string) {
  if (!task.value) return
  await tasksStore.updateTask({ id: task.value.id, [field]: value as TaskStatus | TaskPriority })
}

async function updateStartDate(value: string) {
  if (!task.value) return
  await tasksStore.updateTask({ id: task.value.id, startDate: value ? new Date(value + 'T00:00:00') : null })
}

async function updateDueDate(value: string) {
  if (!task.value) return
  await tasksStore.updateTask({ id: task.value.id, dueDate: value ? new Date(value + 'T00:00:00') : null })
}

async function addTag() {
  const tag = newTag.value.trim()
  if (!tag || !task.value) return
  if (task.value.tags.includes(tag)) { newTag.value = ''; return }
  await tasksStore.updateTask({ id: task.value.id, tags: [...task.value.tags, tag] })
  newTag.value = ''
}

async function removeTag(tag: string) {
  if (!task.value) return
  await tasksStore.updateTask({ id: task.value.id, tags: task.value.tags.filter((t) => t !== tag) })
}

async function handleDelete() {
  if (!task.value) return
  if (!confirm('Delete this task? This cannot be undone.')) return
  await tasksStore.deleteTask(task.value.id)
  router.push(`/project/${props.projectId}`)
}
</script>
