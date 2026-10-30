<template>
  <div class="container wrap">
    <RouterLink to="/#offers" class="back">← All offers</RouterLink>

    <div v-if="loading" class="skeleton" style="height: 360px; margin-top: 20px" />
    <div v-else-if="notFound" class="glass missing">
      <h2>This offer is no longer available</h2>
      <p class="muted">It may have ended. Take a look at the current offers instead.</p>
      <RouterLink to="/#offers" class="btn btn-gold">See current offers</RouterLink>
    </div>

    <template v-else-if="offer">
      <section class="hero glass fade-in" :style="{ '--accent': offer.accentColor }">
        <div class="glow" />
        <div class="hero-main">
          <CasinoLogo :src="offer.logoUrl" :name="offer.name" :accent="offer.accentColor" size="lg" />
          <div class="hero-text">
            <div class="name-row">
              <h1>{{ offer.name }}</h1>
              <span v-if="offer.badge" class="badge">{{ offer.badge }}</span>
            </div>
            <StarRating :value="offer.rating" />
            <p class="bonus">{{ offer.bonusTitle }}</p>
            <p v-if="offer.shortDescription" class="muted short">{{ offer.shortDescription }}</p>
          </div>
        </div>
        <aside class="claim">
          <a :href="`/go/${offer.slug}`" class="btn btn-gold btn-block big" target="_blank" rel="sponsored nofollow noopener">Claim this offer</a>
          <p class="claim-note">You’ll go to {{ offer.name }}’s website. {{ site.min_age }}+ · New customers only · T&amp;Cs apply.</p>
        </aside>
      </section>

      <div class="layout">
        <div class="main">
          <section v-if="offer.description" class="block glass">
            <h2>About this offer</h2>
            <p v-for="(p, i) in paragraphs(offer.description)" :key="i">{{ p }}</p>
          </section>

          <section v-if="offer.highlights.length" class="block glass">
            <h2>Why we like it</h2>
            <ul class="highlights">
              <li v-for="h in offer.highlights" :key="h">{{ h }}</li>
            </ul>
          </section>

          <section v-if="offer.terms" class="block glass">
            <h2>Key terms &amp; conditions</h2>
            <p v-for="(p, i) in paragraphs(offer.terms)" :key="i" class="terms">{{ p }}</p>
            <p class="small muted">Always read the full terms on the casino’s website before you deposit.</p>
          </section>
        </div>

        <aside class="side">
          <div class="facts glass">
            <h3>At a glance</h3>
            <dl>
              <div v-for="f in facts" :key="f.label"><dt>{{ f.label }}</dt><dd>{{ f.value }}</dd></div>
            </dl>
            <a :href="`/go/${offer.slug}`" class="btn btn-gold btn-block" target="_blank" rel="sponsored nofollow noopener">Claim offer</a>
          </div>
          <div class="safe glass">
            <strong>🛟 Play it safe</strong>
            <p class="muted">Set a budget before you play and never chase losses.</p>
            <a :href="site.responsible_gambling_url" target="_blank" rel="noopener">Get free support →</a>
          </div>
        </aside>
      </div>

      <section class="section"><SubscribeBox /></section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { request } from '../api.js';
import { site, setTitle } from '../site.js';
import CasinoLogo from '../components/CasinoLogo.vue';
import StarRating from '../components/StarRating.vue';
import SubscribeBox from '../components/SubscribeBox.vue';

const route = useRoute();
const offer = ref(null); const loading = ref(true); const notFound = ref(false);

onMounted(async () => {
  try {
    offer.value = await request(`/api/offers/${encodeURIComponent(route.params.slug)}`);
    setTitle(`${offer.value.name}: ${offer.value.bonusTitle}`);
  } catch { notFound.value = true; setTitle('Offer not found'); }
  finally { loading.value = false; }
});

const paragraphs = (t) => String(t).split(/\n\s*\n|\n/).map(s => s.trim()).filter(Boolean);
const facts = computed(() => [
  ['Welcome bonus', offer.value.bonusTitle],
  ['Wagering', offer.value.wagering],
  ['Minimum deposit', offer.value.minDeposit],
  ['Payment methods', offer.value.paymentMethods],
  ['Available in', offer.value.countries],
  ['Our rating', `${Number(offer.value.rating).toFixed(1)} / 5`],
].filter(([, v]) => v).map(([label, value]) => ({ label, value })));
</script>

<style scoped>
.wrap { padding-top: 28px; }
.back { display: inline-block; color: var(--muted); font-weight: 600; font-size: 14px; }
.back:hover { color: var(--gold); }
.missing { text-align: center; padding: 56px 24px; margin-top: 20px; }
.missing h2 { margin-bottom: 8px; }
.missing p { margin: 0 0 20px; }

.hero { position: relative; overflow: hidden; margin-top: 18px; padding: 32px; display: grid; grid-template-columns: 1fr 300px; gap: 32px; align-items: center; border-color: color-mix(in srgb, var(--accent) 35%, transparent); }
.glow { position: absolute; top: -40%; right: -10%; width: 480px; height: 480px; background: radial-gradient(circle, color-mix(in srgb, var(--accent) 28%, transparent), transparent 70%); pointer-events: none; }
.hero-main { display: flex; gap: 24px; align-items: center; position: relative; }
.hero-text { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.name-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
h1 { font-size: clamp(26px, 3.6vw, 38px); }
.bonus { margin: 6px 0 0; font-family: var(--display); font-weight: 800; font-size: clamp(20px, 2.6vw, 28px); line-height: 1.25; color: var(--gold-2); }
.short { margin: 0; }
.claim { position: relative; }
.big { padding: 17px 24px; font-size: 17px; }
.claim-note { margin: 10px 0 0; font-size: 12px; color: var(--faint); text-align: center; }

.layout { display: grid; grid-template-columns: 1fr 340px; gap: 24px; margin-top: 24px; align-items: start; }
.main { display: flex; flex-direction: column; gap: 20px; }
.block { padding: 26px; }
.block h2 { font-size: 21px; margin-bottom: 12px; }
.block p { margin: 0 0 12px; color: #cfd5e3; }
.terms { font-size: 14.5px; }
.small { font-size: 13px; margin-top: 8px !important; }
.highlights { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.highlights li { display: flex; gap: 10px; padding: 12px 14px; border-radius: 12px; background: var(--surface); border: 1px solid var(--border); font-size: 14.5px; }
.highlights li::before { content: '✓'; color: var(--green); font-weight: 800; }

.side { display: flex; flex-direction: column; gap: 20px; position: sticky; top: 92px; }
.facts { padding: 24px; }
.facts h3 { font-size: 17px; margin-bottom: 12px; }
dl { margin: 0 0 18px; }
dl div { display: flex; justify-content: space-between; gap: 14px; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
dt { color: var(--faint); }
dd { margin: 0; text-align: right; font-weight: 600; }
.safe { padding: 20px 22px; font-size: 14px; }
.safe p { margin: 6px 0 8px; }
.safe a { color: var(--gold); font-weight: 600; }

@media (max-width: 960px) {
  .hero { grid-template-columns: 1fr; }
  .layout { grid-template-columns: 1fr; }
  .side { position: static; }
}
@media (max-width: 600px) {
  .hero { padding: 22px; }
  .hero-main { flex-direction: column; align-items: flex-start; gap: 16px; }
  .highlights { grid-template-columns: 1fr; }
  .block { padding: 20px; }
}
</style>
