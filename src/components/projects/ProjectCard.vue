<template>
  <div
    class="card p-5 hover:shadow-md transition-shadow cursor-pointer group"
    @click="$router.push(`/project/${project.id}`)"
  >
    <!-- Top: color bar + actions -->
    <div class="flex items-start justify-between mb-3">
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
        :class="bgClass"
      >
        {{ project.name.charAt(0).toUpperCase() }}
      </div>

      <div class="relative opacity-0 group-hover:opacity-100 transition-opacity" ref="menuRef">
        <button
          @click.stop="menuOpen = !menuOpen"
          class="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>

        <Transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="menuOpen"
            class="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-dropdown border border-gray-100 py-1 z-20"
          >
            <button
              @click.stop="$router.push(`/project/${project.id}`)"
              class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Open project
            </button>
            <button
              @click.stop="$emit('delete', project.id)"
              class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete project
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Name -->
    <h3 class="font-semibold text-gray-900 text-sm mb-1 truncate">{{ project.name }}</h3>
    <p v-if="project.description" class="text-xs text-gray-500 line-clamp-2 mb-3">
      {{ project.description }}
    </p>
    <p v-else class="text-xs text-gray-400 italic mb-3">No description</p>

    <!-- Footer: status + date -->
    <div class="flex items-center justify-between">
      <span
        class="badge text-xs"
        :class="statusClasses"
      >
        {{ statusLabel }}
      </span>
      <span class="text-xs text-gray-400">
        {{ formattedDate }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import type { Project } from '@/types'

const props = defineProps<{ project: Project }>()
defineEmits<{ delete: [id: string] }>()

const projectsStore = useProjectsStore()
const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const bgClass = computed(() => projectsStore.getColorClasses(props.project.color).bg)

const statusClasses = computed(() => {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
    archived: 'bg-gray-100 text-gray-600'
  }
  return map[props.project.status] ?? 'bg-gray-100 text-gray-600'
})

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    active: 'Active',
    on_hold: 'On Hold',
    completed: 'Completed',
    archived: 'Archived'
  }
  return map[props.project.status] ?? props.project.status
})

const formattedDate = computed(() => {
  const d = props.project.createdAt
  if (!d) return ''
  const date = 'toDate' in d ? (d as any).toDate() : new Date(d as any)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})

function handleOutsideClick(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    menuOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', handleOutsideClick))
</script>
