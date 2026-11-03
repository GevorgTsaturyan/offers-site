<template>
  <header class="header" :class="{ scrolled }">
    <div class="container bar">
      <RouterLink to="/" class="brand" @click="open = false">
        <span class="mark">{{ site.theme?.mark || '★' }}</span>
        <span class="name">{{ site.site_name }}</span>
      </RouterLink>

      <nav class="nav" :class="{ open }">
        <RouterLink to="/#offers" @click="open = false">Offers</RouterLink>
        <RouterLink v-if="!site.copy || site.copy.sections.includes('how')" to="/#how" @click="open = false">How it works</RouterLink>
        <RouterLink to="/info/responsible-gambling" @click="open = false">Play safe</RouterLink>
        <RouterLink v-if="site.subscribe_enabled !== false" to="/#subscribe" class="btn btn-gold btn-sm" @click="open = false">Get offers by email</RouterLink>
      </nav>

      <button class="burger" :aria-expanded="open" aria-label="Menu" @click="open = !open">
        <span /><span /><span />
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { site } from '../site.js';

const open = ref(false);
const scrolled = ref(false);
const onScroll = () => { scrolled.value = window.scrollY > 10; };
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener('scroll', onScroll));
</script>

<style scoped>
.header {
  position: sticky; top: 0; z-index: 50;
  transition: background .2s ease, border-color .2s ease;
  border-bottom: 1px solid transparent;
}
.header.scrolled {
  background: rgba(10, 14, 26, .82);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  border-bottom-color: var(--border);
}
.bar { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.brand { display: flex; align-items: center; gap: 10px; font-family: var(--display); font-weight: 800; font-size: 20px; }
.mark {
  display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, var(--gold-2), var(--gold)); color: #1a1405; font-size: 18px;
  box-shadow: 0 8px 20px -8px rgba(245,196,81,.7);
}
.nav { display: flex; align-items: center; gap: 28px; font-weight: 600; font-size: 15px; }
.nav a:not(.btn) { color: var(--muted); transition: color .15s; }
.nav a:not(.btn):hover { color: var(--text); }
.burger { display: none; background: none; border: 0; padding: 8px; cursor: pointer; }
.burger span { display: block; width: 22px; height: 2px; background: var(--text); margin: 5px 0; border-radius: 2px; }

@media (max-width: 820px) {
  .burger { display: block; }
  .nav {
    position: absolute; top: 72px; left: 0; right: 0;
    flex-direction: column; align-items: stretch; gap: 4px; padding: 12px 16px 20px;
    background: rgba(10,14,26,.97); border-bottom: 1px solid var(--border);
    transform: translateY(-8px); opacity: 0; pointer-events: none; transition: all .2s ease;
  }
  .nav.open { transform: none; opacity: 1; pointer-events: auto; }
  .nav a:not(.btn) { padding: 12px 4px; border-bottom: 1px solid var(--border); }
  .nav .btn { margin-top: 10px; }
}
</style>
