<template>
  <header class="bg-white border-b border-gray-200 flex items-center justify-between px-6 py-3 flex-shrink-0 z-10">
    <!-- Left: breadcrumb / page title -->
    <div class="flex items-center gap-2 min-w-0">
      <h1 class="text-base font-semibold text-gray-900 truncate">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Center: Search -->
    <div class="flex-1 max-w-md mx-6">
      <div class="relative">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search tasks, projects..."
          class="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 border border-transparent rounded-md focus:outline-none focus:bg-white focus:border-gray-300 transition-colors"
          @keydown.enter="handleSearch"
        />
      </div>
    </div>

    <!-- Right: actions + avatar -->
    <div class="flex items-center gap-2">
      <!-- Notifications bell -->
      <button class="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </button>

      <!-- Help -->
      <button class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <!-- User menu -->
      <div class="relative" ref="userMenuRef">
        <button
          @click="userMenuOpen = !userMenuOpen"
          class="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center overflow-hidden">
            <img
              v-if="authStore.photoURL"
              :src="authStore.photoURL"
              :alt="authStore.displayName"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-xs font-bold text-white">{{ initials }}</span>
          </div>
        </button>

        <!-- Dropdown -->
        <Transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="userMenuOpen"
            class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-dropdown border border-gray-100 py-1 z-50"
          >
            <div class="px-4 py-3 border-b border-gray-100">
              <p class="text-sm font-medium text-gray-900">{{ authStore.displayName }}</p>
              <p class="text-xs text-gray-500 truncate">{{ authStore.user?.email }}</p>
            </div>
            <div class="py-1">
              <button
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Profile settings
              </button>
              <button
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Notifications
              </button>
            </div>
            <div class="border-t border-gray-100 py-1">
              <button
                @click="handleLogout"
                class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'

const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const router = useRouter()
const route = useRoute()

const searchQuery = ref('')
const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const initials = computed(() => {
  const name = authStore.displayName
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
})

const pageTitle = computed(() => {
  if (route.name === 'dashboard') return 'Home'
  if (route.name === 'project') {
    const projectId = route.params.id as string
    const project = projectsStore.getProjectById(projectId)
    return project?.name ?? 'Project'
  }
  if (route.name === 'task-detail') return 'Task Detail'
  return 'TaskFlow'
})

function handleSearch() {
  if (!searchQuery.value.trim()) return
  // Future: implement global search
}

async function handleLogout() {
  userMenuOpen.value = false
  await authStore.logout()
  router.push('/login')
}

function handleOutsideClick(e: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) {
    userMenuOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', handleOutsideClick))
</script>
