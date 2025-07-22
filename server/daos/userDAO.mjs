import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

class UserDAO {
  constructor(dbPath) {
    this.db = new Database(dbPath);
  }

  async getUser(username, password) {
    try {
      const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
      const user = stmt.get(username);
      if (!user) {
        return null;
      }
      const match = await bcrypt.compare(password, user.password);
      return match ? user : null;
    } catch (err) {
      throw new Error('Database error');
    }
  }

  async createUser(username, password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = this.db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
      const info = stmt.run(username, hashedPassword);
      return info.lastInsertRowid;
    } catch (err) {
      throw new Error('Username already exists or database error');
    }
  }
}

export default UserDAO;