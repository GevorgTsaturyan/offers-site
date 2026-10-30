// Create or reset an admin user:  npm run create-admin -- <username> <password>
import 'dotenv/config';
import bcrypt from 'bcrypt';

const [username, password] = process.argv.slice(2);
if (!username || !password || password.length < 10) {
  console.error('Usage: npm run create-admin -- <username> <password>   (password: at least 10 characters)');
  process.exit(1);
}

const { default: db } = await import('../db.js');
const hash = await bcrypt.hash(password, 12);
db.prepare(`
  INSERT INTO admin_users (username, password_hash, created_at) VALUES (?, ?, ?)
  ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash
`).run(username, hash, new Date().toISOString());
console.log(`✓ admin user "${username}" saved`);
