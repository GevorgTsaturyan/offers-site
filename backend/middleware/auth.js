import jwt from 'jsonwebtoken';

export function jwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return s;
}

export function requireAdmin(req, res, next) {
  const header = req.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  try {
    req.admin = jwt.verify(token, jwtSecret());
    next();
  } catch {
    res.status(401).json({ error: 'Please log in again' });
  }
}
