// Offer repository + validation. Single place that turns DB rows into API
// objects and request bodies into safe DB values.

import db from '../db.js';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

export function toApi(row, { admin = false } = {}) {
  if (!row) return null;
  const o = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    bonusTitle: row.bonus_title,
    shortDescription: row.short_description,
    description: row.description,
    highlights: safeJsonArray(row.highlights),
    terms: row.terms,
    wagering: row.wagering,
    minDeposit: row.min_deposit,
    paymentMethods: row.payment_methods,
    countries: row.countries,
    rating: row.rating,
    badge: row.badge,
    accentColor: row.accent_color,
    logoUrl: row.logo_path ? `/uploads/${row.logo_path}` : null,
    featured: !!row.featured,
    createdAt: row.created_at,
  };
  if (admin) Object.assign(o, {
    affiliateUrl: row.affiliate_url, status: row.status, sortOrder: row.sort_order,
    clicks: row.clicks, updatedAt: row.updated_at,
  });
  return o;
}

function safeJsonArray(s) {
  try { const a = JSON.parse(s); return Array.isArray(a) ? a : []; } catch { return []; }
}

const str = (v, max) => String(v ?? '').trim().slice(0, max);

// Validates a create/update body. Returns { values } or { error }.
export function validateOffer(body, { existingId = null } = {}) {
  const name = str(body.name, 80);
  const bonusTitle = str(body.bonusTitle, 120);
  const affiliateUrl = str(body.affiliateUrl, 2000);
  if (!name) return { error: 'Casino name is required' };
  if (!bonusTitle) return { error: 'Bonus title is required' };

  let url;
  try { url = new URL(affiliateUrl); } catch { return { error: 'Affiliate URL must be a full http(s) URL' }; }
  if (!['http:', 'https:'].includes(url.protocol)) return { error: 'Affiliate URL must start with http:// or https://' };

  const slug = str(body.slug, 60) || slugify(name);
  if (!SLUG_RE.test(slug)) return { error: 'Slug may contain only lowercase letters, numbers and dashes' };
  const clash = db.prepare('SELECT id FROM offers WHERE slug=?').get(slug);
  if (clash && clash.id !== existingId) return { error: `Slug "${slug}" is already used by another offer` };

  const rating = Math.min(5, Math.max(0, Number(body.rating ?? 4.5) || 0));
  const highlights = (Array.isArray(body.highlights) ? body.highlights : String(body.highlights || '').split('\n'))
    .map(h => str(h, 120)).filter(Boolean).slice(0, 8);
  const accent = COLOR_RE.test(body.accentColor || '') ? body.accentColor : '#f5c451';
  const status = body.status === 'hidden' ? 'hidden' : 'active';

  return { values: {
    slug, name, bonus_title: bonusTitle,
    short_description: str(body.shortDescription, 300),
    description: str(body.description, 8000),
    highlights: JSON.stringify(highlights),
    terms: str(body.terms, 8000),
    wagering: str(body.wagering, 60),
    min_deposit: str(body.minDeposit, 60),
    payment_methods: str(body.paymentMethods, 300),
    countries: str(body.countries, 300),
    rating: Math.round(rating * 10) / 10,
    badge: str(body.badge, 24),
    accent_color: accent,
    affiliate_url: url.toString(),
    featured: body.featured ? 1 : 0,
    status,
  } };
}

export function listPublic() {
  return db.prepare("SELECT * FROM offers WHERE status='active' ORDER BY featured DESC, sort_order ASC, id DESC").all().map(r => toApi(r));
}

export function listAdmin() {
  return db.prepare('SELECT * FROM offers ORDER BY sort_order ASC, id DESC').all().map(r => toApi(r, { admin: true }));
}

export function findBySlug(slug, { activeOnly = true } = {}) {
  const row = db.prepare('SELECT * FROM offers WHERE slug=?').get(String(slug));
  if (!row || (activeOnly && row.status !== 'active')) return null;
  return row;
}

export function findById(id) {
  return db.prepare('SELECT * FROM offers WHERE id=?').get(Number(id)) || null;
}

export function create(values) {
  const now = new Date().toISOString();
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) m FROM offers').get().m;
  const cols = Object.keys(values);
  const id = db.prepare(`
    INSERT INTO offers (${cols.join(',')}, sort_order, created_at, updated_at)
    VALUES (${cols.map(() => '?').join(',')}, ?, ?, ?)
  `).run(...Object.values(values), maxOrder + 1, now, now).lastInsertRowid;
  return findById(id);
}

export function update(id, values) {
  const cols = Object.keys(values);
  db.prepare(`UPDATE offers SET ${cols.map(c => `${c}=?`).join(',')}, updated_at=? WHERE id=?`)
    .run(...Object.values(values), new Date().toISOString(), Number(id));
  return findById(id);
}

export function remove(id) {
  return db.prepare('DELETE FROM offers WHERE id=?').run(Number(id)).changes > 0;
}

export function reorder(ids) {
  const stmt = db.prepare('UPDATE offers SET sort_order=? WHERE id=?');
  db.transaction(() => ids.forEach((id, i) => stmt.run(i + 1, Number(id))))();
}

export function recordClick(id) {
  db.prepare('UPDATE offers SET clicks = clicks + 1 WHERE id=?').run(id);
}
