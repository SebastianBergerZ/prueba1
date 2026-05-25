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

      <!-- Custom fields -->
      <div class="px-6 py-4 border-b border-gray-100">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs font-medium text-gray-500">Custom fields</p>
          <button @click="showAddField = !showAddField" class="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add field
          </button>
        </div>

        <!-- Existing custom fields -->
        <div class="space-y-3">
          <div v-for="field in customFieldsStore.fields" :key="field.id" class="flex items-start gap-3 group/field">
            <div class="flex-1">
              <!-- Field header with edit/delete -->
              <div class="flex items-center gap-2 mb-1">
                <span v-if="editingFieldId !== field.id" class="text-xs font-medium text-gray-500 cursor-pointer hover:text-primary-600" @click="startEditField(field)">{{ field.name }}</span>
                <input
                  v-else
                  v-model="editingFieldName"
                  class="text-xs font-medium border border-primary-400 rounded px-1 focus:outline-none"
                  @keydown.enter="saveFieldName(field.id)"
                  @keydown.escape="editingFieldId = null"
                  @blur="saveFieldName(field.id)"
                />
                <span class="text-xs text-gray-300 bg-gray-100 px-1.5 rounded capitalize">{{ field.type }}</span>
                <div class="opacity-0 group-hover/field:opacity-100 flex items-center gap-1 ml-auto">
                  <button @click="startEditField(field)" class="p-0.5 text-gray-400 hover:text-gray-600" title="Rename field">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button @click="handleDeleteField(field.id)" class="p-0.5 text-gray-400 hover:text-red-500" title="Delete field">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>

              <!-- Field value editor -->
              <template v-if="field.type === 'text'">
                <input
                  :value="(task.customFieldValues?.[field.id] as string) ?? ''"
                  type="text"
                  placeholder="Empty"
                  class="input-field text-sm py-1.5"
                  @blur="setFieldValue(field.id, ($event.target as HTMLInputElement).value || null)"
                />
              </template>
              <template v-else-if="field.type === 'number'">
                <input
                  :value="(task.customFieldValues?.[field.id] as number) ?? ''"
                  type="number"
                  placeholder="0"
                  class="input-field text-sm py-1.5 w-40"
                  @blur="setFieldValue(field.id, ($event.target as HTMLInputElement).value !== '' ? Number(($event.target as HTMLInputElement).value) : null)"
                />
              </template>
              <template v-else-if="field.type === 'date'">
                <input
                  :value="(task.customFieldValues?.[field.id] as string) ?? ''"
                  type="date"
                  class="input-field text-sm py-1.5 w-48"
                  @change="setFieldValue(field.id, ($event.target as HTMLInputElement).value || null)"
                />
              </template>
              <template v-else-if="field.type === 'checkbox'">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    :checked="!!(task.customFieldValues?.[field.id])"
                    type="checkbox"
                    class="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                    @change="setFieldValue(field.id, ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="text-sm text-gray-600">{{ task.customFieldValues?.[field.id] ? 'Yes' : 'No' }}</span>
                </label>
              </template>
              <template v-else-if="field.type === 'dropdown'">
                <select
                  :value="(task.customFieldValues?.[field.id] as string) ?? ''"
                  class="input-field text-sm py-1.5"
                  @change="setFieldValue(field.id, ($event.target as HTMLSelectElement).value || null)"
                >
                  <option value="">— Select —</option>
                  <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </template>
            </div>
          </div>

          <!-- No fields yet -->
          <p v-if="customFieldsStore.fields.length === 0 && !showAddField" class="text-xs text-gray-400 italic">No custom fields yet</p>
        </div>

        <!-- Add field form -->
        <div v-if="showAddField" class="mt-4 border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
          <p class="text-xs font-semibold text-gray-700">New field</p>
          <div>
            <label class="label">Field name</label>
            <input v-model="newField.name" type="text" placeholder="e.g. Budget, Effort, Link..." class="input-field" maxlength="50" />
          </div>
          <div>
            <label class="label">Type</label>
            <select v-model="newField.type" class="input-field">
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="checkbox">Checkbox</option>
              <option value="dropdown">Dropdown</option>
            </select>
          </div>
          <!-- Dropdown options -->
          <div v-if="newField.type === 'dropdown'">
            <label class="label">Options <span class="text-gray-400 font-normal">(one per line)</span></label>
            <textarea
              v-model="newField.optionsRaw"
              class="input-field resize-none text-sm"
              rows="3"
              placeholder="Option A&#10;Option B&#10;Option C"
            ></textarea>
          </div>
          <div class="flex gap-2">
            <button @click="handleCreateField" class="btn-primary text-xs px-3 py-1.5" :disabled="!newField.name.trim()">Create field</button>
            <button @click="showAddField = false" class="btn-secondary text-xs px-3 py-1.5">Cancel</button>
          </div>
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
          <input v-model="newTag" type="text" placeholder="Add tag..." class="input-field flex-1 text-xs py-1.5" @keydown.enter.prevent="addTag" maxlength="30" />
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
import { ref, computed, watch, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTasksStore } from '@/stores/tasks'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { useCustomFieldsStore } from '@/stores/customFields'
import CreateTaskModal from '@/components/tasks/CreateTaskModal.vue'
import type { TaskStatus, TaskPriority, CustomField, CustomFieldType, CustomFieldValue } from '@/types'

const props = defineProps<{ projectId: string; taskId: string }>()
const router = useRouter()
const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()
const authStore = useAuthStore()
const customFieldsStore = useCustomFieldsStore()

const loading = ref(false)
const showEditModal = ref(false)
const editing = ref(false)
const newTag = ref('')
const editForm = ref({ title: '' })
const descriptionValue = ref('')

const showAddField = ref(false)
const editingFieldId = ref<string | null>(null)
const editingFieldName = ref('')
const newField = reactive({ name: '', type: 'text' as CustomFieldType, optionsRaw: '' })

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
  customFieldsStore.subscribeToProject(props.projectId)
})

onUnmounted(() => {
  customFieldsStore.unsubscribeFromProject()
})

function startEditField(field: CustomField) {
  editingFieldId.value = field.id
  editingFieldName.value = field.name
}

async function saveFieldName(id: string) {
  const name = editingFieldName.value.trim()
  if (name && name !== customFieldsStore.fields.find((f) => f.id === id)?.name) {
    await customFieldsStore.updateField(id, { name })
  }
  editingFieldId.value = null
}

async function handleDeleteField(id: string) {
  if (!confirm('Delete this custom field? Values stored on tasks will remain but will no longer be visible.')) return
  await customFieldsStore.deleteField(id)
}

async function setFieldValue(fieldId: string, value: CustomFieldValue) {
  if (!task.value) return
  await customFieldsStore.setTaskFieldValue(task.value.id, fieldId, value)
}

async function handleCreateField() {
  const name = newField.name.trim()
  if (!name) return
  const options = newField.type === 'dropdown'
    ? newField.optionsRaw.split('\n').map((o) => o.trim()).filter(Boolean)
    : []
  await customFieldsStore.createField(props.projectId, name, newField.type, options)
  newField.name = ''
  newField.type = 'text'
  newField.optionsRaw = ''
  showAddField.value = false
}

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
