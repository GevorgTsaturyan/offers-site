<template>
  <div>
    <div class="head">
      <div>
        <RouterLink to="/admin/offers" class="back">← Offers</RouterLink>
        <h1>{{ isNew ? 'Add offer' : `Edit ${form.name || 'offer'}` }}</h1>
      </div>
      <div class="head-actions">
        <a v-if="!isNew && form.status === 'active'" :href="`/offers/${form.slug}`" target="_blank" class="btn btn-ghost">View on site ↗</a>
        <button class="btn btn-gold" :disabled="busy" @click="save">{{ busy ? 'Saving…' : 'Save offer' }}</button>
      </div>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="saved" class="alert alert-ok">Saved ✓</div>

    <div v-if="loading" class="skeleton" style="height: 500px" />
    <div v-else class="layout">
      <form class="form" @submit.prevent="save">
        <section class="block glass">
          <h2>Casino &amp; bonus</h2>
          <div class="grid2">
            <div class="field"><label>Casino name *</label><input v-model="form.name" class="input" maxlength="80" placeholder="e.g. Lucky Star Casino" @input="autoSlug" /></div>
            <div class="field">
              <label>Page address</label>
              <input v-model="form.slug" class="input" maxlength="60" placeholder="lucky-star-casino" @input="slugTouched = true" />
              <span class="hint">yoursite.com/offers/{{ form.slug || '…' }}</span>
            </div>
          </div>
          <div class="field"><label>Bonus title *</label><input v-model="form.bonusTitle" class="input" maxlength="120" placeholder="100% up to €300 + 50 Free Spins" /></div>
          <div class="field">
            <label>Affiliate link *</label>
            <input v-model="form.affiliateUrl" class="input" maxlength="2000" placeholder="https://…" />
            <span class="hint">Where “Claim offer” sends visitors. Never shown on the page itself.</span>
          </div>
          <div class="field"><label>Short description</label><input v-model="form.shortDescription" class="input" maxlength="300" placeholder="One sentence shown on the offer card" /></div>
        </section>

        <section class="block glass">
          <h2>Logo &amp; look</h2>
          <div class="logo-row">
            <CasinoLogo :src="form.logoUrl" :name="form.name" :accent="form.accentColor" size="lg" />
            <div class="logo-actions">
              <label class="btn btn-ghost btn-sm" :class="{ disabled: isNew }">
                {{ form.logoUrl ? 'Replace logo' : 'Upload logo' }}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden :disabled="isNew" @change="uploadLogo" />
              </label>
              <span class="hint">{{ isNew ? 'Save the offer first, then upload its logo.' : 'PNG, JPG, WEBP or GIF, max 1 MB. Square works best.' }}</span>
            </div>
          </div>
          <div class="grid3">
            <div class="field">
              <label>Accent colour</label>
              <div class="color"><input v-model="form.accentColor" type="color" /><input v-model="form.accentColor" class="input" maxlength="7" /></div>
            </div>
            <div class="field">
              <label>Badge</label>
              <input v-model="form.badge" class="input" maxlength="24" list="badge-ideas" placeholder="e.g. Exclusive" />
              <datalist id="badge-ideas"><option>Exclusive</option><option>New</option><option>Top pick</option><option>Free spins</option><option>No wagering</option></datalist>
            </div>
            <div class="field"><label>Rating (0–5)</label><input v-model.number="form.rating" class="input" type="number" min="0" max="5" step="0.1" /></div>
          </div>
          <div class="switches">
            <label class="checkbox"><input v-model="form.featured" type="checkbox" /> <span><strong>Featured</strong> — shown first on the homepage</span></label>
            <label class="checkbox"><input v-model="visible" type="checkbox" /> <span><strong>Live on site</strong> — untick to hide without deleting</span></label>
          </div>
        </section>

        <section class="block glass">
          <h2>Key facts</h2>
          <div class="grid2">
            <div class="field"><label>Wagering</label><input v-model="form.wagering" class="input" maxlength="60" placeholder="35x bonus" /></div>
            <div class="field"><label>Minimum deposit</label><input v-model="form.minDeposit" class="input" maxlength="60" placeholder="€20" /></div>
            <div class="field"><label>Payment methods</label><input v-model="form.paymentMethods" class="input" maxlength="300" placeholder="Visa, Mastercard, Skrill, Crypto" /></div>
            <div class="field"><label>Available in</label><input v-model="form.countries" class="input" maxlength="300" placeholder="e.g. Canada, New Zealand" /></div>
          </div>
          <div class="field">
            <label>Highlights</label>
            <textarea v-model="highlightsText" class="textarea" rows="4" placeholder="One per line, e.g.&#10;Withdrawals within 24 hours&#10;3,000+ games" />
            <span class="hint">One per line, up to 8. The first 3 appear on the card.</span>
          </div>
        </section>

        <section class="block glass">
          <h2>Details page</h2>
          <div class="field"><label>About this offer</label><textarea v-model="form.description" class="textarea" rows="6" placeholder="Explain the offer in plain words. Empty lines start a new paragraph." /></div>
          <div class="field"><label>Key terms &amp; conditions</label><textarea v-model="form.terms" class="textarea" rows="6" placeholder="Wagering, max bet, time limits, excluded payment methods…" /></div>
        </section>

        <div class="bottom-actions">
          <button v-if="!isNew" type="button" class="btn btn-danger" @click="remove">Delete offer</button>
          <button type="submit" class="btn btn-gold" :disabled="busy">{{ busy ? 'Saving…' : 'Save offer' }}</button>
        </div>
      </form>

      <aside class="preview">
        <div class="preview-label">Live preview</div>
        <OfferCard :offer="previewOffer" />
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { request } from '../../api.js';
import { slugify } from '../../slug.js';
import CasinoLogo from '../../components/CasinoLogo.vue';
import OfferCard from '../../components/OfferCard.vue';

const route = useRoute(); const router = useRouter();
const isNew = computed(() => !route.params.id);

const form = reactive({
  name: '', slug: '', bonusTitle: '', affiliateUrl: '', shortDescription: '', description: '',
  terms: '', wagering: '', minDeposit: '', paymentMethods: '', countries: '', rating: 4.5,
  badge: '', accentColor: '#f5c451', featured: false, status: 'active', logoUrl: null,
});
const highlightsText = ref('');
const slugTouched = ref(false);
const loading = ref(!isNew.value); const busy = ref(false); const error = ref(''); const saved = ref(false);

const visible = computed({
  get: () => form.status === 'active',
  set: (v) => { form.status = v ? 'active' : 'hidden'; },
});

onMounted(async () => {
  document.title = `${isNew.value ? 'Add offer' : 'Edit offer'} · Admin`;
  if (isNew.value) return;
  try {
    const o = await request(`/api/admin/offers/${route.params.id}`, { admin: true });
    Object.assign(form, o);
    highlightsText.value = o.highlights.join('\n');
    slugTouched.value = true;
  } catch (e) { error.value = e.message; }
  finally { loading.value = false; }
});

function autoSlug() { if (!slugTouched.value) form.slug = slugify(form.name); }

const payload = () => ({ ...form, highlights: highlightsText.value });

const previewOffer = computed(() => ({
  id: 0, slug: form.slug || 'preview', name: form.name || 'Casino name', bonusTitle: form.bonusTitle || 'Your bonus title',
  shortDescription: form.shortDescription, highlights: highlightsText.value.split('\n').map(s => s.trim()).filter(Boolean),
  wagering: form.wagering, minDeposit: form.minDeposit, rating: Number(form.rating) || 0, badge: form.badge,
  accentColor: /^#[0-9a-fA-F]{6}$/.test(form.accentColor) ? form.accentColor : '#f5c451', logoUrl: form.logoUrl, featured: form.featured,
}));

async function save() {
  error.value = ''; saved.value = false; busy.value = true;
  try {
    if (isNew.value) {
      const o = await request('/api/admin/offers', { method: 'POST', body: payload(), admin: true });
      router.replace(`/admin/offers/${o.id}`);
    } else {
      Object.assign(form, await request(`/api/admin/offers/${route.params.id}`, { method: 'PUT', body: payload(), admin: true }));
      saved.value = true; setTimeout(() => { saved.value = false; }, 2500);
    }
  } catch (e) { error.value = e.message; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  finally { busy.value = false; }
}

async function uploadLogo(ev) {
  const file = ev.target.files?.[0];
  ev.target.value = '';
  if (!file) return;
  error.value = '';
  const fd = new FormData(); fd.append('logo', file);
  try {
    const o = await request(`/api/admin/offers/${route.params.id}/logo`, { method: 'POST', form: fd, admin: true });
    form.logoUrl = o.logoUrl;
  } catch (e) { error.value = e.message; }
}

async function remove() {
  if (!confirm(`Delete "${form.name}"? This cannot be undone.`)) return;
  try { await request(`/api/admin/offers/${route.params.id}`, { method: 'DELETE', admin: true }); router.push('/admin/offers'); }
  catch (e) { error.value = e.message; }
}
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.back { font-size: 13px; color: var(--muted); }
h1 { font-size: 26px; margin-top: 4px; }
.head-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.alert { margin-bottom: 16px; }
.layout { display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; }
.form { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.block { padding: 22px; display: flex; flex-direction: column; gap: 16px; }
.block h2 { font-size: 17px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.logo-row { display: flex; gap: 20px; align-items: center; }
.logo-actions { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.logo-actions .disabled { opacity: .5; cursor: not-allowed; }
.color { display: flex; gap: 8px; }
.color input[type=color] { width: 48px; height: 46px; border: 1px solid var(--border-strong); border-radius: 10px; background: none; padding: 3px; cursor: pointer; flex-shrink: 0; }
.switches { display: flex; flex-direction: column; gap: 10px; }
.switches strong { color: var(--text); }
.bottom-actions { display: flex; justify-content: space-between; gap: 10px; }
.bottom-actions .btn-gold { margin-left: auto; }
.preview { position: sticky; top: 24px; }
.preview-label { font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--faint); margin-bottom: 10px; }

@media (max-width: 1100px) {
  .layout { grid-template-columns: 1fr; }
  .preview { position: static; max-width: 420px; order: -1; }
}
@media (max-width: 640px) {
  .grid2, .grid3 { grid-template-columns: 1fr; }
  .logo-row { flex-direction: column; align-items: flex-start; }
  .bottom-actions { flex-direction: column-reverse; }
  .bottom-actions .btn { width: 100%; margin: 0; }
}
</style>
