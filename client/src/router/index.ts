import { createRouter, createWebHistory } from 'vue-router'
import { site } from '@/data/site'
import { findProject } from '@/data/projects'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: `${site.name} · ${site.role}` },
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/views/ProjectsView.vue'),
      meta: { title: 'Projects' },
    },
    {
      path: '/projects/:name',
      name: 'project',
      component: () => import('@/views/ProjectView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: { title: 'About' },
    },
    {
      path: '/social',
      name: 'social',
      component: () => import('@/views/SocialView.vue'),
      meta: { title: 'Social' },
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('@/views/ContactView.vue'),
      meta: { title: 'Contact' },
    },
    {
      path: '/guestbook',
      name: 'guestbook',
      component: () => import('@/views/GuestbookView.vue'),
      meta: { title: 'Guestbook' },
    },

    // Paths the previous site published; keep them working.
    { path: '/work', redirect: { name: 'projects' } },
    { path: '/project/:name', redirect: (to) => ({ name: 'project', params: to.params }) },

    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Not found' },
    },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 80 }
    // Waits out the leave transition so the new page starts at the top.
    return new Promise((resolve) => setTimeout(() => resolve({ top: 0 }), 180))
  },
})

router.afterEach((to) => {
  const project = to.name === 'project' ? findProject(String(to.params.name)) : undefined
  const title = project?.title ?? (to.meta.title as string | undefined)
  document.title =
    to.name === 'home' || !title ? `${site.name} · ${site.role}` : `${title} · ${site.name}`
})

export default router
