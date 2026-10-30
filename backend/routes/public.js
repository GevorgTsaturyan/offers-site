import express from 'express';
import db, { SETTING_KEYS } from '../db.js';
import * as Offers from '../services/offers.js';
import * as Controller from '../services/controllerClient.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

export function readSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const s = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return Object.fromEntries(SETTING_KEYS.map(k => [k, s[k] ?? '']));
}

router.get('/api/site', (req, res) => res.json(readSettings()));

router.get('/api/offers', (req, res) => res.json(Offers.listPublic()));

router.get('/api/offers/:slug', (req, res) => {
  const row = Offers.findBySlug(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Offer not found' });
  res.json(Offers.toApi(row));
});

// "Claim offer" — user-initiated click on the site. Counts the click and sends
// the visitor to the casino with one plain 302. Hidden offers do not redirect.
router.get('/go/:slug', (req, res) => {
  const row = Offers.findBySlug(req.params.slug);
  if (!row) return res.redirect(302, '/');
  Offers.recordClick(row.id);
  res.set('Cache-Control', 'no-store');
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.redirect(302, row.affiliate_url);
});

const subscribeLimit = rateLimit({ windowMs: 15 * 60_000, max: 8 });

router.post('/api/subscribe', subscribeLimit, async (req, res) => {
  const { email, firstName, consent, website } = req.body || {};
  // Honeypot: real visitors never see/fill "website". Pretend success for bots.
  if (website) return res.json({ status: 'sent' });
  if (!consent) return res.status(400).json({ error: 'Please confirm you are 18+ and agree to receive emails.' });
  if (!Controller.isConfigured()) return res.status(503).json({ error: 'Subscriptions are temporarily unavailable.' });
  try {
    const r = await Controller.subscribe({ email, firstName, source: 'offers-site' });
    res.json({ status: r.status });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: 'Please enter a valid email address.' });
    console.error('[subscribe] controller error:', err.message);
    res.status(502).json({ error: 'Could not subscribe right now — please try again later.' });
  }
});

router.post('/api/confirm', rateLimit({ windowMs: 15 * 60_000, max: 30 }), async (req, res) => {
  if (!Controller.isConfigured()) return res.status(503).json({ error: 'Unavailable' });
  try {
    const r = await Controller.confirm(String(req.body?.token || ''));
    res.json({ status: r.status });
  } catch (err) {
    console.error('[confirm] controller error:', err.message);
    res.status(502).json({ error: 'Could not confirm right now — please try again later.' });
  }
});

export default router;
