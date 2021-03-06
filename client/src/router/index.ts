import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'
import { preloadImage } from '@/util'

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
    component: () => import('@/views/Project.vue'),
    beforeEnter: (to, from, next) => {
      const path = require('@/assets/svg/arrow-left.svg')
      preloadImage(path)
      next()
    }
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
