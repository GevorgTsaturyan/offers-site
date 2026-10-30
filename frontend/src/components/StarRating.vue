<template>
  <span class="rating" :title="`${value} out of 5`">
    <span class="stars" :style="{ '--pct': `${(value / 5) * 100}%` }">★★★★★</span>
    <span v-if="showValue" class="val">{{ Number(value).toFixed(1) }}</span>
  </span>
</template>

<script setup>
defineProps({ value: { type: Number, default: 0 }, showValue: { type: Boolean, default: true } });
</script>

<style scoped>
.rating { display: inline-flex; align-items: center; gap: 8px; }
.stars {
  font-size: 15px; letter-spacing: 2px; line-height: 1;
  background: linear-gradient(90deg, var(--gold) var(--pct), rgba(255,255,255,.18) var(--pct));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.val { font-weight: 700; font-size: 14px; }
</style>
