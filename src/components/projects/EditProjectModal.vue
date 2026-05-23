<template>
  <div class="modal-overlay" @mousedown.self="$emit('close')">
    <div class="modal-content max-w-md">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">Edit project</h2>
        <button @click="$emit('close')" class="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-4">
        <!-- Name -->
        <div>
          <label class="label">Project name <span class="text-red-500">*</span></label>
          <input
            v-model="form.name"
            ref="nameInput"
            type="text"
            placeholder="e.g. Marketing Campaign"
            class="input-field"
            required
            maxlength="80"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="label">Description</label>
          <textarea
            v-model="form.description"
            placeholder="What is this project about?"
            class="input-field resize-none"
            rows="3"
            maxlength="500"
          ></textarea>
        </div>

        <!-- Color -->
        <div>
          <label class="label">Color</label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="color in projectsStore.PROJECT_COLORS"
              :key="color.value"
              type="button"
              @click="form.color = color.value"
              class="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
              :class="[color.bg, form.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : '']"
              :title="color.label"
            ></button>
          </div>
        </div>

        <!-- Status -->
        <div>
          <label class="label">Status</label>
          <select v-model="form.status" class="input-field">
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <!-- Error -->
        <p v-if="error" class="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{{ error }}</p>

        <!-- Actions -->
        <div class="flex gap-3 pt-2">
          <button type="button" @click="$emit('close')" class="btn-secondary flex-1">Cancel</button>
          <button type="submit" class="btn-primary flex-1" :disabled="loading || !form.name.trim()">
            <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ loading ? 'Saving...' : 'Save changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import type { Project, ProjectColor, ProjectStatus } from '@/types'

const props = defineProps<{ project: Project }>()
const emit = defineEmits<{ close: []; updated: [] }>()

const projectsStore = useProjectsStore()
const nameInput = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const form = reactive({
  name: props.project.name,
  description: props.project.description,
  color: props.project.color as ProjectColor,
  status: props.project.status as ProjectStatus
})

onMounted(() => nextTick(() => nameInput.value?.focus()))

async function handleSubmit() {
  if (!form.name.trim()) return
  loading.value = true
  error.value = null
  try {
    await projectsStore.updateProject(props.project.id, {
      name: form.name.trim(),
      description: form.description.trim(),
      color: form.color,
      status: form.status
    })
    emit('updated')
    emit('close')
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to save changes'
  } finally {
    loading.value = false
  }
}
</script>
