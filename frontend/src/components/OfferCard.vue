<template>
  <article class="card" :class="{ featured: offer.featured }" :style="{ '--accent': offer.accentColor }">
    <div class="glow" />
    <header class="head">
      <CasinoLogo :src="offer.logoUrl" :name="offer.name" :accent="offer.accentColor" />
      <div class="title">
        <div class="name-row">
          <h3>{{ offer.name }}</h3>
          <span v-if="offer.badge" class="badge">{{ offer.badge }}</span>
        </div>
        <StarRating :value="offer.rating" />
      </div>
    </header>

    <div class="bonus">
      <span class="label">Welcome offer</span>
      <p>{{ offer.bonusTitle }}</p>
    </div>

    <p v-if="offer.shortDescription" class="desc">{{ offer.shortDescription }}</p>

    <ul v-if="offer.highlights.length" class="highlights">
      <li v-for="h in offer.highlights.slice(0, 3)" :key="h">{{ h }}</li>
    </ul>

    <div v-if="offer.wagering || offer.minDeposit" class="facts">
      <div v-if="offer.wagering"><span>Wagering</span><strong>{{ offer.wagering }}</strong></div>
      <div v-if="offer.minDeposit"><span>Min. deposit</span><strong>{{ offer.minDeposit }}</strong></div>
    </div>

    <div class="actions">
      <a :href="`/go/${offer.slug}`" class="btn btn-gold" target="_blank" rel="sponsored nofollow noopener">Claim offer</a>
      <RouterLink :to="`/offers/${offer.slug}`" class="btn btn-ghost">Details</RouterLink>
    </div>
    <p class="tc">{{ minAge }}+ · New customers · T&amp;Cs apply</p>
  </article>
</template>

<script setup>
import CasinoLogo from './CasinoLogo.vue';
import StarRating from './StarRating.vue';
import { site } from '../site.js';
import { computed } from 'vue';

defineProps({ offer: { type: Object, required: true } });
const minAge = computed(() => site.min_age);
</script>

<style scoped>
.card {
  position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 16px;
  padding: 22px; border-radius: var(--radius);
  background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
  border: 1px solid var(--border);
  transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
}
.card:hover { transform: translateY(-4px); border-color: color-mix(in srgb, var(--accent) 50%, transparent); box-shadow: var(--shadow); }
.card.featured { border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
.glow {
  position: absolute; inset: -40% -20% auto auto; width: 260px; height: 260px; pointer-events: none;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 30%, transparent), transparent 70%);
  opacity: .55; transition: opacity .25s;
}
.card:hover .glow { opacity: .9; }
.head { display: flex; gap: 14px; align-items: center; position: relative; }
.title { min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
h3 { font-size: 19px; }
.bonus { position: relative; padding: 14px 16px; border-radius: var(--radius-sm); background: rgba(0,0,0,.28); border: 1px dashed color-mix(in srgb, var(--accent) 45%, transparent); }
.label { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--faint); }
.bonus p { margin: 4px 0 0; font-family: var(--display); font-size: 19px; font-weight: 700; line-height: 1.3; color: var(--gold-2); }
.desc { margin: 0; color: var(--muted); font-size: 14.5px; }
.highlights { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 7px; font-size: 14px; }
.highlights li { display: flex; gap: 9px; align-items: flex-start; }
.highlights li::before { content: '✓'; color: var(--green); font-weight: 800; }
.facts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.facts div { padding: 10px 12px; border-radius: 10px; background: var(--surface); border: 1px solid var(--border); display: flex; flex-direction: column; }
.facts span { font-size: 11.5px; color: var(--faint); }
.facts strong { font-size: 14px; }
.actions { margin-top: auto; display: grid; grid-template-columns: 1.4fr 1fr; gap: 10px; position: relative; }
.tc { margin: -6px 0 0; text-align: center; font-size: 11.5px; color: var(--faint); }
</style>
