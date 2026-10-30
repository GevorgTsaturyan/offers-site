<template>
  <div class="container wrap">
    <article v-if="page" class="doc glass fade-in">
      <h1>{{ page.title }}</h1>
      <p class="updated">Last updated: {{ updated }}</p>
      <section v-for="s in page.sections" :key="s.h">
        <h2 v-if="s.h">{{ s.h }}</h2>
        <p v-for="(p, i) in s.p" :key="i">{{ p }}</p>
      </section>
      <p v-if="site.contact_email" class="contact">Questions? Email us at <a :href="`mailto:${site.contact_email}`">{{ site.contact_email }}</a>.</p>
    </article>
    <div v-else class="doc glass"><h1>Page not found</h1><RouterLink to="/" class="btn btn-gold">Go home</RouterLink></div>
  </div>
</template>

<script setup>
import { computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { site, setTitle } from '../site.js';

const route = useRoute();
const updated = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

const pages = computed(() => {
  const name = site.site_name;
  const age = site.min_age;
  return {
    about: { title: `About ${name}`, sections: [
      { p: [`${name} is an independent comparison site for online casino welcome offers. We collect current offers, explain their conditions in plain language and show the key numbers — wagering, minimum deposit and limits — before you decide.`] },
      { h: 'How we choose offers', p: ['We only list operators that hold a gambling licence and accept players from the markets they target. We look at the bonus value, how fair the wagering is, payout speed and customer support.', 'Ratings reflect our own opinion and are reviewed regularly.'] },
    ] },
    'affiliate-disclosure': { title: 'Affiliate disclosure', sections: [
      { p: [`${name} is free to use. We may receive a commission from casinos when you sign up through links on this site. This is how we keep the site running.`, 'Commissions never change the offer you receive, and they do not decide whether an offer is listed. Every offer link is marked as sponsored.'] },
    ] },
    'responsible-gambling': { title: 'Responsible gambling', sections: [
      { p: [`Gambling should be entertainment, never a way to make money. You must be ${age} or older to use the offers on this site.`] },
      { h: 'Simple rules that help', p: ['Decide on a budget before you play and stick to it.', 'Set a time limit and take regular breaks.', 'Never chase losses or borrow money to gamble.', 'Use the deposit limits, cool-off and self-exclusion tools that licensed casinos provide.'] },
      { h: 'Get help', p: [`If gambling stops being fun, free and confidential help is available at ${site.responsible_gambling_url}.`] },
    ] },
    privacy: { title: 'Privacy policy', sections: [
      { h: 'What we collect', p: ['If you subscribe to our newsletter we store your email address, optional first name, and the time you subscribed and confirmed. We record which offer links are clicked (as a total per offer, not linked to you on this site).'] },
      { h: 'How we use it', p: ['We use your email only to send you offer emails you asked for. We never sell your email address.'] },
      { h: 'Double opt-in', p: ['After subscribing you receive a confirmation email. You are only added to our list after clicking the link in that email.'] },
      { h: 'Unsubscribe and your rights', p: ['Every email contains a one-click unsubscribe link. You can also ask us to see or delete your data at any time by contacting us.'] },
      { h: 'Cookies', p: ['This site does not use advertising or tracking cookies. Your browser stores small preferences (for example, that you dismissed a notice) locally.'] },
    ] },
    terms: { title: 'Terms of use', sections: [
      { p: [`${name} provides information about third-party casino offers. We are not a casino and do not accept bets.`, 'Offers are set by the casinos and may change or end without notice. The casino’s own terms always apply — check them before you deposit.', `You may only use the offers if you are ${age}+ and online gambling is legal where you live.`, 'Information on this site is provided as-is, without guarantees.'] },
    ] },
  };
});

const page = computed(() => pages.value[route.params.page]);
watchEffect(() => setTitle(page.value?.title || 'Not found'));
</script>

<style scoped>
.wrap { padding: 40px 20px 20px; }
.doc { max-width: 820px; margin: 0 auto; padding: 44px; }
h1 { font-size: clamp(26px, 4vw, 38px); }
.updated { color: var(--faint); font-size: 13px; margin: 8px 0 26px; }
h2 { font-size: 20px; margin: 26px 0 10px; }
p { color: #cfd5e3; margin: 0 0 12px; }
.contact a { color: var(--gold); }
@media (max-width: 600px) { .doc { padding: 26px 20px; } }
</style>
