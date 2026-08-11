<script setup lang="ts">
import PageHeader from '@/components/layout/PageHeader.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import SocialList from '@/components/social/SocialList.vue'
import NowPlaying from '@/components/social/NowPlaying.vue'
import InstagramGrid from '@/components/social/InstagramGrid.vue'
</script>

<template>
  <div class="pb-8">
    <PageHeader
      title="Where else to find me"
      lede="Code, photos, music, and a slightly excessive number of map edits."
    />

    <section class="border-t border-rule py-12">
      <SocialList />
    </section>

    <section class="py-10">
      <SectionHeading title="Currently in my ears" />
      <div class="card max-w-xl p-6">
        <NowPlaying />
      </div>
    </section>

    <section class="py-10">
      <SectionHeading title="Recently seen" />
      <InstagramGrid />
    </section>
  </div>
</template>
