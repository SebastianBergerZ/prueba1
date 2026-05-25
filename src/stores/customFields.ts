import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp, type Unsubscribe
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { CustomField, CustomFieldType, CustomFieldValue } from '@/types'

export const useCustomFieldsStore = defineStore('customFields', () => {
  const fields = ref<CustomField[]>([])
  let unsubscribe: Unsubscribe | null = null

  function subscribeToProject(projectId: string): void {
    if (unsubscribe) unsubscribe()
    const q = query(collection(db, 'customFields'), where('projectId', '==', projectId))
    unsubscribe = onSnapshot(q, (snap) => {
      fields.value = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as CustomField))
        .sort((a, b) => a.order - b.order)
    })
  }

  function unsubscribeFromProject(): void {
    if (unsubscribe) { unsubscribe(); unsubscribe = null }
    fields.value = []
  }

  async function createField(projectId: string, name: string, type: CustomFieldType, options: string[] = []): Promise<string> {
    const ref = await addDoc(collection(db, 'customFields'), {
      projectId,
      name: name.trim(),
      type,
      options,
      order: fields.value.length,
      createdAt: serverTimestamp()
    })
    return ref.id
  }

  async function updateField(id: string, data: Partial<Pick<CustomField, 'name' | 'type' | 'options'>>): Promise<void> {
    await updateDoc(doc(db, 'customFields', id), data)
  }

  async function deleteField(id: string): Promise<void> {
    await deleteDoc(doc(db, 'customFields', id))
  }

  async function setTaskFieldValue(taskId: string, fieldId: string, value: CustomFieldValue): Promise<void> {
    await updateDoc(doc(db, 'tasks', taskId), {
      [`customFieldValues.${fieldId}`]: value ?? null
    })
  }

  return { fields, subscribeToProject, unsubscribeFromProject, createField, updateField, deleteField, setTaskFieldValue }
})
