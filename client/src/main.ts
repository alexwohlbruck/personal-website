import { createApp } from 'vue'
import { createPinia } from 'pinia'

import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@/styles/main.css'

import App from './App.vue'
import router from './router'
import { initAnalytics } from '@/lib/analytics'

// Before mount, so gtag is queued and ready for the router's first page view.
initAnalytics()

createApp(App).use(createPinia()).use(router).mount('#app')
