<script setup lang="ts">
import PageHeader from '@/components/layout/PageHeader.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import ContactForm from '@/components/contact/ContactForm.vue'
import AvailabilityCalendar from '@/components/contact/AvailabilityCalendar.vue'
import InlineIcon from '@/components/ui/InlineIcon.vue'
import { socials } from '@/data/site'

/** Everywhere but here: the email entry points back at this page. */
const elsewhere = socials.filter((social) => social.href)
</script>

<template>
  <div class="pb-8">
    <PageHeader
      title="Say hello"
      lede="Work, side projects, or a strong opinion about bike infrastructure. All welcome."
    />

    <section class="grid gap-12 border-t border-rule py-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
      <div>
        <ContactForm />
      </div>

      <aside class="space-y-6">
        <div class="card p-5">
          <p class="text-sm font-medium">Prefer somewhere else?</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <a
              v-for="link in elsewhere"
              :key="link.label"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              class="chip hover:text-accent"
            >
              <InlineIcon :name="link.icon" :size="13" />
              {{ link.label }}
            </a>
          </div>
        </div>
      </aside>
    </section>

    <section class="py-10">
      <SectionHeading
        title="This week"
        note="Roughly when I'm free. Weekends are usually a maybe."
      />
      <AvailabilityCalendar />
    </section>
  </div>
</template>
