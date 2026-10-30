import 'dotenv/config';
import { jwtSecret } from './middleware/auth.js';

jwtSecret(); // fail fast if JWT_SECRET is missing

const { default: app } = await import('./app.js');
const PORT = Number(process.env.PORT) || 3010;
app.listen(PORT, '127.0.0.1', () => console.log(`[offers-site] listening on http://127.0.0.1:${PORT}`));
