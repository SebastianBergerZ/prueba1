import { defineStore } from 'pinia'
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, query, where, arrayUnion, serverTimestamp
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { MemberRole } from '@/types'

export const useInvitationsStore = defineStore('invitations', () => {

  async function createInvitation(
    workspaceId: string,
    workspaceName: string,
    invitedEmail: string,
    role: MemberRole,
    invitedBy: string
  ): Promise<void> {
    await addDoc(collection(db, 'invitations'), {
      workspaceId,
      workspaceName,
      invitedEmail: invitedEmail.trim().toLowerCase(),
      role,
      invitedBy,
      createdAt: serverTimestamp()
    })
  }

  async function acceptPendingInvitations(email: string, uid: string): Promise<void> {
    const q = query(
      collection(db, 'invitations'),
      where('invitedEmail', '==', email.trim().toLowerCase())
    )
    const snap = await getDocs(q)
    if (snap.empty) return

    for (const invitation of snap.docs) {
      const data = invitation.data()
      await updateDoc(doc(db, 'workspaces', data.workspaceId), {
        members: arrayUnion(uid),
        [`memberRoles.${uid}`]: data.role
      })
      await deleteDoc(doc(db, 'invitations', invitation.id))
    }
  }

  return { createInvitation, acceptPendingInvitations }
})
