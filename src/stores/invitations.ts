import { defineStore } from 'pinia'
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, query, where, arrayUnion, serverTimestamp
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { MemberRole } from '@/types'

// The Firebase "Trigger Email from Firestore" extension watches the `mail`
// collection and delivers messages via the SMTP provider you configured in
// the extension settings (Firebase Console → Extensions → Trigger Email).
async function sendInvitationEmail(
  to: string,
  workspaceName: string,
  invitedByName: string
): Promise<void> {
  const appUrl = import.meta.env.VITE_APP_URL ?? window.location.origin
  const registerUrl = `${appUrl}/register`

  await addDoc(collection(db, 'mail'), {
    to: [to],
    message: {
      subject: `You've been invited to join ${workspaceName}`,
      text: [
        `Hi,`,
        ``,
        `${invitedByName} has invited you to join "${workspaceName}".`,
        ``,
        `Sign up with this email address and you'll be added to the workspace automatically:`,
        registerUrl,
        ``,
        `See you there!`
      ].join('\n'),
      html: `
        <p>Hi,</p>
        <p><strong>${invitedByName}</strong> has invited you to join <strong>${workspaceName}</strong>.</p>
        <p>Sign up with this email address and you'll be added to the workspace automatically:</p>
        <p><a href="${registerUrl}">${registerUrl}</a></p>
        <p>See you there!</p>
      `
    },
    createdAt: serverTimestamp()
  })
}

export const useInvitationsStore = defineStore('invitations', () => {

  async function createInvitation(
    workspaceId: string,
    workspaceName: string,
    invitedEmail: string,
    role: MemberRole,
    invitedBy: string,
    invitedByName: string
  ): Promise<void> {
    const email = invitedEmail.trim().toLowerCase()

    await addDoc(collection(db, 'invitations'), {
      workspaceId,
      workspaceName,
      invitedEmail: email,
      role,
      invitedBy,
      createdAt: serverTimestamp()
    })

    await sendInvitationEmail(email, workspaceName, invitedByName)
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
