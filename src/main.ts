import Vue from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'
import VueGtag from 'vue-gtag'
import './styles/style.scss'

const VueScrollTo = require('vue-scrollto')

Vue.config.productionTip = false

Vue.use(VueScrollTo)

Vue.use(VueGtag, {
  config: { id: 'G-MNXNSBCLCN' },
}, router)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
