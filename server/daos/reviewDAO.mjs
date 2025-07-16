import Database from 'better-sqlite3';

class ReviewDAO {
  constructor(dbPath) {
    this.db = new Database(dbPath);
  }

  createReview(resourceId, userId, review) {
    try {
      const stmt = this.db.prepare(
        'INSERT INTO reviews (resource_id, user_id, review) VALUES (?, ?, ?)'
      );
      const info = stmt.run(resourceId, userId, review.trim());
      return info.lastInsertRowid;
    } catch (err) {
      throw new Error('Database error');
    }
  }

  getResourceExists(resourceId) {
    return this.db
      .prepare('SELECT id FROM healthcare_resources WHERE id = ?')
      .get(resourceId);
  }
}

export default ReviewDAO;