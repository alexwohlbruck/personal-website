<script setup lang="ts">
import SectionHeading from '@/components/ui/SectionHeading.vue'
import SocialList from '@/components/social/SocialList.vue'
import ListeningPanel from '@/components/social/ListeningPanel.vue'
import InstagramGrid from '@/components/social/InstagramGrid.vue'
import OpenStreetMapPanel from '@/components/social/OpenStreetMapPanel.vue'
</script>

<template>
  <div class="pt-24 pb-8">
    <section class="py-12">
      <SectionHeading title="Recent sights" />
      <InstagramGrid />
    </section>

    <ListeningPanel />

    <OpenStreetMapPanel />

    <section class="py-10">
      <SectionHeading
        title="Elsewhere"
        note="Code, photos, music, and a slightly excessive number of map edits."
      />
      <SocialList />
    </section>
  </div>
</template>
