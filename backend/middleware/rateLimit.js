// Tiny fixed-window in-memory rate limiter (single process — enough for this site).
export function rateLimit({ windowMs, max }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    let entry = hits.get(key);
    if (!entry || entry.reset <= now) { entry = { count: 0, reset: now + windowMs }; hits.set(key, entry); }
    if (++entry.count > max) return res.status(429).json({ error: 'Too many requests — please try again in a few minutes.' });
    next();
  };
}
