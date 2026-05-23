<template>
  <div class="modal-overlay" @mousedown.self="$emit('close')">
    <div class="modal-content max-w-md">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">Invite team member</h2>
        <button @click="$emit('close')" class="p-1 rounded hover:bg-gray-100 text-gray-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-5 space-y-4">
        <p class="text-sm text-gray-500">
          Enter the email address of someone who already has an account. They'll be added to your workspace immediately.
        </p>

        <div class="flex gap-2">
          <input
            v-model="email"
            ref="emailInput"
            type="email"
            placeholder="colleague@company.com"
            class="input-field flex-1"
            @keydown.enter.prevent="handleInvite"
            :disabled="loading"
          />
          <button
            @click="handleInvite"
            class="btn-primary px-4"
            :disabled="loading || !email.trim()"
          >
            <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span v-else>Invite</span>
          </button>
        </div>

        <!-- Success -->
        <div v-if="successMsg" class="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ successMsg }}
        </div>

        <!-- Error -->
        <div v-if="errorMsg" class="flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-md">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ errorMsg }}
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-100 flex justify-end">
        <button @click="$emit('close')" class="btn-secondary">Done</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useMembersStore } from '@/stores/members'

defineEmits<{ close: [] }>()

const membersStore = useMembersStore()
const email = ref('')
const loading = ref(false)
const successMsg = ref('')
const errorMsg = ref('')
const emailInput = ref<HTMLInputElement | null>(null)

onMounted(() => nextTick(() => emailInput.value?.focus()))

async function handleInvite() {
  if (!email.value.trim()) return
  loading.value = true
  successMsg.value = ''
  errorMsg.value = ''

  const result = await membersStore.inviteMember(email.value.trim())

  if (result.success) {
    successMsg.value = result.message
    email.value = ''
  } else {
    errorMsg.value = result.message
  }
  loading.value = false
}
</script>
