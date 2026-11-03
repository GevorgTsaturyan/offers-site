// Per-domain brand sites. One offers catalogue, served on the primary site
// (SITE_URL, indexed by search engines) and on brand hosts for each sender
// domain — offers.<domain>, plus <domain> / www.<domain> when their DNS points
// here. Email buttons link to the brand host so the link domain matches the From
// domain (deliverability). Brand hosts:
//   - have their OWN generated design, copy and offer order (services/themeGen.js),
//     stored in the `brands` table — sites must not be copies of each other
//   - are ALWAYS noindex (robots.txt Disallow, X-Robots-Tag, meta robots), so
//     they never compete with the primary site as duplicate content
//   - hide the newsletter box (visitors are already subscribers of that brand)
//
// Brands are created by the campaign controller on identity provisioning
// (POST /api/internal/brands) or migrated once from the legacy BRAND_HOSTS env.

import db from '../db.js';
import { generateBrandDesign } from './themeGen.js';

const OVERRIDE_KEYS = ['site_name', 'tagline', 'hero_title', 'contact_email'];

export function primaryUrl() {
  return (process.env.SITE_URL || 'https://noradion.org').replace(/\/+$/, '');
}
function primaryHost() {
  try { return new URL(primaryUrl()).hostname.toLowerCase(); } catch { return ''; }
}

export function hostOf(req) {
  return String(req?.get?.('host') || '').toLowerCase().replace(/:\d+$/, '');
}

// offers.calerion.org / www.calerion.org / calerion.org → calerion.org
export function brandDomainOf(host) {
  return String(host || '').toLowerCase().replace(/^(offers|www)\./, '');
}

const DOMAIN_RE = /^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
export function isValidDomain(d) { return DOMAIN_RE.test(String(d || '')); }

function rowToBrand(r) {
  if (!r) return null;
  return { ...r, theme: JSON.parse(r.theme), copy: JSON.parse(r.copy) };
}

export function getBrand(domain) {
  return rowToBrand(db.prepare('SELECT * FROM brands WHERE domain = ?').get(domain));
}
export function listBrands() {
  return db.prepare('SELECT * FROM brands ORDER BY domain').all().map(rowToBrand);
}

// Idempotent. A NEW brand gets a freshly generated design; an existing brand
// keeps its design (only name/email are updated) so its look stays stable.
export function upsertBrand({ domain, site_name, contact_email = '' }) {
  domain = String(domain || '').toLowerCase().trim();
  if (!isValidDomain(domain)) throw Object.assign(new Error('invalid domain'), { status: 400 });
  if (brandDomainOf(primaryHost()) === domain) throw Object.assign(new Error('domain is the primary site'), { status: 400 });
  const name = String(site_name || '').trim().slice(0, 60) || domain;
  const email = String(contact_email || '').trim().slice(0, 120);
  const now = new Date().toISOString();
  const existing = getBrand(domain);
  if (existing) {
    db.prepare('UPDATE brands SET site_name=?, contact_email=?, updated_at=? WHERE domain=?').run(name, email || existing.contact_email, now, domain);
    return { ...getBrand(domain), created: false };
  }
  const d = mostDistinctDesign(domain, listBrands());
  db.prepare(`INSERT INTO brands (domain, site_name, contact_email, theme, copy, offer_seed, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(domain, name, email, JSON.stringify(d.theme), JSON.stringify(d.copy), d.offer_seed, now, now);
  return { ...getBrand(domain), created: true };
}

// Among several candidate designs, pick the one that shares the fewest visible
// choices (palette, font, layout+hero, headline, tagline, lead, steps, trust)
// with brands that already exist — so sites stay distinct as brands are added.
const FEATURES = (d) => [
  `p:${d.theme.palette}`, `f:${d.theme.font}`, `l:${d.theme.layout}|${d.theme.hero}`, `m:${d.theme.mark}`,
  `h:${d.copy.hero_title}`, `t:${d.copy.tagline}`, `ld:${d.copy.lead}`,
  `s:${d.copy.steps[0].title}`, `tr:${d.copy.trust[0].title}`,
];
export function mostDistinctDesign(domain, existing) {
  const used = new Map();
  for (const b of existing) for (const f of FEATURES(b)) used.set(f, (used.get(f) || 0) + 1);
  let best = null, bestScore = Infinity;
  for (let i = 0; i < 200; i++) {
    const d = generateBrandDesign(i === 0 ? domain : `${domain}#${i}`);
    // palette collisions weigh most (most visible), then headline/font/layout
    const score = FEATURES(d).reduce((a, f) => a + (used.get(f) || 0) * (f.startsWith('p:') ? 5 : f.startsWith('h:') || f.startsWith('f:') || f.startsWith('l:') ? 3 : 1), 0);
    if (score < bestScore) { best = d; bestScore = score; if (score === 0) break; }
  }
  return best;
}

// New design for an existing brand (admin action) — keeps name/email.
export function regenerateBrand(domain) {
  const b = getBrand(domain);
  if (!b) return null;
  const others = listBrands().filter((x) => x.domain !== domain);
  const d = mostDistinctDesign(`${domain}:${Date.now()}`, others);
  db.prepare('UPDATE brands SET theme=?, copy=?, offer_seed=?, updated_at=? WHERE domain=?')
    .run(JSON.stringify(d.theme), JSON.stringify(d.copy), d.offer_seed, new Date().toISOString(), domain);
  return getBrand(domain);
}

// One-time migration of the legacy BRAND_HOSTS env (JSON keyed by hostname).
export function migrateEnvBrands() {
  let raw = {};
  try { raw = JSON.parse(process.env.BRAND_HOSTS || '{}') || {}; } catch { return 0; }
  let n = 0;
  for (const [host, cfg] of Object.entries(raw)) {
    const domain = brandDomainOf(host);
    if (!isValidDomain(domain) || getBrand(domain)) continue;
    upsertBrand({ domain, site_name: cfg?.site_name, contact_email: cfg?.contact_email });
    n++;
  }
  return n;
}

// { host, url, primary, overrides, brand }
export function siteFor(req) {
  const host = hostOf(req);
  const brand = host && host !== primaryHost() ? getBrand(brandDomainOf(host)) : null;
  if (!brand) return { host, url: primaryUrl(), primary: true, overrides: {}, brand: null };
  const o = { site_name: brand.site_name, contact_email: brand.contact_email, tagline: brand.copy.tagline, hero_title: brand.copy.hero_title };
  const overrides = Object.fromEntries(Object.entries(o).filter(([k, v]) => OVERRIDE_KEYS.includes(k) && v));
  return { host, url: `https://${host}`, primary: false, overrides, brand };
}
