<template>
  <div class="container wrap">
    <div class="big gradient-text">404</div>
    <h1>This page took a wrong turn</h1>
    <p class="muted">The page you’re looking for doesn’t exist.</p>
    <RouterLink to="/" class="btn btn-gold">Back to offers</RouterLink>
  </div>
</template>

<script setup>
import { setTitle } from '../site.js';
setTitle('Page not found');
</script>

<style scoped>
.wrap { text-align: center; padding: 90px 20px; }
.big { font-family: var(--display); font-size: clamp(80px, 16vw, 150px); font-weight: 800; line-height: 1; }
h1 { font-size: 26px; margin: 10px 0 8px; }
p { margin: 0 0 24px; }
</style>
