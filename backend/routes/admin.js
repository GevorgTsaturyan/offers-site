import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import crypto from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { join } from 'node:path';
import db, { SETTING_KEYS } from '../db.js';
import * as Offers from '../services/offers.js';
import { requireAdmin, jwtSecret } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { readSettings } from './public.js';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

const router = express.Router();

router.post('/login', rateLimit({ windowMs: 15 * 60_000, max: 10 }), async (req, res) => {
  const { username, password } = req.body || {};
  const user = db.prepare('SELECT * FROM admin_users WHERE username=?').get(String(username || ''));
  const ok = user && await bcrypt.compare(String(password || ''), user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Wrong username or password' });
  const token = jwt.sign({ id: user.id, username: user.username }, jwtSecret(), { expiresIn: '12h' });
  res.json({ token, username: user.username });
});

router.use(requireAdmin);

router.get('/offers', (req, res) => res.json(Offers.listAdmin()));

router.get('/offers/:id', (req, res) => {
  const row = Offers.findById(req.params.id);
  if (!row) return res.status(404).json({ error: 'Offer not found' });
  res.json(Offers.toApi(row, { admin: true }));
});

router.post('/offers', (req, res) => {
  const { values, error } = Offers.validateOffer(req.body || {});
  if (error) return res.status(400).json({ error });
  res.status(201).json(Offers.toApi(Offers.create(values), { admin: true }));
});

router.put('/offers/:id', (req, res) => {
  const existing = Offers.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Offer not found' });
  const { values, error } = Offers.validateOffer(req.body || {}, { existingId: existing.id });
  if (error) return res.status(400).json({ error });
  res.json(Offers.toApi(Offers.update(existing.id, values), { admin: true }));
});

// Quick toggles from the list (status / featured) without resending the whole form.
router.patch('/offers/:id', (req, res) => {
  const existing = Offers.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Offer not found' });
  const patch = {};
  if ('status' in req.body) patch.status = req.body.status === 'hidden' ? 'hidden' : 'active';
  if ('featured' in req.body) patch.featured = req.body.featured ? 1 : 0;
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to update' });
  res.json(Offers.toApi(Offers.update(existing.id, patch), { admin: true }));
});

router.delete('/offers/:id', (req, res) => {
  const existing = Offers.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Offer not found' });
  if (existing.logo_path) { try { unlinkSync(join(UPLOAD_DIR, existing.logo_path)); } catch {} }
  Offers.remove(existing.id);
  res.json({ ok: true });
});

router.put('/reorder', (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Number.isInteger) : null;
  if (!ids) return res.status(400).json({ error: 'ids array required' });
  Offers.reorder(ids);
  res.json({ ok: true });
});

// Logo upload — raster images only (SVG can carry scripts), max 1 MB.
const IMAGE_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, `logo-${crypto.randomBytes(8).toString('hex')}.${IMAGE_TYPES[file.mimetype]}`),
  }),
  limits: { fileSize: 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, Boolean(IMAGE_TYPES[file.mimetype])),
});

router.post('/offers/:id/logo', (req, res) => {
  const existing = Offers.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Offer not found' });
  upload.single('logo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Logo must be under 1 MB' : err.message });
    if (!req.file) return res.status(400).json({ error: 'Upload a PNG, JPG, WEBP or GIF image' });
    if (existing.logo_path) { try { unlinkSync(join(UPLOAD_DIR, existing.logo_path)); } catch {} }
    res.json(Offers.toApi(Offers.update(existing.id, { logo_path: req.file.filename }), { admin: true }));
  });
});

router.get('/settings', (req, res) => res.json(readSettings()));

router.put('/settings', (req, res) => {
  const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  db.transaction(() => {
    for (const k of SETTING_KEYS) if (k in (req.body || {})) stmt.run(k, String(req.body[k] ?? '').slice(0, 500));
  })();
  res.json(readSettings());
});

router.get('/stats', (req, res) => {
  const row = db.prepare(`
    SELECT COUNT(*) total, SUM(status='active') active, SUM(featured=1 AND status='active') featured,
           COALESCE(SUM(clicks),0) clicks FROM offers`).get();
  res.json(row);
});

export default router;
