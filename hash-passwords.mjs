// This updates all existing user passwords to hashed versions
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const db = new Database('./database/discoverhealth.db');
const users = db.prepare('SELECT * FROM users').all();
for (const user of users) {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id);
}
console.log('Passwords hashed successfully');
db.close();