<script setup lang="ts">
import PageHeader from '@/components/layout/PageHeader.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import SocialList from '@/components/social/SocialList.vue'
import ListeningPanel from '@/components/social/ListeningPanel.vue'
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

    <ListeningPanel />

    <section class="py-10">
      <SectionHeading title="Recent sights" />
      <InstagramGrid />
    </section>
  </div>
</template>
