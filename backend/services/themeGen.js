// ─── themeGen — a distinct, stable design + copy for each brand domain ───────
//
// Every brand site (offers.<domain>, optionally the bare domain) shows the same
// offer catalogue, but must NOT look like a copy of the others: a network of
// identical sites behind many sender domains is a spam pattern. For each brand we
// pick — deterministically from a seed, so it never changes on restart — a
// palette (light or dark), font stack, corner radius, layout, hero style, logo
// mark, section order, wording, and an offer order. No external assets/fonts are
// loaded (system font stacks only), so nothing new is fetched by visitors.
//
// Pure: generateBrandDesign(seed) → { theme, copy, offer_seed }.

// Small deterministic PRNG (mulberry32) seeded from a string hash.
function hash(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^= h >>> 16) >>> 0; };
}
export function rng(seed) {
  let a = hash(String(seed))();
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

// [bg, bg2, text, muted, accent, accent2, accentText, mode]
const PALETTES = [
  { name: 'midnight-gold', mode: 'dark',  bg: '#0a0e1a', bg2: '#11172b', text: '#eef1f8', muted: '#9aa3b8', accent: '#f5c451', accent2: '#8b5cf6', accent_text: '#1a1405' },
  { name: 'forest',        mode: 'dark',  bg: '#0b1612', bg2: '#11231c', text: '#e8f3ee', muted: '#94b3a5', accent: '#34d399', accent2: '#fbbf24', accent_text: '#06261a' },
  { name: 'ocean',         mode: 'dark',  bg: '#07131f', bg2: '#0c2033', text: '#e6f0fa', muted: '#8fa8c2', accent: '#38bdf8', accent2: '#f472b6', accent_text: '#04263a' },
  { name: 'wine',          mode: 'dark',  bg: '#170a10', bg2: '#25111b', text: '#f7e9ef', muted: '#c09aab', accent: '#fb7185', accent2: '#fcd34d', accent_text: '#2a0711' },
  { name: 'graphite',      mode: 'dark',  bg: '#111214', bg2: '#1b1d21', text: '#f1f2f4', muted: '#a1a6b0', accent: '#a3e635', accent2: '#60a5fa', accent_text: '#18240a' },
  { name: 'paper',         mode: 'light', bg: '#fbfaf7', bg2: '#f1eee6', text: '#1d1b16', muted: '#6b665a', accent: '#b45309', accent2: '#0f766e', accent_text: '#ffffff' },
  { name: 'sky',           mode: 'light', bg: '#f6f9fc', bg2: '#e8f0f8', text: '#0f1c2b', muted: '#5b6b7e', accent: '#2563eb', accent2: '#db2777', accent_text: '#ffffff' },
  { name: 'mint',          mode: 'light', bg: '#f5fbf8', bg2: '#e4f3ec', text: '#10231b', muted: '#55705f', accent: '#047857', accent2: '#c2410c', accent_text: '#ffffff' },
  { name: 'lavender',      mode: 'light', bg: '#faf8ff', bg2: '#eee9fb', text: '#1c1530', muted: '#675d82', accent: '#7c3aed', accent2: '#0891b2', accent_text: '#ffffff' },
  { name: 'sand',          mode: 'light', bg: '#fdf9f3', bg2: '#f5ead9', text: '#2a2015', muted: '#7a6a55', accent: '#c2410c', accent2: '#1d4ed8', accent_text: '#ffffff' },
];

const FONTS = [
  { body: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",       display: "'Sora', 'Inter', system-ui, sans-serif" },
  { body: "Georgia, 'Times New Roman', serif",                                display: "Georgia, 'Times New Roman', serif" },
  { body: "'Trebuchet MS', 'Segoe UI', system-ui, sans-serif",                display: "'Trebuchet MS', 'Segoe UI', sans-serif" },
  { body: "Verdana, Geneva, system-ui, sans-serif",                           display: "Verdana, Geneva, sans-serif" },
  { body: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",         display: "'Palatino Linotype', Palatino, 'Book Antiqua', serif" },
  { body: "ui-rounded, 'SF Pro Rounded', 'Nunito', system-ui, sans-serif",    display: "ui-rounded, 'SF Pro Rounded', system-ui, sans-serif" },
];

const RADII   = [4, 8, 12, 18, 26];
const LAYOUTS = ['grid', 'list', 'wide'];
const HEROES  = ['center', 'left'];
const MARKS   = ['★', '◆', '●', '▲', '✦', '■', '✺', '❖'];

const COPY = {
  tagline: [
    'Hand-picked casino offers, explained clearly.',
    'Welcome offers compared in plain language.',
    'Clear terms first. Then decide.',
    'A short list of offers worth reading.',
    'Bonuses, wagering and limits — side by side.',
    'Our weekly shortlist of welcome offers.',
  ],
  hero_title: [
    'Today’s best casino welcome offers',
    'This week’s shortlist of welcome offers',
    'Compare welcome offers in a minute',
    'Fresh picks, with the terms up front',
    'Welcome offers we think are worth a look',
    'The offers on our list this week',
  ],
  lead: [
    'Compare the welcome bonuses below and claim the one that suits you. Tap “Details” for the full terms.',
    'Every pick shows the bonus, wagering and minimum deposit. Open the details before you decide.',
    'We keep the list short and the terms readable. Skip anything that isn’t for you.',
    'Read the key terms first — the full conditions are one tap away on each offer.',
  ],
  how_title: ['How it works', 'Three simple steps', 'How to use this list', 'Before you claim'],
  steps: [
    [
      { icon: '🧭', title: 'Compare', text: 'See the bonus, wagering and minimum deposit for each casino at a glance.' },
      { icon: '📄', title: 'Read the terms', text: 'Open the details page for the full conditions in plain language.' },
      { icon: '🎁', title: 'Claim if it fits', text: 'Only claim offers that suit you. You go straight to the casino’s own page.' },
    ],
    [
      { icon: '🔎', title: 'Look through the list', text: 'Each card shows what you get and what you have to do for it.' },
      { icon: '⚖️', title: 'Check the conditions', text: 'Wagering, deposit and time limits are listed before you click.' },
      { icon: '✅', title: 'Decide calmly', text: 'There is no rush — offers stay on the list while they are valid.' },
    ],
    [
      { icon: '📋', title: 'Pick a shortlist', text: 'Choose two or three offers that match how you like to play.' },
      { icon: '🧮', title: 'Do the maths', text: 'Compare wagering and minimum deposit, not just the headline number.' },
      { icon: '🛡️', title: 'Stay in control', text: 'Set a budget first. Claim only what you would play anyway.' },
    ],
  ],
  trust: [
    [
      { icon: '🔒', title: 'Licensed operators', text: 'We only list casinos we have checked.' },
      { icon: '🧾', title: 'Clear terms', text: 'Wagering and limits are shown up front.' },
      { icon: '✉️', title: 'No spam', text: 'Unsubscribe from emails with one click.' },
      { icon: '🛟', title: 'Play safe', text: 'Help and limits are always one click away.' },
    ],
    [
      { icon: '📑', title: 'Terms in plain words', text: 'No small print hidden behind the headline.' },
      { icon: '🔁', title: 'Updated weekly', text: 'Expired offers are removed from the list.' },
      { icon: '🙅', title: 'No pressure', text: 'We never push you to claim anything.' },
      { icon: '🧭', title: 'Help nearby', text: 'Support services are linked on every page.' },
    ],
    [
      { icon: '🔍', title: 'Checked before listed', text: 'Every operator is reviewed before it appears.' },
      { icon: '📅', title: 'Kept current', text: 'We refresh the shortlist every week.' },
      { icon: '🔕', title: 'Your inbox, your rules', text: 'One click unsubscribes you from our emails.' },
      { icon: '❤️', title: 'Responsible first', text: 'Budgets and breaks come before bonuses.' },
    ],
  ],
  sections: [['how', 'trust'], ['trust', 'how'], ['how'], ['trust']],
};

export function generateBrandDesign(seed) {
  const r = rng(seed);
  const p = pick(r, PALETTES);
  const f = pick(r, FONTS);
  const theme = {
    palette: p.name, mode: p.mode,
    bg: p.bg, bg2: p.bg2, text: p.text, muted: p.muted,
    accent: p.accent, accent2: p.accent2, accent_text: p.accent_text,
    font: f.body, display: f.display,
    radius: pick(r, RADII),
    button_radius: pick(r, [4, 8, 999]),
    layout: pick(r, LAYOUTS),
    hero: pick(r, HEROES),
    mark: pick(r, MARKS),
  };
  const copy = {
    tagline: pick(r, COPY.tagline),
    hero_title: pick(r, COPY.hero_title),
    lead: pick(r, COPY.lead),
    how_title: pick(r, COPY.how_title),
    steps: pick(r, COPY.steps),
    trust: pick(r, COPY.trust),
    sections: pick(r, COPY.sections),
  };
  return { theme, copy, offer_seed: Math.floor(r() * 2 ** 31) };
}

// Deterministic per-brand order (featured offers keep priority within it).
export function orderOffers(offers, seed) {
  const r = rng(`order:${seed}`);
  const keyed = offers.map((o) => ({ o, k: r() }));
  keyed.sort((a, b) => (Number(b.o.featured) - Number(a.o.featured)) || a.k - b.k);
  return keyed.map((x) => x.o);
}

// CSS custom properties + body background for a theme (server-injected, no flash).
const HEX = /^#[0-9a-f]{6}$/i;
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
export function themeCss(t) {
  if (!t || ![t.bg, t.bg2, t.text, t.muted, t.accent, t.accent2].every((c) => HEX.test(c || ''))) return '';
  const fg = t.mode === 'light' ? '0, 0, 0' : '255, 255, 255';
  const safeFont = (s) => String(s || '').replace(/[<>{};]/g, '');
  return `:root{--bg:${t.bg};--bg-2:${t.bg2};--surface:rgba(${fg},0.04);--surface-2:rgba(${fg},0.07);`
    + `--border:rgba(${fg},0.10);--border-strong:rgba(${fg},0.18);--text:${t.text};--muted:${t.muted};`
    + `--faint:${t.muted};--gold:${t.accent};--gold-2:${t.accent};--violet:${t.accent2};`
    + `--radius:${Number(t.radius) || 18}px;--radius-sm:${Math.max(4, (Number(t.radius) || 18) - 6)}px;`
    + `--font:${safeFont(t.font)};--display:${safeFont(t.display)};--accent-text:${HEX.test(t.accent_text || '') ? t.accent_text : '#ffffff'};`
    + `--btn-radius:${Number(t.button_radius) || 999}px;}`
    + `body{background:radial-gradient(1100px 560px at ${t.hero === 'left' ? '10%' : '85%'} -10%, ${rgba(t.accent2, 0.16)}, transparent 60%),`
    + `radial-gradient(900px 500px at ${t.hero === 'left' ? '95%' : '-10%'} 10%, ${rgba(t.accent, 0.10)}, transparent 60%), var(--bg);}`
    + `::selection{background:var(--gold);color:var(--accent-text);}`;
}
