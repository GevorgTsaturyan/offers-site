// Server-to-server API for the campaign controller (brand provisioning).
// Auth: X-Internal-Key must equal INTERNAL_API_KEY. Disabled when unset.
import express from 'express';
import { timingSafeEqual } from 'node:crypto';
import { upsertBrand, listBrands } from '../services/brands.js';

const router = express.Router();

function authorized(req) {
  const want = process.env.INTERNAL_API_KEY || '';
  const got = String(req.get('x-internal-key') || '');
  if (!want || got.length !== want.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

router.use((req, res, next) => (authorized(req) ? next() : res.status(401).json({ error: 'Unauthorized' })));

router.post('/brands', (req, res) => {
  try {
    const b = upsertBrand(req.body || {});
    res.status(b.created ? 201 : 200).json(b);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/brands', (req, res) => res.json(listBrands()));

export default router;
