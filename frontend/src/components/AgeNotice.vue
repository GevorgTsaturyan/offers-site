<template>
  <div v-if="show" class="age-notice">
    <div class="container inner">
      <span><strong>{{ site.min_age }}+ only.</strong> Offers are for adults where online gambling is legal. Please play responsibly.</span>
      <button class="close" aria-label="Dismiss" @click="dismiss">✕</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { site } from '../site.js';

const show = ref(localStorage.getItem('age_notice_dismissed') !== '1');
function dismiss() { show.value = false; localStorage.setItem('age_notice_dismissed', '1'); }
</script>

<style scoped>
.age-notice { background: linear-gradient(90deg, rgba(245,196,81,.14), rgba(139,92,246,.14)); border-bottom: 1px solid var(--border); font-size: 13px; color: var(--muted); }
.inner { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 8px; padding-bottom: 8px; }
strong { color: var(--gold); }
.close { background: none; border: 0; color: var(--muted); cursor: pointer; padding: 4px 8px; font-size: 14px; }
.close:hover { color: var(--text); }
</style>
