import Vue from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'
import VueGtag from 'vue-gtag'
import VueSocketIOExt from 'vue-socket.io-extended';
import { io } from 'socket.io-client';
import './styles/style.scss'
import { BACKEND_URL } from './globals'

const VueScrollTo = require('vue-scrollto')

Vue.config.productionTip = false

Vue.use(VueScrollTo)

Vue.use(VueGtag, {
  config: { id: 'G-MNXNSBCLCN' },
}, router)

const socket = io(BACKEND_URL)

Vue.use(VueSocketIOExt, socket, {
  store,
  actionPrefix: '',
  mutationPrefix: '',
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
