import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import { preloadImage } from '@/util'

Vue.use(VueRouter)

enum Color {
  Dark = 'dark',
  Light = 'light',
  White = 'white',
  Primary = 'primary',
  Accent = 'accent',
}

const routes: Array<RouteConfig> = [
  {
    name: 'home',
    path: '/',
    component: () => import('@/views/Home.vue'),
    meta: {
      color: Color.Dark,
    },
  },
  {
    name: 'about',
    path: '/about',
    component: () => import('@/views/About.vue'),
    meta: {
      color: Color.Primary,
    },
  },
  {
    name: 'work',
    path: '/work',
    component: () => import('@/views/Work.vue'),
    meta: {
      color: Color.Dark,
    },
  },
  {
    name: 'contact',
    path: '/contact',
    component: () => import('@/views/Contact.vue'),
    meta: {
      color: Color.Primary,
    },
  },
  {
    name: 'social',
    path: '/social',
    component: () => import('@/views/Social.vue'),
    meta: {
      color: Color.Primary,
    },
  },
  {
    name: 'project',
    path: '/project/:name',
    component: () => import('@/views/Project.vue'),
    beforeEnter: (to, from, next) => {
      const path = require('@/assets/svg/arrow-left.svg')
      preloadImage(path)
      next()
    },
    meta: {
      secondaryNav: true,
    },
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  scrollBehavior: (to, from, savedPosition) =>
    new Promise((resolve) => {
      router.app.$root.$once('triggerScroll', () => {
        const position = savedPosition || { x: 0, y: 0 }
        router.app.$nextTick(() =>
          resolve({
            x: position.x,
            y: position.y,
          }),
        )
      })
    }),
})

export default router
