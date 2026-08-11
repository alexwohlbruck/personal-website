<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
</script>

<template>
  <a
    href="#main"
    class="btn sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
  >
    Skip to content
  </a>

  <AppHeader />

  <main id="main" class="mx-auto max-w-6xl px-5 md:px-8">
    <RouterView v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </main>

  <AppFooter />
</template>
