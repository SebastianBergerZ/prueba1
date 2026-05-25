import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp, type Unsubscribe
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { Comment } from '@/types'

export const useCommentsStore = defineStore('comments', () => {
  const comments = ref<Comment[]>([])
  const currentTaskId = ref<string | null>(null)
  let unsubscribe: Unsubscribe | null = null

  function subscribeToTask(taskId: string): void {
    if (currentTaskId.value === taskId && unsubscribe) return
    if (unsubscribe) unsubscribe()
    currentTaskId.value = taskId
    const q = query(collection(db, 'comments'), where('taskId', '==', taskId))
    unsubscribe = onSnapshot(q, (snap) => {
      comments.value = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Comment))
        .sort((a, b) => {
          const aTime = 'toDate' in a.createdAt ? (a.createdAt as any).toMillis() : new Date(a.createdAt as any).getTime()
          const bTime = 'toDate' in b.createdAt ? (b.createdAt as any).toMillis() : new Date(b.createdAt as any).getTime()
          return aTime - bTime
        })
    }, (err) => {
      console.error('comments snapshot error:', err)
    })
  }

  function unsubscribeFromTask(): void {
    if (unsubscribe) { unsubscribe(); unsubscribe = null }
    currentTaskId.value = null
    comments.value = []
  }

  async function addComment(taskId: string, authorId: string, text: string): Promise<void> {
    await addDoc(collection(db, 'comments'), {
      taskId,
      authorId,
      text: text.trim(),
      createdAt: serverTimestamp()
    })
  }

  async function updateComment(id: string, text: string): Promise<void> {
    await updateDoc(doc(db, 'comments', id), {
      text: text.trim(),
      updatedAt: serverTimestamp()
    })
  }

  async function deleteComment(id: string): Promise<void> {
    await deleteDoc(doc(db, 'comments', id))
  }

  return { comments, subscribeToTask, unsubscribeFromTask, addComment, updateComment, deleteComment }
})
