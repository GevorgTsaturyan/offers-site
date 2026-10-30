<template>
  <div>
    <!-- Hero -->
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy fade-in">
          <span class="pill"><span class="dot" /> Updated {{ updatedLabel }}</span>
          <h1>{{ heroTitleStart }} <span class="gradient-text">{{ heroTitleEnd }}</span></h1>
          <p class="lead">{{ site.hero_subtitle }}</p>
          <div class="cta">
            <a href="#offers" class="btn btn-gold">Browse offers</a>
            <a href="#subscribe" class="btn btn-ghost">Get them by email</a>
          </div>
          <div class="stats">
            <div><strong>{{ offers.length || '—' }}</strong><span>Active offers</span></div>
            <div><strong>100%</strong><span>Terms explained</span></div>
            <div><strong>{{ site.min_age }}+</strong><span>Play responsibly</span></div>
          </div>
        </div>

        <div class="hero-visual fade-in" aria-hidden="true">
          <div class="orb" />
          <div v-for="(o, i) in heroOffers" :key="o.id" class="float-card glass" :class="`fc${i}`" :style="{ '--accent': o.accentColor }">
            <CasinoLogo :src="o.logoUrl" :name="o.name" :accent="o.accentColor" size="sm" />
            <div>
              <div class="fc-name">{{ o.name }}</div>
              <div class="fc-bonus">{{ o.bonusTitle }}</div>
            </div>
          </div>
          <div v-if="!heroOffers.length" class="float-card glass fc0">
            <div class="fc-name">Fresh offers</div><div class="fc-bonus">Added every week</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Offers -->
    <section id="offers" class="section">
      <div class="container">
        <div class="offers-head">
          <div>
            <h2 class="section-title">Today’s <span class="gradient-text">top offers</span></h2>
            <p class="section-sub">Compare welcome bonuses side by side. Open “Details” for full terms before you claim.</p>
          </div>
          <div class="tools">
            <div class="search">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input v-model="q" class="input" type="search" placeholder="Search casinos or bonuses" />
            </div>
            <select v-model="sort" class="select">
              <option value="recommended">Recommended</option>
              <option value="rating">Highest rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        <div v-if="badges.length" class="filters">
          <button class="chip" :class="{ active: !badge }" @click="badge = ''">All offers</button>
          <button v-for="b in badges" :key="b" class="chip" :class="{ active: badge === b }" @click="badge = b">{{ b }}</button>
        </div>

        <div v-if="loading" class="grid">
          <div v-for="n in 6" :key="n" class="skeleton" style="height: 420px" />
        </div>
        <div v-else-if="error" class="alert alert-error">{{ error }}</div>
        <div v-else-if="!filtered.length" class="empty glass">
          <div class="empty-icon">🔍</div>
          <h3>No offers match your search</h3>
          <p class="muted">Try another word or clear the filters.</p>
          <button class="btn btn-ghost btn-sm" @click="q = ''; badge = ''">Clear filters</button>
        </div>
        <TransitionGroup v-else name="list" tag="div" class="grid">
          <OfferCard v-for="o in filtered" :key="o.id" :offer="o" />
        </TransitionGroup>
      </div>
    </section>

    <!-- How it works -->
    <section id="how" class="section how">
      <div class="container">
        <h2 class="section-title center">How it <span class="gradient-text">works</span></h2>
        <div class="steps">
          <div v-for="(s, i) in steps" :key="s.title" class="step glass">
            <span class="num">{{ i + 1 }}</span>
            <div class="step-icon">{{ s.icon }}</div>
            <h3>{{ s.title }}</h3>
            <p class="muted">{{ s.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Subscribe -->
    <section class="section">
      <div class="container"><SubscribeBox /></div>
    </section>

    <!-- Trust -->
    <section class="section trust-wrap">
      <div class="container trust">
        <div v-for="t in trust" :key="t.title" class="trust-item">
          <span class="trust-icon">{{ t.icon }}</span>
          <div><strong>{{ t.title }}</strong><p class="muted">{{ t.text }}</p></div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { request } from '../api.js';
import { site, setTitle } from '../site.js';
import OfferCard from '../components/OfferCard.vue';
import CasinoLogo from '../components/CasinoLogo.vue';
import SubscribeBox from '../components/SubscribeBox.vue';

const offers = ref([]); const loading = ref(true); const error = ref('');
const q = ref(''); const sort = ref('recommended'); const badge = ref('');

onMounted(async () => {
  setTitle('');
  try { offers.value = await request('/api/offers'); }
  catch (e) { error.value = 'Could not load offers. Please refresh the page.'; }
  finally { loading.value = false; }
});
watch(() => site.loaded, () => setTitle(''));

// Split the hero title so the last few words get the gold gradient.
const heroWords = computed(() => (site.hero_title || 'The best casino offers in one place').split(' '));
const heroTitleStart = computed(() => heroWords.value.slice(0, Math.max(1, heroWords.value.length - 3)).join(' '));
const heroTitleEnd = computed(() => heroWords.value.slice(Math.max(1, heroWords.value.length - 3)).join(' '));

const heroOffers = computed(() => offers.value.slice(0, 3));
const updatedLabel = computed(() => new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }));
const badges = computed(() => [...new Set(offers.value.map(o => o.badge).filter(Boolean))]);

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase();
  let list = offers.value.filter(o =>
    (!badge.value || o.badge === badge.value) &&
    (!term || [o.name, o.bonusTitle, o.shortDescription, ...o.highlights].join(' ').toLowerCase().includes(term)));
  if (sort.value === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
  if (sort.value === 'newest') list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return list;
});

const steps = [
  { icon: '🧭', title: 'Compare', text: 'See the bonus, wagering and minimum deposit for each casino at a glance.' },
  { icon: '📄', title: 'Read the terms', text: 'Open the details page for the full conditions in plain language.' },
  { icon: '🎁', title: 'Claim if it fits', text: 'Only claim offers that suit you. You go straight to the casino’s own page.' },
];
const trust = [
  { icon: '🔒', title: 'Licensed operators', text: 'We only list casinos we have checked.' },
  { icon: '🧾', title: 'Clear terms', text: 'Wagering and limits are shown up front.' },
  { icon: '✉️', title: 'No spam', text: 'Unsubscribe from emails with one click.' },
  { icon: '🛟', title: 'Play safe', text: 'Help and limits are always one click away.' },
];
</script>

<style scoped>
/* Hero */
.hero { padding: 64px 0 40px; }
.hero-grid { display: grid; grid-template-columns: 1.1fr .9fr; gap: 48px; align-items: center; }
.pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); font-size: 13px; color: var(--muted); font-weight: 600; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 0 4px rgba(52,211,153,.2); }
h1 { font-size: clamp(34px, 5.4vw, 60px); margin: 20px 0 18px; font-weight: 800; }
.lead { font-size: clamp(16px, 1.6vw, 19px); color: var(--muted); max-width: 560px; margin: 0 0 30px; }
.cta { display: flex; gap: 12px; flex-wrap: wrap; }
.stats { display: flex; gap: 36px; margin-top: 40px; flex-wrap: wrap; }
.stats div { display: flex; flex-direction: column; }
.stats strong { font-family: var(--display); font-size: 28px; }
.stats span { font-size: 13px; color: var(--faint); }

.hero-visual { position: relative; height: 420px; }
.orb { position: absolute; inset: 40px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, rgba(245,196,81,.35), rgba(139,92,246,.25) 45%, transparent 70%); filter: blur(10px); animation: float 8s ease-in-out infinite; }
.float-card { position: absolute; display: flex; align-items: center; gap: 12px; padding: 14px 16px; width: min(320px, 90%); box-shadow: var(--shadow); border-color: color-mix(in srgb, var(--accent, #f5c451) 35%, transparent); }
.fc0 { top: 30px; left: 0; animation: float 6s ease-in-out infinite; }
.fc1 { top: 160px; right: 0; animation: float 7s ease-in-out infinite .6s; }
.fc2 { bottom: 30px; left: 30px; animation: float 6.5s ease-in-out infinite 1.2s; }
.fc-name { font-weight: 700; font-size: 15px; }
.fc-bonus { font-size: 13px; color: var(--gold-2); line-height: 1.35; }
@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }

/* Offers */
.offers-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; margin-bottom: 22px; }
.tools { display: flex; gap: 10px; flex-wrap: wrap; }
.search { position: relative; }
.search svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--faint); }
.search .input { padding-left: 40px; width: 280px; }
.tools .select { width: auto; }
.filters { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 22px; scrollbar-width: none; }
.filters::-webkit-scrollbar { display: none; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
.list-enter-active, .list-leave-active { transition: all .25s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: scale(.97); }
.empty { text-align: center; padding: 48px 20px; }
.empty-icon { font-size: 40px; }
.empty h3 { margin: 10px 0 6px; }
.empty p { margin: 0 0 16px; }

/* How */
.center { text-align: center; }
.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 36px; }
.step { position: relative; padding: 28px; }
.num { position: absolute; top: 18px; right: 22px; font-family: var(--display); font-size: 42px; font-weight: 800; color: rgba(255,255,255,.06); }
.step-icon { font-size: 30px; width: 58px; height: 58px; display: grid; place-items: center; border-radius: 16px; background: rgba(245,196,81,.12); border: 1px solid rgba(245,196,81,.25); margin-bottom: 16px; }
.step h3 { font-size: 20px; margin-bottom: 8px; }
.step p { margin: 0; font-size: 15px; }

/* Trust */
.trust-wrap { padding-top: 0; }
.trust { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.trust-item { display: flex; gap: 12px; align-items: flex-start; }
.trust-icon { font-size: 22px; width: 44px; height: 44px; flex-shrink: 0; display: grid; place-items: center; border-radius: 12px; background: var(--surface); border: 1px solid var(--border); }
.trust-item p { margin: 2px 0 0; font-size: 13.5px; }

@media (max-width: 1024px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
  .trust { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 900px) {
  .hero-grid { grid-template-columns: 1fr; }
  .hero-visual { height: 300px; }
  .steps { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .hero { padding-top: 36px; }
  .grid { grid-template-columns: 1fr; }
  .tools, .search, .search .input, .tools .select { width: 100%; }
  .hero-visual { display: none; }
  .stats { gap: 24px; }
  .trust { grid-template-columns: 1fr; }
  .cta .btn { flex: 1; }
}
</style>
