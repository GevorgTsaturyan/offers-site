<template>
  <section id="subscribe" class="subscribe glass">
    <div class="art" aria-hidden="true">
      <div class="ring r1" /><div class="ring r2" /><div class="envelope">✉</div>
    </div>
    <div class="content">
      <span class="eyebrow">Free newsletter</span>
      <h2>Get new offers <span class="gradient-text">before anyone else</span></h2>
      <p class="muted">One or two emails a week with fresh, hand-picked offers. No spam — unsubscribe with one click anytime.</p>

      <div v-if="done" class="alert alert-ok result">
        <strong>{{ doneTitle }}</strong><br />{{ doneText }}
      </div>

      <form v-else class="form" @submit.prevent="submit" novalidate>
        <div class="row">
          <input v-model.trim="firstName" class="input" type="text" placeholder="First name (optional)" autocomplete="given-name" maxlength="60" />
          <input v-model.trim="email" class="input" type="email" placeholder="Your email address" autocomplete="email" required />
        </div>
        <!-- Honeypot: hidden from people, bots fill it -->
        <input v-model="website" class="hp" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" />
        <label class="checkbox">
          <input v-model="consent" type="checkbox" />
          <span>I am {{ site.min_age }}+ and I agree to receive offer emails. I can unsubscribe at any time. See our <RouterLink to="/info/privacy">privacy policy</RouterLink>.</span>
        </label>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <button class="btn btn-gold submit" :disabled="busy">{{ busy ? 'Sending…' : 'Subscribe for free' }}</button>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { request } from '../api.js';
import { site } from '../site.js';

const email = ref(''); const firstName = ref(''); const consent = ref(false); const website = ref('');
const busy = ref(false); const error = ref(''); const done = ref('');

const MESSAGES = {
  sent: ['Check your inbox ✉', 'We sent you a confirmation link. Click it to start receiving offers (check Spam/Promotions if you don’t see it).'],
  cooldown: ['Check your inbox ✉', 'We already sent you a confirmation link a few minutes ago. Please click it to finish.'],
  already_subscribed: ['You’re already subscribed 🎉', 'This email is already on our list — watch your inbox for the next offers.'],
  suppressed: ['Thanks!', 'This address previously unsubscribed. If you want to receive our emails again, please contact us.'],
};
const doneTitle = computed(() => (MESSAGES[done.value] || MESSAGES.sent)[0]);
const doneText = computed(() => (MESSAGES[done.value] || MESSAGES.sent)[1]);

async function submit() {
  error.value = '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value)) { error.value = 'Please enter a valid email address.'; return; }
  if (!consent.value) { error.value = `Please confirm you are ${site.min_age}+ and agree to receive emails.`; return; }
  busy.value = true;
  try {
    const r = await request('/api/subscribe', { method: 'POST', body: { email: email.value, firstName: firstName.value, consent: consent.value, website: website.value } });
    done.value = r.status;
  } catch (e) { error.value = e.message; }
  finally { busy.value = false; }
}
</script>

<style scoped>
.subscribe { position: relative; overflow: hidden; display: grid; grid-template-columns: 280px 1fr; gap: 40px; align-items: center; padding: 48px; }
.art { position: relative; height: 220px; display: grid; place-items: center; }
.ring { position: absolute; border-radius: 50%; border: 1px solid rgba(245,196,81,.25); }
.r1 { width: 220px; height: 220px; animation: pulse 4s ease-in-out infinite; }
.r2 { width: 150px; height: 150px; border-color: rgba(139,92,246,.35); animation: pulse 4s ease-in-out infinite .8s; }
.envelope { width: 92px; height: 92px; display: grid; place-items: center; font-size: 42px; border-radius: 24px; color: #1a1405; background: linear-gradient(135deg, var(--gold-2), var(--gold)); box-shadow: 0 20px 50px -15px rgba(245,196,81,.7); transform: rotate(-8deg); }
@keyframes pulse { 0%,100% { transform: scale(1); opacity: .8; } 50% { transform: scale(1.06); opacity: .4; } }
.eyebrow { font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--gold); }
h2 { font-size: clamp(24px, 3vw, 34px); margin: 8px 0 10px; }
.content > p { margin: 0 0 22px; }
.form { display: flex; flex-direction: column; gap: 14px; }
.row { display: grid; grid-template-columns: 1fr 1.4fr; gap: 12px; }
.hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
.checkbox a { color: var(--gold); text-decoration: underline; }
.submit { align-self: flex-start; padding-left: 32px; padding-right: 32px; }
.result { font-size: 15px; line-height: 1.6; }

@media (max-width: 860px) {
  .subscribe { grid-template-columns: 1fr; padding: 32px 22px; gap: 10px; }
  .art { height: 140px; }
  .r1 { width: 140px; height: 140px; } .r2 { width: 100px; height: 100px; }
  .envelope { width: 70px; height: 70px; font-size: 32px; }
}
@media (max-width: 560px) {
  .row { grid-template-columns: 1fr; }
  .submit { align-self: stretch; }
}
</style>
