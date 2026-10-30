<template>
  <div class="wrap">
    <form class="card glass fade-in" @submit.prevent="login">
      <div class="mark">★</div>
      <h1>Admin sign in</h1>
      <p class="muted">{{ site.site_name }} control panel</p>
      <div class="field"><label>Username</label><input v-model.trim="username" class="input" autocomplete="username" required /></div>
      <div class="field"><label>Password</label><input v-model="password" class="input" type="password" autocomplete="current-password" required /></div>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <button class="btn btn-gold btn-block" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
      <RouterLink to="/" class="back">← Back to site</RouterLink>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { request, setAuth } from '../../api.js';
import { site } from '../../site.js';

const router = useRouter(); const route = useRoute();
const username = ref(''); const password = ref(''); const error = ref(''); const busy = ref(false);
document.title = 'Admin sign in';

async function login() {
  error.value = ''; busy.value = true;
  try {
    const r = await request('/api/admin/login', { method: 'POST', body: { username: username.value, password: password.value } });
    setAuth(r.token, r.username);
    router.replace(String(route.query.next || '/admin/offers'));
  } catch (e) { error.value = e.message; }
  finally { busy.value = false; }
}
</script>

<style scoped>
.wrap { min-height: 100vh; display: grid; place-items: center; padding: 20px; }
.card { width: 100%; max-width: 400px; padding: 36px 30px; display: flex; flex-direction: column; gap: 16px; }
.mark { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 14px; background: var(--gold); color: #1a1405; font-size: 22px; }
h1 { font-size: 26px; }
.muted { margin: -10px 0 4px; }
.back { text-align: center; font-size: 13px; color: var(--muted); }
</style>
