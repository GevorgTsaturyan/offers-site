<template>
  <div class="container wrap">
    <div class="card glass fade-in">
      <div class="icon" :class="state">{{ icons[state] }}</div>
      <h1>{{ titles[state] }}</h1>
      <p class="muted">{{ texts[state] }}</p>
      <RouterLink to="/#offers" class="btn btn-gold">Browse current offers</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { request } from '../api.js';
import { setTitle } from '../site.js';

const route = useRoute();
const state = ref('loading');

const icons  = { loading: '⏳', confirmed: '🎉', expired: '⌛', invalid: '⚠️', suppressed: '✉️', error: '⚠️' };
const titles = {
  loading: 'Confirming your subscription…',
  confirmed: 'You’re subscribed!',
  expired: 'This link has expired',
  invalid: 'This link is not valid',
  suppressed: 'Subscription not completed',
  error: 'Something went wrong',
};
const texts = {
  loading: 'One moment please.',
  confirmed: 'Thanks for confirming. You’ll get our best new offers by email — you can unsubscribe with one click at any time.',
  expired: 'Confirmation links are valid for 48 hours. Please subscribe again and click the new link.',
  invalid: 'It may have been used already. If you already confirmed, you’re all set.',
  suppressed: 'This address unsubscribed from our emails. Contact us if you want to receive them again.',
  error: 'We could not confirm right now. Please try the link again in a few minutes.',
};

onMounted(async () => {
  setTitle('Confirm subscription');
  const token = String(route.query.token || '');
  if (!token) { state.value = 'invalid'; return; }
  try {
    const r = await request('/api/confirm', { method: 'POST', body: { token } });
    state.value = titles[r.status] ? r.status : 'error';
  } catch { state.value = 'error'; }
});
</script>

<style scoped>
.wrap { padding: 80px 20px; display: grid; place-items: center; }
.card { max-width: 560px; width: 100%; text-align: center; padding: 48px 32px; }
.icon { font-size: 46px; width: 92px; height: 92px; margin: 0 auto 20px; display: grid; place-items: center; border-radius: 50%; background: var(--surface); border: 1px solid var(--border); }
.icon.confirmed { background: rgba(52,211,153,.12); border-color: rgba(52,211,153,.35); }
h1 { font-size: clamp(24px, 4vw, 32px); margin-bottom: 12px; }
p { margin: 0 0 26px; }
@media (max-width: 520px) { .card { padding: 36px 20px; } }
</style>
