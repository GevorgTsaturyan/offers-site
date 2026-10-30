<template>
  <div>
    <div class="head">
      <div>
        <h1>Offers</h1>
        <p class="muted">Add, edit, hide and reorder the offers shown on your site.</p>
      </div>
      <RouterLink to="/admin/offers/new" class="btn btn-gold">+ Add offer</RouterLink>
    </div>

    <div class="stats">
      <div class="stat glass"><span>Total offers</span><strong>{{ stats.total || 0 }}</strong></div>
      <div class="stat glass"><span>Live on site</span><strong>{{ stats.active || 0 }}</strong></div>
      <div class="stat glass"><span>Featured</span><strong>{{ stats.featured || 0 }}</strong></div>
      <div class="stat glass"><span>Total claims</span><strong>{{ stats.clicks || 0 }}</strong></div>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div v-if="loading" class="skeleton" style="height: 240px" />
    <div v-else-if="!offers.length" class="empty glass">
      <div class="empty-icon">🎁</div>
      <h3>No offers yet</h3>
      <p class="muted">Add your first casino offer — it will appear on the homepage right away.</p>
      <RouterLink to="/admin/offers/new" class="btn btn-gold">Add your first offer</RouterLink>
    </div>

    <div v-else class="list">
      <div v-for="(o, i) in offers" :key="o.id" class="row glass" :class="{ hidden: o.status === 'hidden' }">
        <div class="order">
          <button class="icon-btn" :disabled="i === 0" title="Move up" @click="move(i, -1)">▲</button>
          <button class="icon-btn" :disabled="i === offers.length - 1" title="Move down" @click="move(i, 1)">▼</button>
        </div>
        <CasinoLogo :src="o.logoUrl" :name="o.name" :accent="o.accentColor" size="sm" />
        <div class="info">
          <div class="name">
            {{ o.name }}
            <span v-if="o.badge" class="badge">{{ o.badge }}</span>
            <span v-if="o.status === 'hidden'" class="tag">Hidden</span>
          </div>
          <div class="bonus">{{ o.bonusTitle }}</div>
        </div>
        <div class="metric"><strong>{{ o.clicks }}</strong><span>claims</span></div>
        <div class="toggles">
          <button class="chip" :class="{ active: o.featured }" @click="toggle(o, 'featured', !o.featured)">★ Featured</button>
          <button class="chip" :class="{ active: o.status === 'active' }" @click="toggle(o, 'status', o.status === 'active' ? 'hidden' : 'active')">
            {{ o.status === 'active' ? '● Live' : '○ Hidden' }}
          </button>
        </div>
        <div class="actions">
          <a :href="`/offers/${o.slug}`" target="_blank" class="btn btn-ghost btn-sm" title="Preview">View</a>
          <RouterLink :to="`/admin/offers/${o.id}`" class="btn btn-ghost btn-sm">Edit</RouterLink>
          <button class="btn btn-danger btn-sm" @click="remove(o)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { request } from '../../api.js';
import CasinoLogo from '../../components/CasinoLogo.vue';

const offers = ref([]); const stats = ref({}); const loading = ref(true); const error = ref('');
document.title = 'Offers · Admin';

async function load() {
  try {
    [offers.value, stats.value] = await Promise.all([
      request('/api/admin/offers', { admin: true }),
      request('/api/admin/stats', { admin: true }),
    ]);
  } catch (e) { error.value = e.message; }
  finally { loading.value = false; }
}
onMounted(load);

async function toggle(o, field, value) {
  try {
    Object.assign(o, await request(`/api/admin/offers/${o.id}`, { method: 'PATCH', body: { [field]: value }, admin: true }));
    stats.value = await request('/api/admin/stats', { admin: true });
  } catch (e) { error.value = e.message; }
}

async function move(i, dir) {
  const list = [...offers.value];
  [list[i], list[i + dir]] = [list[i + dir], list[i]];
  offers.value = list;
  try { await request('/api/admin/reorder', { method: 'PUT', body: { ids: list.map(o => o.id) }, admin: true }); }
  catch (e) { error.value = e.message; load(); }
}

async function remove(o) {
  if (!confirm(`Delete "${o.name}"? This cannot be undone. (Tip: use "Hidden" to take it off the site temporarily.)`)) return;
  try { await request(`/api/admin/offers/${o.id}`, { method: 'DELETE', admin: true }); await load(); }
  catch (e) { error.value = e.message; }
}
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
h1 { font-size: 28px; }
.head p { margin: 4px 0 0; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
.stat { padding: 16px 18px; display: flex; flex-direction: column; }
.stat span { font-size: 12.5px; color: var(--faint); }
.stat strong { font-family: var(--display); font-size: 26px; }
.list { display: flex; flex-direction: column; gap: 10px; }
.row { display: grid; grid-template-columns: auto auto 1fr auto auto auto; gap: 16px; align-items: center; padding: 14px 16px; border-radius: 14px; }
.row.hidden { opacity: .6; }
.order { display: flex; flex-direction: column; gap: 2px; }
.icon-btn { background: var(--surface); border: 1px solid var(--border); color: var(--muted); border-radius: 6px; font-size: 9px; width: 26px; height: 20px; cursor: pointer; }
.icon-btn:hover:not([disabled]) { color: var(--gold); border-color: var(--gold); }
.icon-btn[disabled] { opacity: .3; cursor: default; }
.info { min-width: 0; }
.name { font-weight: 700; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tag { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: var(--surface-2); color: var(--muted); }
.bonus { font-size: 13.5px; color: var(--gold-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.metric { text-align: center; display: flex; flex-direction: column; }
.metric strong { font-size: 18px; }
.metric span { font-size: 11.5px; color: var(--faint); }
.toggles, .actions { display: flex; gap: 6px; }
.empty { text-align: center; padding: 48px 20px; }
.empty-icon { font-size: 40px; }
.empty h3 { margin: 8px 0 6px; }
.empty p { margin: 0 0 18px; }

@media (max-width: 1100px) {
  .row { grid-template-columns: auto auto 1fr auto; }
  .toggles, .actions { grid-column: 3 / -1; }
}
@media (max-width: 700px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
  .row { grid-template-columns: auto 1fr auto; gap: 12px; }
  .order { display: none; }
  .toggles, .actions { grid-column: 1 / -1; flex-wrap: wrap; }
  .actions .btn { flex: 1; }
}
</style>
