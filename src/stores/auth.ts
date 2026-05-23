import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '@/firebase'
import type { AppUser, Workspace } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const appUser = ref<AppUser | null>(null)
  const currentWorkspace = ref<Workspace | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const displayName = computed(() => user.value?.displayName ?? user.value?.email ?? 'User')
  const photoURL = computed(() => user.value?.photoURL ?? null)
  const uid = computed(() => user.value?.uid ?? null)

  // ── Helpers ────────────────────────────────────────────────────────────────

  async function ensureUserDocument(firebaseUser: User): Promise<void> {
    const userRef = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(userRef)

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        createdAt: serverTimestamp()
      })
    }

    // Ensure the user has at least one workspace
    await ensureDefaultWorkspace(firebaseUser)

    appUser.value = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
      email: firebaseUser.email ?? '',
      photoURL: firebaseUser.photoURL,
      createdAt: snap.data()?.createdAt ?? new Date()
    }
  }

  async function ensureDefaultWorkspace(firebaseUser: User): Promise<void> {
    const { collection, query, where, getDocs, addDoc } = await import('firebase/firestore')
    const wsQuery = query(
      collection(db, 'workspaces'),
      where('ownerId', '==', firebaseUser.uid)
    )
    const snap = await getDocs(wsQuery)

    if (snap.empty) {
      const wsRef = await addDoc(collection(db, 'workspaces'), {
        name: `${firebaseUser.displayName?.split(' ')[0] ?? 'My'}'s Workspace`,
        ownerId: firebaseUser.uid,
        members: [firebaseUser.uid],
        createdAt: serverTimestamp()
      })
      currentWorkspace.value = {
        id: wsRef.id,
        name: `${firebaseUser.displayName?.split(' ')[0] ?? 'My'}'s Workspace`,
        ownerId: firebaseUser.uid,
        members: [firebaseUser.uid],
        createdAt: new Date()
      }
    } else {
      const ws = snap.docs[0]
      currentWorkspace.value = { id: ws.id, ...ws.data() } as Workspace
    }
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async function login(email: string, password: string): Promise<void> {
    error.value = null
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password)
      await ensureUserDocument(firebaseUser)
    } catch (err: unknown) {
      error.value = formatAuthError(err)
      throw err
    }
  }

  async function register(email: string, password: string, name: string): Promise<void> {
    error.value = null
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(firebaseUser, { displayName: name })
      await ensureUserDocument(firebaseUser)
    } catch (err: unknown) {
      error.value = formatAuthError(err)
      throw err
    }
  }

  async function loginWithGoogle(): Promise<void> {
    error.value = null
    try {
      const { user: firebaseUser } = await signInWithPopup(auth, googleProvider)
      await ensureUserDocument(firebaseUser)
    } catch (err: unknown) {
      error.value = formatAuthError(err)
      throw err
    }
  }

  async function logout(): Promise<void> {
    await signOut(auth)
    user.value = null
    appUser.value = null
    currentWorkspace.value = null
  }

  function init(): Promise<void> {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        user.value = firebaseUser
        if (firebaseUser) {
          await ensureUserDocument(firebaseUser)
        }
        loading.value = false
        resolve()
      })
    })
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  function formatAuthError(err: unknown): string {
    if (typeof err === 'object' && err !== null && 'code' in err) {
      const code = (err as { code: string }).code
      const messages: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/invalid-credential': 'Invalid email or password.'
      }
      return messages[code] ?? `Authentication error: ${code}`
    }
    return 'An unexpected error occurred.'
  }

  return {
    user,
    appUser,
    currentWorkspace,
    loading,
    error,
    isAuthenticated,
    displayName,
    photoURL,
    uid,
    login,
    register,
    loginWithGoogle,
    logout,
    init
  }
})
