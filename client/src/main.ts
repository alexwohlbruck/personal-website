import Vue from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'
import { BACKEND_URL } from './globals'
import './styles/style.scss'

import VisibleDirective from './directives/VisibleDirective'

import { io } from 'socket.io-client'
import VueSocketIOExt from 'vue-socket.io-extended'
import VueGtag from 'vue-gtag'
import dayjs from 'dayjs'
import Toasted from 'vue-toasted'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
  SharedElementRouteGuard,
  SharedElementDirective,
  createSharedElementDirective,
} from 'v-shared-element'

Vue.config.productionTip = false

Vue.use(
  VueGtag,
  {
    config: { id: 'G-MNXNSBCLCN' },
  },
  router,
)

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

Vue.use(SharedElementDirective, {
  ease: 'cubic-bezier(.02,.6,.47,1)',
  duration: '600ms',
})
router.beforeEach(SharedElementRouteGuard)

dayjs.extend(relativeTime)
Vue.prototype.$dayjs = dayjs

Vue.directive('visible', VisibleDirective as any)

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app')
