<template>
  <div class="admin">
    <aside class="sidebar" :class="{ open }">
      <RouterLink to="/admin/offers" class="brand" @click="open = false"><span class="mark">★</span><span>{{ site.site_name }}</span></RouterLink>
      <nav>
        <RouterLink to="/admin/offers" @click="open = false"><span>🎁</span> Offers</RouterLink>
        <RouterLink to="/admin/offers/new" @click="open = false"><span>➕</span> Add offer</RouterLink>
        <RouterLink to="/admin/settings" @click="open = false"><span>⚙️</span> Site settings</RouterLink>
        <a href="/" target="_blank"><span>↗</span> View site</a>
      </nav>
      <div class="user">
        <span class="muted">Signed in as <strong>{{ auth.username }}</strong></span>
        <button class="btn btn-ghost btn-sm" @click="logout">Sign out</button>
      </div>
    </aside>
    <div class="body">
      <header class="topbar">
        <button class="burger" aria-label="Menu" @click="open = !open">☰</button>
        <span class="top-title">Admin</span>
      </header>
      <main class="content">
        <RouterView :key="$route.fullPath" />
      </main>
    </div>
    <div v-if="open" class="scrim" @click="open = false" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { auth, setAuth } from '../../api.js';
import { site } from '../../site.js';

const router = useRouter();
const open = ref(false);
function logout() { setAuth('', ''); router.push('/admin/login'); }
// Token expired mid-session (api.js cleared it on a 401) → back to login.
watch(() => auth.token, (t) => { if (!t) router.push('/admin/login'); });
</script>

<style scoped>
.admin { display: grid; grid-template-columns: 250px 1fr; min-height: 100vh; }
.sidebar { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; gap: 24px; padding: 22px 16px; background: rgba(0,0,0,.3); border-right: 1px solid var(--border); }
.brand { display: flex; align-items: center; gap: 10px; font-family: var(--display); font-weight: 800; font-size: 17px; padding: 0 8px; }
.mark { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 9px; background: var(--gold); color: #1a1405; }
nav { display: flex; flex-direction: column; gap: 4px; }
nav a { display: flex; gap: 10px; align-items: center; padding: 11px 12px; border-radius: 10px; color: var(--muted); font-weight: 600; font-size: 14.5px; }
nav a:hover { background: var(--surface); color: var(--text); }
nav a.router-link-exact-active { background: rgba(245,196,81,.12); color: var(--gold); }
.user { margin-top: auto; display: flex; flex-direction: column; gap: 10px; font-size: 13px; padding: 0 8px; }
.body { min-width: 0; }
.topbar { display: none; }
.content { padding: 32px; max-width: 1200px; }
.scrim { display: none; }

@media (max-width: 860px) {
  .admin { grid-template-columns: 1fr; }
  .sidebar { position: fixed; z-index: 60; left: 0; top: 0; width: 260px; background: var(--bg-2); transform: translateX(-100%); transition: transform .2s ease; }
  .sidebar.open { transform: none; }
  .scrim { display: block; position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 55; }
  .topbar { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: rgba(10,14,26,.92); backdrop-filter: blur(10px); z-index: 40; }
  .burger { background: none; border: 1px solid var(--border-strong); border-radius: 8px; padding: 6px 10px; cursor: pointer; font-size: 16px; }
  .top-title { font-weight: 700; }
  .content { padding: 20px 16px; }
}
</style>
