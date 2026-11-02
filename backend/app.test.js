// End-to-end API tests against the real Express app (in-memory DB, real HTTP).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret';
process.env.UPLOAD_DIR = mkdtempSync(join(tmpdir(), 'offers-up-'));
process.env.FRONTEND_DIST = '/nonexistent';
process.env.CONTROLLER_URL = 'http://controller.test';
process.env.CONTROLLER_SITE_KEY = 'site-key';
process.env.BRAND_HOSTS = JSON.stringify({ 'offers.serawin.net': { site_name: 'Serawin Offers', contact_email: 'support@serawin.net' } });

const bcrypt = (await import('bcrypt')).default;
const db = (await import('./db.js')).default;
const app = (await import('./app.js')).default;

db.prepare("INSERT INTO admin_users (username, password_hash, created_at) VALUES ('admin', ?, ?)")
  .run(await bcrypt.hash('correct-horse', 4), new Date().toISOString());

let server, base, token;
const realFetch = globalThis.fetch;
let controllerCalls = [];

before(async () => {
  server = app.listen(0);
  await new Promise(r => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
  // Intercept only calls to the fake controller; everything else is real HTTP.
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith('http://controller.test')) {
      controllerCalls.push({ url: String(url), headers: init.headers, body: JSON.parse(init.body) });
      return { ok: true, status: 200, json: async () => ({ status: String(url).endsWith('/confirm') ? 'confirmed' : 'sent' }) };
    }
    return realFetch(url, init);
  };
});
after(() => { globalThis.fetch = realFetch; server.close(); });

const api = (path, { method = 'GET', body, auth } = {}) => realFetch(base + path, {
  method, redirect: 'manual',
  headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${token}` } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});

const OFFER = {
  name: 'Lucky Star Casino', bonusTitle: '100% up to €300 + 50 Free Spins',
  affiliateUrl: 'https://partner.example/track?id=1', highlights: 'Fast payouts\nLive casino',
  rating: 4.7, badge: 'Exclusive', featured: true,
};

test('admin login: wrong password rejected, right one returns token', async () => {
  assert.equal((await api('/api/admin/login', { method: 'POST', body: { username: 'admin', password: 'x' } })).status, 401);
  const r = await api('/api/admin/login', { method: 'POST', body: { username: 'admin', password: 'correct-horse' } });
  assert.equal(r.status, 200);
  token = (await r.json()).token;
  assert.ok(token);
});

test('admin routes require a token', async () => {
  assert.equal((await api('/api/admin/offers')).status, 401);
});

test('create offer → visible publicly without the affiliate URL', async () => {
  const r = await api('/api/admin/offers', { method: 'POST', body: OFFER, auth: true });
  assert.equal(r.status, 201);
  const created = await r.json();
  assert.equal(created.slug, 'lucky-star-casino');
  assert.deepEqual(created.highlights, ['Fast payouts', 'Live casino']);

  const list = await (await api('/api/offers')).json();
  assert.equal(list.length, 1);
  assert.equal(list[0].affiliateUrl, undefined, 'affiliate URL must not leak in public API');
  assert.equal((await api('/api/offers/lucky-star-casino')).status, 200);
});

test('validation: bad URL and duplicate slug rejected', async () => {
  const bad = await api('/api/admin/offers', { method: 'POST', body: { ...OFFER, affiliateUrl: 'javascript:alert(1)' }, auth: true });
  assert.equal(bad.status, 400);
  const dup = await api('/api/admin/offers', { method: 'POST', body: OFFER, auth: true });
  assert.equal(dup.status, 400);
});

test('claim: /go/:slug counts the click and 302s to the casino', async () => {
  const r = await api('/go/lucky-star-casino');
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), 'https://partner.example/track?id=1');
  const [offer] = await (await api('/api/admin/offers', { auth: true })).json();
  assert.equal(offer.clicks, 1);
});

test('hidden offer: not listed, no page, no redirect', async () => {
  const [offer] = await (await api('/api/admin/offers', { auth: true })).json();
  await api(`/api/admin/offers/${offer.id}`, { method: 'PATCH', body: { status: 'hidden' }, auth: true });
  assert.equal((await (await api('/api/offers')).json()).length, 0);
  assert.equal((await api('/api/offers/lucky-star-casino')).status, 404);
  assert.equal((await api('/go/lucky-star-casino')).headers.get('location'), '/');
  await api(`/api/admin/offers/${offer.id}`, { method: 'PATCH', body: { status: 'active' }, auth: true });
});

test('subscribe: requires consent; forwards to controller with site key', async () => {
  assert.equal((await api('/api/subscribe', { method: 'POST', body: { email: 'a@b.co' } })).status, 400);
  controllerCalls = [];
  const r = await api('/api/subscribe', { method: 'POST', body: { email: 'a@b.co', firstName: 'Ann', consent: true } });
  assert.equal((await r.json()).status, 'sent');
  assert.equal(controllerCalls.length, 1);
  assert.equal(controllerCalls[0].headers['X-Site-Key'], 'site-key');
  assert.equal(controllerCalls[0].body.email, 'a@b.co');
});

test('subscribe: honeypot field silently drops bots', async () => {
  controllerCalls = [];
  const r = await api('/api/subscribe', { method: 'POST', body: { email: 'bot@b.co', consent: true, website: 'spam' } });
  assert.equal(r.status, 200);
  assert.equal(controllerCalls.length, 0);
});

test('confirm: proxies token to controller', async () => {
  const r = await api('/api/confirm', { method: 'POST', body: { token: 'abc' } });
  assert.equal((await r.json()).status, 'confirmed');
});

test('settings: admin update is reflected publicly', async () => {
  await api('/api/admin/settings', { method: 'PUT', body: { site_name: 'My Offers' }, auth: true });
  assert.equal((await (await api('/api/site')).json()).site_name, 'My Offers');
});

test('logo upload rejects non-images', async () => {
  const [offer] = await (await api('/api/admin/offers', { auth: true })).json();
  const fd = new FormData();
  fd.append('logo', new Blob(['<svg onload="alert(1)"/>'], { type: 'image/svg+xml' }), 'x.svg');
  const r = await realFetch(`${base}/api/admin/offers/${offer.id}/logo`, { method: 'POST', body: fd, headers: { Authorization: `Bearer ${token}` } });
  assert.equal(r.status, 400);
});

// ── Brand hosts (offers.<sender-domain>) ─────────────────────────────────────
import http from 'node:http';
function getWithHost(path, host) {
  return new Promise((resolve, reject) => {
    const u = new URL(base + path);
    http.get({ hostname: u.hostname, port: u.port, path, headers: { Host: host } }, (res) => {
      let body = ''; res.on('data', d => body += d); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }).on('error', reject);
  });
}

test('brand host: branded settings, newsletter hidden, never indexed', async () => {
  const site = await getWithHost('/api/site', 'offers.serawin.net');
  const s = JSON.parse(site.body);
  assert.equal(s.site_name, 'Serawin Offers');
  assert.equal(s.contact_email, 'support@serawin.net');
  assert.equal(s.subscribe_enabled, false);
  assert.equal(s.site_url, 'https://offers.serawin.net');
  assert.match(site.headers['x-robots-tag'], /noindex/);
  const robots = await getWithHost('/robots.txt', 'offers.serawin.net');
  assert.match(robots.body, /Disallow: \//);
  assert.equal((await getWithHost('/sitemap.xml', 'offers.serawin.net')).status, 404);
});

test('primary host: unchanged settings, indexable, newsletter on', async () => {
  const site = await getWithHost('/api/site', 'noradion.org');
  const s = JSON.parse(site.body);
  assert.notEqual(s.site_name, 'Serawin Offers');
  assert.equal(s.subscribe_enabled, true);
  assert.equal(site.headers['x-robots-tag'], undefined);
  assert.match((await getWithHost('/robots.txt', 'noradion.org')).body, /Allow: \//);
});
