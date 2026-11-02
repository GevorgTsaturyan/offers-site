// SEO: robots.txt, sitemap.xml and per-route <head> injection for the SPA shell.
// The SPA is client-rendered, so the server rewrites title/description/canonical
// in index.html per URL so crawlers get correct tags without executing JS.

import db from '../db.js';
import { readSettings } from '../routes/public.js';

export const SITE_URL = (process.env.SITE_URL || 'https://noradion.org').replace(/\/+$/, '');

// Keep in sync with frontend/src/views/InfoView.vue.
const INFO_PAGES = {
  about: { title: s => `About ${s.site_name}`, desc: s => `${s.site_name} is an independent comparison site for online casino welcome offers, explaining wagering, deposits and limits in plain language.` },
  'affiliate-disclosure': { title: () => 'Affiliate disclosure', desc: s => `How ${s.site_name} earns commissions from casino partners and why it never changes the offers you receive.` },
  'responsible-gambling': { title: () => 'Responsible gambling', desc: s => `Gamble responsibly: budgets, time limits and where to get free help. ${s.min_age || 18}+ only.` },
  privacy: { title: () => 'Privacy policy', desc: s => `What data ${s.site_name} collects, how newsletter double opt-in works, and your rights.` },
  terms: { title: () => 'Terms of use', desc: s => `Terms for using ${s.site_name}, an information site about third-party casino offers.` },
};

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n = 160) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };

export function robotsTxt() {
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /go/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

export function sitemapXml() {
  const offers = db.prepare("SELECT slug, updated_at FROM offers WHERE status='active' ORDER BY featured DESC, sort_order ASC, id DESC").all();
  const latest = offers.reduce((m, o) => (o.updated_at > m ? o.updated_at : m), '') || new Date().toISOString();
  const day = d => String(d).slice(0, 10);
  const urls = [
    { loc: '/', lastmod: latest, priority: '1.0' },
    ...offers.map(o => ({ loc: `/offers/${o.slug}`, lastmod: o.updated_at, priority: '0.8' })),
    ...Object.keys(INFO_PAGES).map(p => ({ loc: `/info/${p}`, lastmod: latest, priority: '0.3' })),
  ];
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.map(u => `  <url><loc>${esc(SITE_URL + u.loc)}</loc><lastmod>${day(u.lastmod)}</lastmod><priority>${u.priority}</priority></url>`).join('\n')
    + '\n</urlset>\n';
}

// Returns { status, title, description, canonical, noindex } for a request path.
export function headFor(path) {
  const s = readSettings();
  const name = s.site_name || 'Casino Offers';
  const t = part => `${part} · ${name}`;
  const base = { status: 200, noindex: false, canonical: SITE_URL + path };

  if (path === '/') return { ...base, title: `${name} — ${s.tagline || 'Casino offers'}`, description: clip(s.hero_subtitle || 'Hand-picked casino welcome offers with clear terms. 18+ only. Gamble responsibly.') };

  let m = path.match(/^\/offers\/([a-z0-9-]+)\/?$/);
  if (m) {
    const o = db.prepare("SELECT slug, name, bonus_title, short_description FROM offers WHERE slug=? AND status='active'").get(m[1]);
    if (o) return { ...base, canonical: `${SITE_URL}/offers/${o.slug}`, title: t(`${o.name}: ${o.bonus_title}`), description: clip(o.short_description || `${o.name} welcome offer: ${o.bonus_title}. Key terms, wagering and minimum deposit explained.`) };
  }
  m = path.match(/^\/info\/([a-z-]+)\/?$/);
  if (m && INFO_PAGES[m[1]]) { const p = INFO_PAGES[m[1]]; return { ...base, canonical: `${SITE_URL}/info/${m[1]}`, title: t(p.title(s)), description: clip(p.desc(s)) }; }

  if (path === '/confirm') return { ...base, noindex: true, title: t('Confirm subscription'), description: 'Confirm your newsletter subscription.' };
  if (path === '/admin' || path.startsWith('/admin/')) return { ...base, noindex: true, title: 'Admin', description: '' };
  return { ...base, status: 404, noindex: true, title: t('Page not found'), description: 'This page does not exist.' };
}

export function renderShell(html, head) {
  const tags = [
    head.description && `<meta name="description" content="${esc(head.description)}" />`,
    `<link rel="canonical" href="${esc(head.canonical)}" />`,
    head.noindex && '<meta name="robots" content="noindex, nofollow" />',
    `<meta property="og:title" content="${esc(head.title)}" />`,
    head.description && `<meta property="og:description" content="${esc(head.description)}" />`,
    `<meta property="og:url" content="${esc(head.canonical)}" />`,
    '<meta property="og:type" content="website" />',
  ].filter(Boolean).join('\n    ');
  return html
    .replace(/<meta name="description"[^>]*>\s*/i, '')
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(head.title)}</title>\n    ${tags}`);
}
