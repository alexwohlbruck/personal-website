<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'accent' | 'ghost'
    size?: 'default' | 'sm' | 'icon'
    to?: RouteLocationRaw
    href?: string
    type?: 'button' | 'submit'
    disabled?: boolean
  }>(),
  { variant: 'default', size: 'default', type: 'button' },
)

const tag = computed(() => (props.to ? RouterLink : props.href ? 'a' : 'button'))

const attrs = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href, target: '_blank', rel: 'noopener noreferrer' }
  return { type: props.type, disabled: props.disabled }
})

const classes = computed(() =>
  cn(
    'btn',
    props.variant === 'accent' && 'btn-accent',
    props.variant === 'ghost' && 'btn-ghost',
    props.size === 'sm' && 'btn-sm',
    props.size === 'icon' && 'btn-icon',
  ),
)
</script>

<template>
  <component :is="tag" v-bind="attrs" :class="classes">
    <slot />
  </component>
</template>
