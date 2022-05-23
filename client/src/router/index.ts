import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    name: 'home',
    path: '/',
    component: Home
  },
  {
    name: 'project',
    path: '/project/:name',
    component: () => import('@/views/Project.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  scrollBehavior: (to, from, savedPosition) => new Promise((resolve) => {
    router.app.$root.$once('triggerScroll', () => {
      const position = savedPosition || { x: 0, y: 0 }
      router.app.$nextTick(() => resolve({
        x: position.x,
        y: position.y
      }));
    });
  })
})

export default router
