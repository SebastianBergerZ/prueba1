import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Initialize auth before mounting so route guards work
import { useAuthStore } from './stores/auth'
const authStore = useAuthStore()

authStore.init().then(() => {
  app.use(router)
  app.mount('#app')
})
