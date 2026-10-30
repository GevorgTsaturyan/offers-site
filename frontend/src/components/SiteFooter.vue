<template>
  <footer class="footer">
    <div class="container">
      <div class="top">
        <div class="about">
          <div class="brand"><span class="mark">★</span>{{ site.site_name }}</div>
          <p class="muted">{{ site.tagline }}</p>
          <div class="age">
            <span class="age-pill">{{ site.min_age }}+</span>
            <span>Gambling can be addictive. Play responsibly and only with money you can afford to lose.</span>
          </div>
        </div>
        <div class="cols">
          <div>
            <h4>Explore</h4>
            <RouterLink to="/#offers">All offers</RouterLink>
            <RouterLink to="/#how">How it works</RouterLink>
            <RouterLink to="/#subscribe">Newsletter</RouterLink>
          </div>
          <div>
            <h4>Information</h4>
            <RouterLink to="/info/about">About us</RouterLink>
            <RouterLink to="/info/affiliate-disclosure">Affiliate disclosure</RouterLink>
            <RouterLink to="/info/responsible-gambling">Responsible gambling</RouterLink>
          </div>
          <div>
            <h4>Legal</h4>
            <RouterLink to="/info/privacy">Privacy policy</RouterLink>
            <RouterLink to="/info/terms">Terms of use</RouterLink>
            <a v-if="site.contact_email" :href="`mailto:${site.contact_email}`">Contact</a>
          </div>
        </div>
      </div>
      <div class="bottom">
        <p>
          We may earn a commission when you claim an offer through our links. This never changes the offer you get.
          Offers are subject to each casino's own terms. Check that online gambling is legal where you live.
        </p>
        <div class="help">
          <a :href="site.responsible_gambling_url" target="_blank" rel="noopener">Need help? Visit {{ helpHost }}</a>
          <span>© {{ year }} {{ site.site_name }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue';
import { site } from '../site.js';

const year = new Date().getFullYear();
const helpHost = computed(() => {
  try { return new URL(site.responsible_gambling_url).hostname.replace(/^www\./, ''); } catch { return 'a support service'; }
});
</script>

<style scoped>
.footer { margin-top: 40px; border-top: 1px solid var(--border); background: rgba(0,0,0,.25); padding: 56px 0 28px; }
.top { display: grid; grid-template-columns: 1.2fr 2fr; gap: 48px; }
.brand { display: flex; align-items: center; gap: 10px; font-family: var(--display); font-weight: 800; font-size: 19px; margin-bottom: 10px; }
.mark { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; background: var(--gold); color: #1a1405; font-size: 15px; }
.about p { margin: 0 0 18px; font-size: 14px; }
.age { display: flex; gap: 12px; align-items: flex-start; font-size: 13px; color: var(--muted); }
.age-pill { flex-shrink: 0; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--red); color: var(--red); font-weight: 800; font-size: 13px; }
.cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
h4 { margin: 0 0 14px; font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: var(--faint); }
.cols a { display: block; color: var(--muted); font-size: 14px; padding: 5px 0; transition: color .15s; }
.cols a:hover { color: var(--gold); }
.bottom { margin-top: 40px; padding-top: 22px; border-top: 1px solid var(--border); font-size: 12.5px; color: var(--faint); }
.bottom p { margin: 0 0 14px; max-width: 900px; }
.help { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.help a { color: var(--gold); }

@media (max-width: 820px) {
  .top { grid-template-columns: 1fr; gap: 32px; }
}
@media (max-width: 520px) {
  .cols { grid-template-columns: 1fr 1fr; }
}
</style>
