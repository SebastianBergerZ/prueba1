import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue')
      },
      {
        path: 'my-tasks',
        name: 'my-tasks',
        component: () => import('@/views/MyTasksView.vue')
      },
      {
        path: 'inbox',
        name: 'inbox',
        component: () => import('@/views/InboxView.vue')
      },
      {
        path: 'project/:id',
        name: 'project',
        component: () => import('@/views/ProjectView.vue'),
        props: true
      },
      {
        path: 'project/:projectId/task/:taskId',
        name: 'task-detail',
        component: () => import('@/views/TaskDetailView.vue'),
        props: true
      },
      {
        path: 'members',
        name: 'members',
        component: () => import('@/views/MembersView.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Wait for auth initialization
  if (authStore.loading) {
    await new Promise<void>((resolve) => {
      const unwatch = setInterval(() => {
        if (!authStore.loading) {
          clearInterval(unwatch)
          resolve()
        }
      }, 50)
    })
  }

  const isAuthenticated = authStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.requiresGuest && isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
