import Database from 'better-sqlite3';

class UserDAO {
  constructor(dbPath) {
    this.db = new Database(dbPath);
  }

  getUser(username, password) {
    return this.db
      .prepare('SELECT * FROM users WHERE username = ? AND password = ?')
      .get(username, password);
  }

  createUser(username, password) {
    try {
      const stmt = this.db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
      const info = stmt.run(username, password);
      return info.lastInsertRowid;
    } catch (err) {
      throw new Error('Username already exists or database error');
    }
  }
}

export default UserDAO;