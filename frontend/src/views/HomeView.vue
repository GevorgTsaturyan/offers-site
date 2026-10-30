<template>
  <div>
    <!-- Offers first: visitors arriving from an email see the cards without scrolling -->
    <section id="offers" class="offers-top">
      <div class="container">
        <div class="intro fade-in">
          <span class="pill"><span class="dot" /> {{ offers.length || '' }} offers · updated {{ updatedLabel }}</span>
          <h1>{{ heroTitleStart }} <span class="gradient-text">{{ heroTitleEnd }}</span></h1>
          <p class="lead">Compare the welcome bonuses below and claim the one that suits you. Tap “Details” for the full terms.</p>
        </div>

        <div v-if="offers.length > 6" class="tools">
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

        <div v-if="badges.length > 1 && offers.length > 3" class="filters">
          <button class="chip" :class="{ active: !badge }" @click="badge = ''">All offers</button>
          <button v-for="b in badges" :key="b" class="chip" :class="{ active: badge === b }" @click="badge = b">{{ b }}</button>
        </div>

        <div v-if="loading" class="grid">
          <div v-for="n in 3" :key="n" class="skeleton" style="height: 420px" />
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
/* Offers-first intro */
.offers-top { padding: 28px 0 56px; }
.intro { text-align: center; max-width: 760px; margin: 0 auto 26px; }
.pill { display: inline-flex; align-items: center; gap: 8px; padding: 5px 13px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); font-size: 12.5px; color: var(--muted); font-weight: 600; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 0 4px rgba(52,211,153,.2); }
h1 { font-size: clamp(26px, 3.6vw, 40px); margin: 14px 0 10px; font-weight: 800; }
.lead { font-size: 16px; color: var(--muted); margin: 0; }

/* Offers */
.tools { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 16px; }
.search { position: relative; }
.search svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--faint); }
.search .input { padding-left: 40px; width: 280px; }
.tools .select { width: auto; }
.filters { display: flex; gap: 8px; justify-content: center; overflow-x: auto; padding-bottom: 6px; margin-bottom: 20px; scrollbar-width: none; }
.filters::-webkit-scrollbar { display: none; }
/* Cards stay a comfortable width and centred, whether there are 2 or 20 */
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 380px)); justify-content: center; gap: 22px; }
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
  .trust { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 900px) {
  .steps { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .offers-top { padding-top: 14px; }
  .intro { margin-bottom: 16px; }
  h1 { font-size: 23px; margin: 10px 0 0; }
  .lead { display: none; }
  .grid { grid-template-columns: 1fr; gap: 16px; }
  .tools, .search, .search .input, .tools .select { width: 100%; }
  .trust { grid-template-columns: 1fr; }
}
</style>
