import Database from 'better-sqlite3';

class ResourceDAO {
  constructor(dbPath) {
    this.db = new Database(dbPath);
  }

  getResourcesByRegion(region) {
    return this.db
      .prepare('SELECT * FROM healthcare_resources WHERE region = ?')
      .all(region);
  }

  createResource({ name, category, country, region, lat, lon, description }) {
    try {
      const stmt = this.db.prepare(
        'INSERT INTO healthcare_resources (name, category, country, region, lat, lon, description, recommendations) VALUES (?, ?, ?, ?, ?, ?, ?, 0)'
      );
      const info = stmt.run(name, category, country, region, lat, lon, description || '');
      return info.lastInsertRowid;
    } catch (err) {
      throw new Error('Database error');
    }
  }

  incrementRecommendation(id) {
    try {
      const stmt = this.db.prepare(
        'UPDATE healthcare_resources SET recommendations = recommendations + 1 WHERE id = ?'
      );
      const info = stmt.run(id);
      return info.changes > 0;
    } catch (err) {
      throw new Error('Database error');
    }
  }
}

export default ResourceDAO;