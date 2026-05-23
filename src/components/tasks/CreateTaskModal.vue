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

        <!-- Row: Status + Priority -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Status</label>
            <select v-model="form.status" class="input-field">
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
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

        <!-- Due date -->
        <div>
          <label class="label">Due date</label>
          <input
            v-model="form.dueDateStr"
            type="date"
            class="input-field"
          />
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
import type { Task, TaskStatus, TaskPriority } from '@/types'

const props = defineProps<{
  projectId: string
  workspaceId: string
  task?: Task | null
  defaultStatus?: TaskStatus
}>()

const emit = defineEmits<{
  close: []
  saved: [taskId: string]
}>()

const tasksStore = useTasksStore()
const membersStore = useMembersStore()
const titleInput = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const newTag = ref('')

const form = reactive({
  title: props.task?.title ?? '',
  description: props.task?.description ?? '',
  status: (props.task?.status ?? props.defaultStatus ?? 'todo') as TaskStatus,
  priority: (props.task?.priority ?? 'medium') as TaskPriority,
  assigneeId: props.task?.assigneeId ?? null as string | null,
  dueDateStr: '',
  tags: [...(props.task?.tags ?? [])]
})

// Pre-fill due date string
if (props.task?.dueDate) {
  const d = props.task.dueDate
  const date = 'toDate' in d ? (d as any).toDate() : new Date(d as any)
  form.dueDateStr = date.toISOString().split('T')[0]
}

const defaultSectionId = computed(() => {
  const sections = tasksStore.sections
  const match = sections.find((s) =>
    s.name.toLowerCase().replace(/\s/g, '_') === form.status ||
    s.name.toLowerCase() === 'to do' && form.status === 'todo'
  )
  return match?.id ?? sections[0]?.id ?? ''
})

onMounted(() => {
  nextTick(() => titleInput.value?.focus())
  if (membersStore.members.length === 0) membersStore.fetchMembers()
})

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
    const dueDate = form.dueDateStr ? new Date(form.dueDateStr + 'T00:00:00') : null

    if (props.task) {
      await tasksStore.updateTask({
        id: props.task.id,
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        dueDate,
        tags: form.tags
      })
      emit('saved', props.task.id)
    } else {
      const id = await tasksStore.createTask({
        title: form.title.trim(),
        description: form.description.trim(),
        projectId: props.projectId,
        workspaceId: props.workspaceId,
        assigneeId: form.assigneeId,
        dueDate,
        priority: form.priority,
        status: form.status,
        sectionId: defaultSectionId.value,
        tags: form.tags
      })
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
