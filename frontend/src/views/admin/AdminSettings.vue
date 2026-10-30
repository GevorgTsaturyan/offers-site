<template>
  <div>
    <div class="head">
      <div>
        <h1>Site settings</h1>
        <p class="muted">Your site name and the text visitors see on the homepage.</p>
      </div>
      <button class="btn btn-gold" :disabled="busy" @click="save">{{ busy ? 'Saving…' : 'Save settings' }}</button>
    </div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="saved" class="alert alert-ok">Saved ✓ — changes are live on the site.</div>

    <form class="block glass" @submit.prevent="save">
      <div class="grid2">
        <div class="field"><label>Site name</label><input v-model="form.site_name" class="input" maxlength="60" /></div>
        <div class="field"><label>Tagline</label><input v-model="form.tagline" class="input" maxlength="120" /></div>
      </div>
      <div class="field"><label>Homepage headline</label><input v-model="form.hero_title" class="input" maxlength="140" /><span class="hint">The last 3 words are shown in gold.</span></div>
      <div class="field"><label>Homepage intro text</label><textarea v-model="form.hero_subtitle" class="textarea" rows="3" maxlength="400" /></div>
      <div class="grid3">
        <div class="field"><label>Contact email</label><input v-model="form.contact_email" class="input" type="email" maxlength="120" /></div>
        <div class="field"><label>Minimum age</label><input v-model="form.min_age" class="input" maxlength="3" /></div>
        <div class="field"><label>Gambling help link</label><input v-model="form.responsible_gambling_url" class="input" maxlength="300" /></div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { request } from '../../api.js';
import { site } from '../../site.js';

const form = reactive({});
const busy = ref(false); const error = ref(''); const saved = ref(false);
document.title = 'Settings · Admin';

onMounted(async () => {
  try { Object.assign(form, await request('/api/admin/settings', { admin: true })); }
  catch (e) { error.value = e.message; }
});

async function save() {
  error.value = ''; saved.value = false; busy.value = true;
  try {
    const s = await request('/api/admin/settings', { method: 'PUT', body: { ...form }, admin: true });
    Object.assign(form, s); Object.assign(site, s);
    saved.value = true; setTimeout(() => { saved.value = false; }, 3000);
  } catch (e) { error.value = e.message; }
  finally { busy.value = false; }
}
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
h1 { font-size: 28px; }
.head p { margin: 4px 0 0; }
.alert { margin-bottom: 16px; }
.block { padding: 24px; display: flex; flex-direction: column; gap: 16px; max-width: 900px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.grid3 { display: grid; grid-template-columns: 1.4fr .6fr 1.4fr; gap: 14px; }
@media (max-width: 700px) { .grid2, .grid3 { grid-template-columns: 1fr; } }
</style>
