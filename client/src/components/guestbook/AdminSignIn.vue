<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { Check, Loader2, LogOut, ShieldCheck, ShieldUser, TriangleAlert, X } from '@lucide/vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useAdmin } from '@/lib/admin'

/**
 * Sign in as the one person allowed to moderate the guestbook.
 *
 * Two steps, because the second one only makes sense after the first: an
 * address, then the code that address just received. No password field, since
 * there is no password anywhere in this system to type into it.
 */

const { signedIn, email, requestAdminCode, verifyAdminCode, signOutAdmin, restoreAdminSession } =
  useAdmin()

const open = ref(false)
const step = ref<'email' | 'code'>('email')
const address = ref('')
const code = ref('')
const busy = ref(false)
const notice = ref('')
const error = ref('')
const emailField = useTemplateRef<HTMLInputElement>('emailField')
const codeField = useTemplateRef<HTMLInputElement>('codeField')

/**
 * Land on the field, not the close button.
 *
 * The dialog otherwise focuses the first thing it can reach, which is the
 * dismiss control, and a plain autofocus attribute loses to it.
 */
function focusField(event: Event) {
  event.preventDefault()
  emailField.value?.focus()
}

const addressValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.value.trim()))

watch(open, (isOpen) => {
  if (isOpen) return
  // Reopening should not resume half of a previous attempt.
  step.value = 'email'
  code.value = ''
  notice.value = ''
  error.value = ''
})

async function sendCode() {
  if (!addressValid.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    notice.value = await requestAdminCode(address.value)
    step.value = 'code'
    await nextTick()
    codeField.value?.focus()
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : 'That could not be sent.'
  } finally {
    busy.value = false
  }
}

async function submitCode() {
  if (code.value.trim().length !== 6 || busy.value) return
  busy.value = true
  error.value = ''
  try {
    await verifyAdminCode(address.value, code.value)
    open.value = false
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : 'That code was not accepted.'
    code.value = ''
  } finally {
    busy.value = false
  }
}

onMounted(() => void restoreAdminSession())
</script>

<template>
  <div class="flex items-center gap-2">
    <template v-if="signedIn">
      <span class="admin-badge" title="You can edit and remove any mark on the canvas">
        <ShieldCheck class="size-3.5" />
        Moderating as {{ email }}
      </span>
      <button type="button" class="admin-link" @click="signOutAdmin()">
        <LogOut class="size-3.5" />
        Sign out
      </button>
    </template>

    <button v-else type="button" class="admin-link" @click="open = true">
      <ShieldUser class="size-3.5" />
      Admin
    </button>

    <DialogRoot v-model:open="open">
      <DialogPortal>
        <DialogOverlay
          class="fixed inset-0 z-50 bg-paper/80 backdrop-blur-md data-[state=closed]:pointer-events-none data-[state=closed]:animate-[fade-out_150ms_ease] data-[state=open]:animate-[fade-in_200ms_ease]"
        />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 w-[min(24rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-rule-strong bg-surface p-5 shadow-e2 outline-none data-[state=closed]:pointer-events-none data-[state=closed]:animate-[fade-out_150ms_ease] data-[state=open]:animate-[fade-in_200ms_ease]"
          @open-auto-focus="focusField"
        >
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <DialogTitle class="text-lg font-semibold text-ink">Site owner sign in</DialogTitle>
              <DialogDescription class="mt-1 text-sm leading-relaxed text-ink-2">
                {{
                  step === 'email'
                    ? 'Enter the owner address and a one time code will be mailed to it.'
                    : `Enter the six digit code sent to ${address.trim()}.`
                }}
              </DialogDescription>
            </div>
            <button
              type="button"
              class="btn btn-icon btn-ghost shrink-0"
              aria-label="Close"
              @click="open = false"
            >
              <X class="size-4" />
            </button>
          </div>

          <form v-if="step === 'email'" class="space-y-3" novalidate @submit.prevent="sendCode">
            <label class="block">
              <span class="mb-2 block text-sm text-ink-2">Email</span>
              <input
                ref="emailField"
                v-model="address"
                type="email"
                class="field"
                placeholder="you@example.com"
                autocomplete="email"
              />
            </label>
            <AppButton
              variant="accent"
              type="submit"
              class="w-full"
              :disabled="!addressValid || busy"
            >
              <Loader2 v-if="busy" class="size-4 animate-spin" />
              {{ busy ? 'Sending' : 'Send code' }}
            </AppButton>
          </form>

          <form v-else class="space-y-3" novalidate @submit.prevent="submitCode">
            <label class="block">
              <span class="mb-2 block text-sm text-ink-2">Code</span>
              <input
                ref="codeField"
                v-model="code"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                class="field code-field"
                placeholder="000000"
              />
            </label>
            <AppButton
              variant="accent"
              type="submit"
              class="w-full"
              :disabled="code.trim().length !== 6 || busy"
            >
              <Loader2 v-if="busy" class="size-4 animate-spin" />
              {{ busy ? 'Checking' : 'Sign in' }}
            </AppButton>
            <button
              type="button"
              class="w-full text-center text-xs text-ink-3 hover:text-ink-2"
              @click="step = 'email'"
            >
              Use a different address
            </button>
          </form>

          <p
            v-if="error || notice"
            class="mt-3 flex items-start gap-2 text-xs leading-relaxed"
            :class="error ? 'text-ink-2' : 'text-ink-3'"
            role="status"
          >
            <TriangleAlert v-if="error" class="mt-px size-3.5 shrink-0 text-accent" />
            <Check v-else class="mt-px size-3.5 shrink-0 text-accent" />
            {{ error || notice }}
          </p>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>

<style scoped>
.admin-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border-radius: 0.5rem;
  padding: 0.15rem 0.35rem;
  color: var(--ink-3);
  font-size: 0.75rem;
  font-weight: 600;
  transition: color 150ms ease, background-color 150ms ease;
}
.admin-link:hover {
  color: var(--ink);
  background: var(--accent-wash);
}
.admin-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid color-mix(in oklab, var(--accent) 40%, var(--rule-strong));
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
  color: var(--accent);
  background: var(--accent-wash);
  font-size: 0.72rem;
  font-weight: 650;
}
.code-field {
  font-family: var(--font-mono);
  font-size: 1.05rem;
  letter-spacing: 0.4em;
}
</style>
