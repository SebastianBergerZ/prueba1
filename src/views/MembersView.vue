<template>
  <div class="p-6 max-w-3xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Team members</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          {{ membersStore.members.length }} member{{ membersStore.members.length === 1 ? '' : 's' }} in {{ workspaceName }}
        </p>
      </div>
      <button
        v-if="isOwner"
        @click="showInvite = true"
        class="btn-primary gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Invite member
      </button>
    </div>

    <!-- Loading -->
    <div v-if="membersStore.loading" class="card divide-y divide-gray-100">
      <div v-for="i in 3" :key="i" class="flex items-center gap-4 px-5 py-4">
        <div class="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div class="h-3 w-48 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Members list -->
    <div v-else class="card divide-y divide-gray-100 overflow-hidden">
      <div
        v-for="member in membersStore.members"
        :key="member.uid"
        class="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <!-- Avatar -->
        <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-primary-500">
          <img
            v-if="member.photoURL"
            :src="member.photoURL"
            :alt="member.displayName"
            class="w-full h-full object-cover"
          />
          <span v-else class="text-sm font-bold text-white">
            {{ membersStore.getInitials(member.displayName) }}
          </span>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-gray-900 truncate">{{ member.displayName }}</p>
            <span
              v-if="member.uid === workspace?.ownerId"
              class="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full font-medium"
            >
              Owner
            </span>
            <span
              v-if="member.uid === authStore.uid"
              class="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full"
            >
              You
            </span>
          </div>
          <p class="text-xs text-gray-500 truncate">{{ member.email }}</p>
        </div>

        <!-- Remove button (owner only, not self) -->
        <button
          v-if="isOwner && member.uid !== authStore.uid"
          @click="handleRemove(member)"
          class="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          title="Remove member"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
          </svg>
        </button>
      </div>

      <!-- Empty -->
      <div v-if="membersStore.members.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p class="text-sm text-gray-500 mb-3">No members yet</p>
        <button v-if="isOwner" @click="showInvite = true" class="btn-primary text-sm">Invite your first member</button>
      </div>
    </div>

    <!-- Invite modal -->
    <InviteMembersModal v-if="showInvite" @close="showInvite = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMembersStore } from '@/stores/members'
import InviteMembersModal from '@/components/members/InviteMembersModal.vue'
import type { AppUser } from '@/types'

const authStore = useAuthStore()
const membersStore = useMembersStore()
const showInvite = ref(false)

const workspace = computed(() => authStore.currentWorkspace)
const workspaceName = computed(() => workspace.value?.name ?? 'Workspace')
const isOwner = computed(() => workspace.value?.ownerId === authStore.uid)

onMounted(() => membersStore.fetchMembers())

async function handleRemove(member: AppUser) {
  if (!confirm(`Remove ${member.displayName} from the workspace?`)) return
  try {
    await membersStore.removeMember(member.uid)
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Failed to remove member')
  }
}
</script>
