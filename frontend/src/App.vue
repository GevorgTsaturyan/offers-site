<template>
  <template v-if="isAdmin">
    <RouterView />
  </template>
  <template v-else>
    <AgeNotice />
    <SiteHeader />
    <main class="page">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="$route.path" />
        </Transition>
      </RouterView>
    </main>
    <SiteFooter />
  </template>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import SiteHeader from './components/SiteHeader.vue';
import SiteFooter from './components/SiteFooter.vue';
import AgeNotice from './components/AgeNotice.vue';

const route = useRoute();
const isAdmin = computed(() => route.path.startsWith('/admin'));
</script>

<style>
.page { min-height: 60vh; }
.page-enter-active, .page-leave-active { transition: opacity .2s ease, transform .2s ease; }
.page-enter-from { opacity: 0; transform: translateY(6px); }
.page-leave-to { opacity: 0; }
</style>
