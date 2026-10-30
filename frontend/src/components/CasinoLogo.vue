<template>
  <div class="logo" :class="size" :style="{ '--accent': accent }">
    <img v-if="src" :src="src" :alt="`${name} logo`" loading="lazy" />
    <span v-else>{{ initials }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  src: String,
  name: { type: String, default: '' },
  accent: { type: String, default: '#f5c451' },
  size: { type: String, default: 'md' },
});
const initials = computed(() => props.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '★');
</script>

<style scoped>
.logo {
  display: grid; place-items: center; flex-shrink: 0; overflow: hidden;
  border-radius: 16px; border: 1px solid var(--border-strong);
  background: radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--accent) 45%, transparent), rgba(255,255,255,.04) 70%);
  font-family: var(--display); font-weight: 800; color: var(--text);
}
.logo img { width: 100%; height: 100%; object-fit: contain; padding: 10px; background: rgba(255,255,255,.03); }
.md { width: 72px; height: 72px; font-size: 24px; }
.lg { width: 112px; height: 112px; font-size: 36px; border-radius: 22px; }
.sm { width: 44px; height: 44px; font-size: 15px; border-radius: 11px; }
</style>
