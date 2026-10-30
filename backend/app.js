// Express app (no listen) — imported by index.js and by tests.
import express from 'express';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import publicRouter from './routes/public.js';
import adminRouter, { UPLOAD_DIR } from './routes/admin.js';

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

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', fallthrough: false }));
app.use(publicRouter);
app.use('/api/admin', adminRouter);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Built frontend (frontend/dist) with SPA fallback, so one process serves everything.
const DIST = resolve(process.env.FRONTEND_DIST || '../frontend/dist');
if (existsSync(DIST)) {
  app.use(express.static(DIST, { maxAge: '1h', index: false }));
  app.get(/^\/(?!api\/|uploads\/|go\/).*/, (req, res) => res.sendFile(join(DIST, 'index.html')));
}

export default app;
