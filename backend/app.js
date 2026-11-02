// Express app (no listen) — imported by index.js and by tests.
import express from 'express';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import publicRouter from './routes/public.js';
import adminRouter, { UPLOAD_DIR } from './routes/admin.js';
import { robotsTxt, sitemapXml, headFor, renderShell } from './services/seo.js';
import { siteFor } from './services/brands.js';

mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY : false);
app.use(express.json({ limit: '200kb' }));

app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// Brand hosts (offers.<sender-domain>): noindex on every response, no sitemap.
app.use((req, res, next) => {
  if (!siteFor(req).primary) res.set('X-Robots-Tag', 'noindex, nofollow');
  next();
});

app.get('/robots.txt', (req, res) => res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(robotsTxt(req)));
app.get('/sitemap.xml', (req, res) => {
  if (!siteFor(req).primary) return res.status(404).type('text/plain').send('Not found');
  res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(sitemapXml());
});

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', fallthrough: false }));
app.use(publicRouter);
app.use('/api/admin', adminRouter);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Built frontend (frontend/dist) with SPA fallback, so one process serves everything.
const DIST = resolve(process.env.FRONTEND_DIST || '../frontend/dist');
if (existsSync(DIST)) {
  app.use(express.static(DIST, { maxAge: '1h', index: false }));
  // SPA fallback with per-route <head> (title, description, canonical, noindex) and real 404 status.
  const shell = readFileSync(join(DIST, 'index.html'), 'utf8');
  app.get(/^\/(?!api\/|uploads\/|go\/).*/, (req, res) => {
    const head = headFor(req.path, req);
    if (head.noindex) res.set('X-Robots-Tag', 'noindex, nofollow');
    res.status(head.status).type('html').set('Cache-Control', 'no-cache').send(renderShell(shell, head));
  });
}

export default app;
