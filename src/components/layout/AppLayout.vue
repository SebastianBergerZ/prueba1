<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">
    <AppSidebar />
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <AppHeader />
      <main class="flex-1 overflow-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import { useMembersStore } from '@/stores/members'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const membersStore = useMembersStore()
const projectsStore = useProjectsStore()

onMounted(() => {
  const workspaceId = authStore.currentWorkspace?.id
  if (workspaceId) {
    projectsStore.subscribeToProjects(workspaceId)
    membersStore.fetchMembers()
  }
})
</script>
