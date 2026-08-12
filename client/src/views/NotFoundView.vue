<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
</script>

<template>
  <section class="grid min-h-[70vh] place-items-center py-24 text-center">
    <div>
      <h1 class="display">Nothing here</h1>
      <p class="prose-body mx-auto mt-6 max-w-sm">
        This page moved, or it never existed. The work is all still where you'd expect it.
      </p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <AppButton variant="accent" :to="{ name: 'projects' }">Browse projects</AppButton>
        <AppButton :to="{ name: 'home' }">Back home</AppButton>
      </div>
    </div>
  </section>
</template>
