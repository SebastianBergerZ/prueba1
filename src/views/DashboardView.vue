<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Page header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Home</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          Good {{ timeOfDay }}, {{ firstName }}!
        </p>
      </div>
      <button @click="showCreateProject = true" class="btn-primary gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New project
      </button>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div class="card px-4 py-4">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Projects</p>
        <p class="text-2xl font-bold text-gray-900">{{ projectsStore.projects.length }}</p>
      </div>
      <div class="card px-4 py-4">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Active</p>
        <p class="text-2xl font-bold text-green-600">
          {{ projectsStore.projects.filter((p) => p.status === 'active').length }}
        </p>
      </div>
      <div class="card px-4 py-4">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">On Hold</p>
        <p class="text-2xl font-bold text-yellow-600">
          {{ projectsStore.projects.filter((p) => p.status === 'on_hold').length }}
        </p>
      </div>
      <div class="card px-4 py-4">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Completed</p>
        <p class="text-2xl font-bold text-blue-600">
          {{ projectsStore.projects.filter((p) => p.status === 'completed').length }}
        </p>
      </div>
    </div>

    <!-- Projects grid -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-gray-900">Your projects</h2>

        <!-- Filter tabs -->
        <div class="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            v-for="filter in filters"
            :key="filter.value"
            @click="activeFilter = filter.value"
            class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
            :class="activeFilter === filter.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="projectsStore.loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="card p-5">
          <div class="w-10 h-10 bg-gray-200 rounded-lg animate-pulse mb-3"></div>
          <div class="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div class="h-3 bg-gray-100 rounded animate-pulse mb-4 w-3/4"></div>
          <div class="h-3 bg-gray-100 rounded animate-pulse w-1/2"></div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="filteredProjects.length === 0"
        class="text-center py-16"
      >
        <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 class="text-sm font-medium text-gray-900 mb-1">No projects yet</h3>
        <p class="text-sm text-gray-500 mb-4">Create your first project to get started.</p>
        <button @click="showCreateProject = true" class="btn-primary">
          Create a project
        </button>
      </div>

      <!-- Projects grid -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <ProjectCard
          v-for="project in filteredProjects"
          :key="project.id"
          :project="project"
          @delete="handleDeleteProject"
          @edit="editingProject = $event"
        />
      </div>
    </div>

    <!-- Create project modal -->
    <CreateProjectModal
      v-if="showCreateProject"
      @close="showCreateProject = false"
      @created="handleProjectCreated"
    />

    <!-- Edit project modal -->
    <EditProjectModal
      v-if="editingProject"
      :project="editingProject"
      @close="editingProject = null"
      @updated="editingProject = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import ProjectCard from '@/components/projects/ProjectCard.vue'
import CreateProjectModal from '@/components/projects/CreateProjectModal.vue'
import EditProjectModal from '@/components/projects/EditProjectModal.vue'
import type { Project } from '@/types'

const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const router = useRouter()
const showCreateProject = ref(false)
const editingProject = ref<Project | null>(null)
const activeFilter = ref<'all' | 'active' | 'on_hold' | 'completed'>('all')

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Completed', value: 'completed' }
] as const

const firstName = computed(() => {
  const name = authStore.displayName
  return name.split(' ')[0]
})

const timeOfDay = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
})

const filteredProjects = computed(() => {
  if (activeFilter.value === 'all') return projectsStore.projects
  return projectsStore.projects.filter((p) => p.status === activeFilter.value)
})

function handleProjectCreated(projectId: string) {
  router.push(`/project/${projectId}`)
}

async function handleDeleteProject(id: string) {
  if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return
  await projectsStore.deleteProject(id)
}
</script>
