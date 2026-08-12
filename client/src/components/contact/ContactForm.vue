<script setup lang="ts">
import { computed, ref } from 'vue'
import { Motion, AnimatePresence } from 'motion-v'
import { Check, Loader2, Send, TriangleAlert } from '@lucide/vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useLiveStore } from '@/stores/live'
import { duration, ease } from '@/lib/motion'

const live = useLiveStore()

const name = ref('')
const email = ref('')
const message = ref('')

type State = 'idle' | 'sending' | 'sent' | 'error'
const state = ref<State>('idle')
const feedback = ref('')

const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
const canSubmit = computed(
  () => name.value.trim() && emailValid.value && message.value.trim().length > 1,
)

async function submit() {
  if (!emailValid.value) {
    state.value = 'error'
    feedback.value = "That email address doesn't look right."
    return
  }

  state.value = 'sending'
  try {
    const response = await live.sendMessage({
      name: name.value.trim(),
      email: email.value.trim(),
      message: message.value.trim(),
    })
    state.value = 'sent'
    feedback.value = response.message || 'Message sent. I usually reply within a day or two.'
    name.value = ''
    email.value = ''
    message.value = ''
  } catch (error) {
    state.value = 'error'
    feedback.value =
      error instanceof Error && error.message !== 'No backend configured'
        ? error.message
        : "The message couldn't be sent. Try me on GitHub or LinkedIn instead."
  }
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="submit">
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="block">
        <span class="mb-2 block text-sm text-ink-2">Your name</span>
        <input v-model="name" type="text" class="field" placeholder="Ada Lovelace" required />
      </label>

      <label class="block">
        <span class="mb-2 block text-sm text-ink-2">Your email</span>
        <input
          v-model="email"
          type="email"
          class="field"
          placeholder="ada@example.com"
          required
          autocomplete="email"
        />
      </label>
    </div>

    <label class="block">
      <span class="mb-2 block text-sm text-ink-2">Message</span>
      <textarea
        v-model="message"
        rows="7"
        class="field resize-y"
        placeholder="What are you working on?"
        required
      />
    </label>

    <div class="flex flex-wrap items-center justify-between gap-4 pt-1">
      <AnimatePresence>
        <Motion
          v-if="state !== 'idle' && state !== 'sending'"
          as="p"
          :initial="{ opacity: 0, y: 6, filter: 'blur(3px)' }"
          :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :exit="{ opacity: 0 }"
          :transition="{ duration: duration.base, ease }"
          class="flex items-center gap-2 text-sm"
          :class="state === 'sent' ? 'text-accent' : 'text-ink-2'"
        >
          <Check v-if="state === 'sent'" class="size-4 shrink-0" />
          <TriangleAlert v-else class="size-4 shrink-0" />
          {{ feedback }}
        </Motion>
      </AnimatePresence>

      <AppButton
        variant="accent"
        type="submit"
        :disabled="!canSubmit || state === 'sending'"
        class="ml-auto"
      >
        <Loader2 v-if="state === 'sending'" class="size-4 animate-spin" />
        <Send v-else class="size-4" />
        {{ state === 'sending' ? 'Sending' : 'Send message' }}
      </AppButton>
    </div>
  </form>
</template>
