import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import { preloadImage } from '@/util'
import store from '../store'
import jwt from 'jsonwebtoken'

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
    name: 'signIn',
    path: '/sign-in',
    beforeEnter: (to, from, next) => {
      const googleOauthUrl = `${process.env.VUE_APP_BACKEND_URL}/auth/google`
      window.location.href = googleOauthUrl
    },
  },
  {
    name: 'signOut',
    path: '/sign-out',
    beforeEnter: (to, from, next) => {
      store.commit('SET_USER', null)
      next(from.path)
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
  },
]

const checkUrlForToken = (to) => {
  const token = to.query.token
  if (token) {
    const decoded = jwt.decode(token as string)
    if (decoded) {
      const { user } = decoded
      store.commit('SET_USER', user)
    }
    return router.replace({ path: to.path, query: {} })
  }
}

const saveScrollPosition = (to, from, savedPosition) =>
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
  })

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  scrollBehavior: saveScrollPosition as any,
})

router.beforeEach((to, from, next) => {
  checkUrlForToken(to)
  next()
})

export default router
