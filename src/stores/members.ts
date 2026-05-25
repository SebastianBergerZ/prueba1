import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth'
import type { AppUser, MemberRole } from '@/types'

export const useMembersStore = defineStore('members', () => {
  const members = ref<AppUser[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const authStore = useAuthStore()

  const currentUserRole = computed<'owner' | MemberRole>(() => {
    const ws = authStore.currentWorkspace
    if (!ws || !authStore.uid) return 'member'
    if (ws.ownerId === authStore.uid) return 'owner'
    return ws.memberRoles?.[authStore.uid] ?? 'member'
  })

  const isViewer = computed(() => currentUserRole.value === 'viewer')
  const canEdit = computed(() => !isViewer.value)

  async function fetchMembers(): Promise<void> {
    const workspace = authStore.currentWorkspace
    if (!workspace) return

    loading.value = true
    error.value = null
    try {
      const memberUids = workspace.members
      if (memberUids.length === 0) {
        members.value = []
        return
      }
      const chunks: string[][] = []
      for (let i = 0; i < memberUids.length; i += 30) {
        chunks.push(memberUids.slice(i, i + 30))
      }
      const results: AppUser[] = []
      for (const chunk of chunks) {
        const q = query(collection(db, 'users'), where('uid', 'in', chunk))
        const snap = await getDocs(q)
        snap.docs.forEach((d) => results.push(d.data() as AppUser))
      }
      members.value = results
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to load members'
    } finally {
      loading.value = false
    }
  }

  async function findUserByEmail(email: string): Promise<AppUser | null> {
    const q = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()))
    const snap = await getDocs(q)
    if (snap.empty) return null
    return snap.docs[0].data() as AppUser
  }

  async function inviteMember(email: string, role: MemberRole = 'member'): Promise<{ success: boolean; message: string }> {
    const workspace = authStore.currentWorkspace
    if (!workspace) return { success: false, message: 'No workspace found' }

    const uid = authStore.uid
    if (workspace.ownerId !== uid) {
      return { success: false, message: 'Only the workspace owner can invite members' }
    }

    const found = await findUserByEmail(email)
    if (!found) {
      return { success: false, message: 'No user found with that email. They must register first.' }
    }

    if (workspace.members.includes(found.uid)) {
      return { success: false, message: 'This user is already a member of the workspace.' }
    }

    await updateDoc(doc(db, 'workspaces', workspace.id), {
      members: arrayUnion(found.uid),
      [`memberRoles.${found.uid}`]: role
    })

    authStore.currentWorkspace!.members = [...workspace.members, found.uid]
    if (!authStore.currentWorkspace!.memberRoles) authStore.currentWorkspace!.memberRoles = {}
    authStore.currentWorkspace!.memberRoles[found.uid] = role

    await fetchMembers()

    return { success: true, message: `${found.displayName} added as ${role}!` }
  }

  async function updateMemberRole(memberUid: string, role: MemberRole): Promise<void> {
    const workspace = authStore.currentWorkspace
    if (!workspace) return
    if (workspace.ownerId !== authStore.uid) throw new Error('Only the owner can change roles')

    await updateDoc(doc(db, 'workspaces', workspace.id), {
      [`memberRoles.${memberUid}`]: role
    })

    if (!authStore.currentWorkspace!.memberRoles) authStore.currentWorkspace!.memberRoles = {}
    authStore.currentWorkspace!.memberRoles[memberUid] = role
  }

  async function removeMember(memberUid: string): Promise<void> {
    const workspace = authStore.currentWorkspace
    if (!workspace) return

    const uid = authStore.uid
    if (workspace.ownerId !== uid) throw new Error('Only the owner can remove members')
    if (memberUid === uid) throw new Error('You cannot remove yourself')

    const roleUpdate: Record<string, any> = { members: arrayRemove(memberUid) }
    if (workspace.memberRoles?.[memberUid]) {
      roleUpdate[`memberRoles.${memberUid}`] = null
    }

    await updateDoc(doc(db, 'workspaces', workspace.id), roleUpdate)

    authStore.currentWorkspace!.members = workspace.members.filter((m) => m !== memberUid)
    if (authStore.currentWorkspace!.memberRoles) {
      delete authStore.currentWorkspace!.memberRoles[memberUid]
    }
    members.value = members.value.filter((m) => m.uid !== memberUid)
  }

  function getMemberById(uid: string): AppUser | undefined {
    return members.value.find((m) => m.uid === uid)
  }

  function getMemberRole(uid: string): 'owner' | MemberRole {
    const ws = authStore.currentWorkspace
    if (!ws) return 'member'
    if (ws.ownerId === uid) return 'owner'
    return ws.memberRoles?.[uid] ?? 'member'
  }

  function getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  }

  return {
    members,
    loading,
    error,
    currentUserRole,
    isViewer,
    canEdit,
    fetchMembers,
    findUserByEmail,
    inviteMember,
    updateMemberRole,
    removeMember,
    getMemberById,
    getMemberRole,
    getInitials
  }
})
