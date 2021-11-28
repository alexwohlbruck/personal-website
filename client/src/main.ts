import Vue from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'
import VueGtag from 'vue-gtag'
import VueSocketIOExt from 'vue-socket.io-extended'
import dayjs from 'dayjs'
import Toasted from 'vue-toasted'
import relativeTime from 'dayjs/plugin/relativeTime'
import { io } from 'socket.io-client'
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

Vue.use(Toasted, {
  position: 'bottom-center',
  className: 'toast',
  duration: 5000,
})

dayjs.extend(relativeTime)
Vue.prototype.$dayjs = dayjs

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
