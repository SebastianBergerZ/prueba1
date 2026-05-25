<template>
  <div class="modal-overlay" @mousedown.self="$emit('close')">
    <div class="modal-content max-w-lg">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">
          {{ task ? 'Edit Task' : 'New Task' }}
        </h2>
        <button @click="$emit('close')" class="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
        <!-- Title -->
        <div>
          <label class="label">Task title <span class="text-red-500">*</span></label>
          <input
            v-model="form.title"
            ref="titleInput"
            type="text"
            placeholder="What needs to be done?"
            class="input-field"
            required
            maxlength="200"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="label">Description</label>
          <textarea
            v-model="form.description"
            placeholder="Add more details..."
            class="input-field resize-none"
            rows="3"
          ></textarea>
        </div>

        <!-- Row: Column + Priority -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Column</label>
            <select v-model="form.sectionId" class="input-field">
              <option v-for="s in tasksStore.sections" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">Priority</label>
            <select v-model="form.priority" class="input-field">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <!-- Dates row -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Start date</label>
            <input v-model="form.startDateStr" type="date" class="input-field" />
          </div>
          <div>
            <label class="label">Due date</label>
            <input v-model="form.dueDateStr" type="date" class="input-field" />
          </div>
        </div>

        <!-- Assignee -->
        <div>
          <label class="label">Assignee</label>
          <select v-model="form.assigneeId" class="input-field">
            <option :value="null">Unassigned</option>
            <option v-for="m in membersStore.members" :key="m.uid" :value="m.uid">
              {{ m.displayName }} ({{ m.email }})
            </option>
          </select>
        </div>

        <!-- Custom fields -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="label mb-0">Custom fields</p>
            <button
              type="button"
              @click="showAddField = !showAddField"
              class="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add field
            </button>
          </div>

          <!-- Existing fields with value editors -->
          <div class="space-y-3">
            <div v-for="field in customFieldsStore.fields" :key="field.id">
              <label class="label text-xs font-normal text-gray-500">{{ field.name }}</label>
              <input
                v-if="field.type === 'text'"
                v-model="customFieldValues[field.id]"
                type="text"
                class="input-field"
                placeholder="Empty"
              />
              <input
                v-else-if="field.type === 'number'"
                :value="customFieldValues[field.id] ?? ''"
                type="number"
                class="input-field"
                placeholder="0"
                @input="customFieldValues[field.id] = ($event.target as HTMLInputElement).value !== '' ? Number(($event.target as HTMLInputElement).value) : null"
              />
              <input
                v-else-if="field.type === 'date'"
                v-model="customFieldValues[field.id]"
                type="date"
                class="input-field"
              />
              <label v-else-if="field.type === 'checkbox'" class="flex items-center gap-2 cursor-pointer">
                <input
                  :checked="!!(customFieldValues[field.id])"
                  type="checkbox"
                  class="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                  @change="customFieldValues[field.id] = ($event.target as HTMLInputElement).checked"
                />
                <span class="text-sm text-gray-600">{{ customFieldValues[field.id] ? 'Yes' : 'No' }}</span>
              </label>
              <select
                v-else-if="field.type === 'dropdown'"
                v-model="customFieldValues[field.id]"
                class="input-field"
              >
                <option value="">— Select —</option>
                <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>

            <p v-if="customFieldsStore.fields.length === 0 && !showAddField" class="text-xs text-gray-400 italic">
              No custom fields yet — click "Add field" to create one.
            </p>
          </div>

          <!-- Inline add-field form -->
          <div v-if="showAddField" class="mt-3 border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
            <p class="text-xs font-semibold text-gray-700">New field</p>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="label text-xs">Name</label>
                <input v-model="newFieldForm.name" type="text" placeholder="e.g. Budget" class="input-field text-sm" maxlength="50" />
              </div>
              <div>
                <label class="label text-xs">Type</label>
                <select v-model="newFieldForm.type" class="input-field text-sm">
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="dropdown">Dropdown</option>
                </select>
              </div>
            </div>
            <div v-if="newFieldForm.type === 'dropdown'">
              <label class="label text-xs">Options <span class="text-gray-400 font-normal">(one per line)</span></label>
              <textarea v-model="newFieldForm.optionsRaw" class="input-field resize-none text-sm" rows="2" placeholder="Option A&#10;Option B"></textarea>
            </div>
            <p v-if="addFieldError" class="text-xs text-red-600">{{ addFieldError }}</p>
            <div class="flex gap-2">
              <button type="button" @click="handleCreateField" class="btn-primary text-xs px-3 py-1.5" :disabled="!newFieldForm.name.trim()">Create</button>
              <button type="button" @click="showAddField = false; addFieldError = ''" class="btn-secondary text-xs px-3 py-1.5">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div>
          <label class="label">Tags</label>
          <div class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="tag in form.tags"
              :key="tag"
              class="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-md"
            >
              {{ tag }}
              <button type="button" @click="removeTag(tag)" class="hover:text-primary-900">
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
              class="input-field flex-1 text-xs"
              @keydown.enter.prevent="addTag"
              @keydown.comma.prevent="addTag"
              maxlength="30"
            />
            <button type="button" @click="addTag" class="btn-secondary px-3 py-2 text-xs">Add</button>
          </div>
        </div>

        <!-- Error -->
        <p v-if="error" class="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{{ error }}</p>
      </form>

      <!-- Footer actions -->
      <div class="flex gap-3 px-6 py-4 border-t border-gray-100">
        <button type="button" @click="$emit('close')" class="btn-secondary flex-1">Cancel</button>
        <button
          @click="handleSubmit"
          class="btn-primary flex-1"
          :disabled="loading || !form.title.trim()"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          {{ loading ? 'Saving...' : task ? 'Save changes' : 'Create task' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useMembersStore } from '@/stores/members'
import { useCustomFieldsStore } from '@/stores/customFields'
import type { Task, TaskStatus, TaskPriority, CustomFieldType, CustomFieldValue } from '@/types'

const props = defineProps<{
  projectId: string
  workspaceId: string
  task?: Task | null
  defaultSectionId?: string
}>()

const emit = defineEmits<{
  close: []
  saved: [taskId: string]
}>()

const tasksStore = useTasksStore()
const membersStore = useMembersStore()
const customFieldsStore = useCustomFieldsStore()
const titleInput = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const newTag = ref('')
const customFieldValues = reactive<Record<string, CustomFieldValue>>({})
const showAddField = ref(false)
const addFieldError = ref('')
const newFieldForm = reactive({ name: '', type: 'text' as CustomFieldType, optionsRaw: '' })

const defaultSectionId = computed(() => {
  if (props.task?.sectionId) return props.task.sectionId
  if (props.defaultSectionId) return props.defaultSectionId
  return tasksStore.sections[0]?.id ?? ''
})

const form = reactive({
  title: props.task?.title ?? '',
  description: props.task?.description ?? '',
  sectionId: '' as string,
  priority: (props.task?.priority ?? 'medium') as TaskPriority,
  assigneeId: props.task?.assigneeId ?? null as string | null,
  startDateStr: '',
  dueDateStr: '',
  tags: [...(props.task?.tags ?? [])]
})

if (props.task?.startDate) {
  const d = props.task.startDate
  form.startDateStr = ('toDate' in d ? (d as any).toDate() : new Date(d as any)).toISOString().split('T')[0]
}
if (props.task?.dueDate) {
  const d = props.task.dueDate
  form.dueDateStr = ('toDate' in d ? (d as any).toDate() : new Date(d as any)).toISOString().split('T')[0]
}

onMounted(() => {
  nextTick(() => {
    titleInput.value?.focus()
    form.sectionId = defaultSectionId.value
  })
  if (membersStore.members.length === 0) membersStore.fetchMembers()
  // Ensure custom fields are loaded (no-op if already subscribed to same project)
  customFieldsStore.subscribeToProject(props.projectId)
  // Pre-fill values when editing
  if (props.task?.customFieldValues) {
    Object.assign(customFieldValues, props.task.customFieldValues)
  }
})

async function handleCreateField() {
  const name = newFieldForm.name.trim()
  if (!name) return
  addFieldError.value = ''
  try {
    const options = newFieldForm.type === 'dropdown'
      ? newFieldForm.optionsRaw.split('\n').map((o) => o.trim()).filter(Boolean)
      : []
    await customFieldsStore.createField(props.projectId, name, newFieldForm.type, options)
    newFieldForm.name = ''
    newFieldForm.type = 'text'
    newFieldForm.optionsRaw = ''
    showAddField.value = false
  } catch (e: any) {
    addFieldError.value = e?.message ?? 'Failed to create field'
  }
}

function addTag() {
  const tag = newTag.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
  }
  newTag.value = ''
}

function removeTag(tag: string) {
  form.tags = form.tags.filter((t) => t !== tag)
}

async function handleSubmit() {
  if (!form.title.trim()) return
  loading.value = true
  error.value = null

  try {
    const startDate = form.startDateStr ? new Date(form.startDateStr + 'T00:00:00') : null
    const dueDate = form.dueDateStr ? new Date(form.dueDateStr + 'T00:00:00') : null

    if (props.task) {
      await tasksStore.updateTask({
        id: props.task.id,
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        dueDate,
        tags: form.tags
      })
      emit('saved', props.task.id)
    } else {
      const sectionIndex = tasksStore.sections.findIndex((s) => s.id === form.sectionId)
      const total = tasksStore.sections.length
      let status: TaskStatus = 'in_progress'
      if (sectionIndex === 0) status = 'todo'
      else if (sectionIndex === total - 1) status = 'done'
      else if (sectionIndex === 1) status = 'in_progress'
      else status = 'review'

      const id = await tasksStore.createTask({
        title: form.title.trim(),
        description: form.description.trim(),
        projectId: props.projectId,
        workspaceId: props.workspaceId,
        assigneeId: form.assigneeId,
        startDate,
        dueDate,
        priority: form.priority,
        status,
        sectionId: form.sectionId || defaultSectionId.value,
        tags: form.tags
      })
      // Save any custom field values that were filled in
      for (const [fieldId, value] of Object.entries(customFieldValues)) {
        if (value !== null && value !== '' && value !== undefined) {
          await customFieldsStore.setTaskFieldValue(id, fieldId, value as CustomFieldValue)
        }
      }
      emit('saved', id)
    }
    emit('close')
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to save task'
  } finally {
    loading.value = false
  }
}
</script>
