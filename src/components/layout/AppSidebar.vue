<template>
  <aside
    class="flex flex-col w-64 min-h-screen bg-asana-sidebar text-white flex-shrink-0 overflow-hidden"
    :class="{ 'w-16': collapsed }"
  >
    <!-- Logo / Workspace -->
    <div class="flex items-center justify-between px-4 py-4 border-b border-white/10">
      <div v-if="!collapsed" class="flex items-center gap-2 min-w-0">
        <div class="w-7 h-7 rounded-md bg-primary-500 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="3"/>
            <circle cx="5" cy="19" r="3"/>
            <circle cx="19" cy="19" r="3"/>
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-xs text-white/50 leading-none mb-0.5">Workspace</p>
          <p class="text-sm font-semibold text-white truncate leading-none">
            {{ workspaceName }}
          </p>
        </div>
      </div>
      <div v-else class="w-7 h-7 rounded-md bg-primary-500 flex items-center justify-center mx-auto">
        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="3"/>
          <circle cx="5" cy="19" r="3"/>
          <circle cx="19" cy="19" r="3"/>
        </svg>
      </div>
      <button
        @click="collapsed = !collapsed"
        class="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <svg class="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            :d="collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'" />
        </svg>
      </button>
    </div>

    <!-- Main Navigation -->
    <nav class="px-2 py-3 space-y-0.5">
      <RouterLink
        v-for="item in mainNav"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-white/70 hover:bg-asana-sidebar-hover hover:text-white"
        active-class="!bg-asana-sidebar-active !text-white"
        :title="collapsed ? item.label : undefined"
      >
        <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
        <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="px-4 mt-2 mb-1" v-if="!collapsed">
      <p class="text-xs font-semibold text-white/40 uppercase tracking-wider">Projects</p>
    </div>
    <div v-else class="border-t border-white/10 my-2"></div>

    <!-- Projects List -->
    <div class="flex-1 overflow-y-auto px-2 space-y-0.5">
      <div v-if="projectsStore.loading" class="px-3 py-2">
        <div class="h-4 bg-white/10 rounded animate-pulse"></div>
      </div>

      <RouterLink
        v-for="project in projectsStore.projects"
        :key="project.id"
        :to="`/project/${project.id}`"
        class="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-white/70 hover:bg-asana-sidebar-hover hover:text-white group"
        active-class="!bg-asana-sidebar-active !text-white"
        :title="collapsed ? project.name : undefined"
      >
        <span
          class="w-2 h-2 rounded-full flex-shrink-0"
          :class="getProjectDotClass(project.color)"
        ></span>
        <span v-if="!collapsed" class="truncate flex-1">{{ project.name }}</span>
      </RouterLink>

      <!-- Add project button -->
      <button
        v-if="!collapsed"
        @click="$emit('create-project')"
        class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/50 hover:bg-asana-sidebar-hover hover:text-white transition-colors w-full text-left"
      >
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>New project</span>
      </button>
    </div>

    <!-- User section at bottom -->
    <div class="border-t border-white/10 p-3">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img
            v-if="authStore.photoURL"
            :src="authStore.photoURL"
            :alt="authStore.displayName"
            class="w-full h-full object-cover"
          />
          <span v-else class="text-xs font-bold text-white">
            {{ initials }}
          </span>
        </div>
        <div v-if="!collapsed" class="min-w-0 flex-1">
          <p class="text-sm font-medium text-white truncate">{{ authStore.displayName }}</p>
          <p class="text-xs text-white/50 truncate">{{ authStore.user?.email }}</p>
        </div>
        <button
          v-if="!collapsed"
          @click="handleLogout"
          class="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
          title="Sign out"
        >
          <svg class="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent, h } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import type { ProjectColor } from '@/types'

defineEmits<{ 'create-project': [] }>()

const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const router = useRouter()
const collapsed = ref(false)

const workspaceName = computed(() => authStore.currentWorkspace?.name ?? 'My Workspace')
const initials = computed(() => {
  const name = authStore.displayName
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
})

// Icon components
const HomeIcon = defineComponent({ render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' })
]) })

const InboxIcon = defineComponent({ render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' })
]) })

const MyTasksIcon = defineComponent({ render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' })
]) })

const MembersIcon = defineComponent({ render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' })
]) })

const mainNav = [
  { label: 'Home', to: '/', icon: HomeIcon },
  { label: 'My Tasks', to: '/my-tasks', icon: MyTasksIcon },
  { label: 'Inbox', to: '/inbox', icon: InboxIcon },
  { label: 'Members', to: '/members', icon: MembersIcon }
]

const projectColorDotMap: Record<ProjectColor, string> = {
  red: 'bg-red-400',
  orange: 'bg-orange-400',
  yellow: 'bg-yellow-400',
  green: 'bg-green-400',
  teal: 'bg-teal-400',
  blue: 'bg-blue-400',
  indigo: 'bg-indigo-400',
  purple: 'bg-purple-400',
  pink: 'bg-pink-400',
  gray: 'bg-gray-400'
}

function getProjectDotClass(color: ProjectColor): string {
  return projectColorDotMap[color] ?? 'bg-gray-400'
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>
